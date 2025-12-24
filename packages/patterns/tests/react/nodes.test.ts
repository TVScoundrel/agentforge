import { describe, it, expect, vi } from 'vitest';
import {
  createReasoningNode,
  createActionNode,
  createObservationNode,
} from '../../src/react/nodes.js';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import type { ReActStateType } from '../../src/react/state.js';

// Mock LLM for testing
class MockChatModel {
  private mockResponse: any;

  constructor(mockResponse?: any) {
    this.mockResponse = mockResponse || {
      content: 'I need to use a tool',
      tool_calls: [
        {
          id: 'call_123',
          name: 'test-tool',
          args: { input: 'test' },
        },
      ],
    };
  }

  async invoke() {
    return this.mockResponse;
  }

  bindTools() {
    return this;
  }
}

describe('ReAct Nodes', () => {
  // Create a test tool
  const testTool = toolBuilder()
    .name('test-tool')
    .description('A test tool')
    .category(ToolCategory.UTILITY)
    .schema(z.object({ input: z.string().describe('Input') }))
    .implement(async ({ input }) => `Result: ${input}`)
    .build();

  describe('createReasoningNode', () => {
    it('should generate thoughts and tool calls', async () => {
      const mockLLM = new MockChatModel() as any;
      const reasoningNode = createReasoningNode(mockLLM, [testTool], 'System prompt', 10, false);

      const initialState: ReActStateType = {
        messages: [{ role: 'user', content: 'Hello' }],
        thoughts: [],
        actions: [],
        observations: [],
        scratchpad: [],
        iteration: 0,
        shouldContinue: true,
        response: undefined,
      };

      const result = await reasoningNode(initialState);

      expect(result.thoughts).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.actions!.length).toBeGreaterThan(0);
      expect(result.iteration).toBe(1);
    });

    it('should set shouldContinue to false when no tool calls', async () => {
      const mockLLM = new MockChatModel({
        content: 'Final answer',
        tool_calls: [],
      }) as any;

      const reasoningNode = createReasoningNode(mockLLM, [testTool], 'System prompt', 10, false);

      const initialState: ReActStateType = {
        messages: [{ role: 'user', content: 'Hello' }],
        thoughts: [],
        actions: [],
        observations: [],
        scratchpad: [],
        iteration: 0,
        shouldContinue: true,
        response: undefined,
      };

      const result = await reasoningNode(initialState);

      expect(result.shouldContinue).toBe(false);
      expect(result.response).toBe('Final answer');
    });

    it('should respect max iterations', async () => {
      const mockLLM = new MockChatModel() as any;
      const reasoningNode = createReasoningNode(mockLLM, [testTool], 'System prompt', 5, false);

      const initialState: ReActStateType = {
        messages: [{ role: 'user', content: 'Hello' }],
        thoughts: [],
        actions: [],
        observations: [],
        scratchpad: [],
        iteration: 4, // At max iterations
        shouldContinue: true,
        response: undefined,
      };

      const result = await reasoningNode(initialState);

      expect(result.shouldContinue).toBe(false);
    });
  });

  describe('createActionNode', () => {
    it('should execute tool calls successfully', async () => {
      const actionNode = createActionNode([testTool], false);

      const state: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          {
            id: 'call_123',
            name: 'test-tool',
            arguments: { input: 'hello' },
            timestamp: Date.now(),
          },
        ],
        observations: [],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      };

      const result = await actionNode(state);

      expect(result.observations).toBeDefined();
      expect(result.observations!.length).toBe(1);
      expect(result.observations![0].result).toBe('Result: hello');
      expect(result.observations![0].error).toBeUndefined();
    });

    it('should handle tool not found errors', async () => {
      const actionNode = createActionNode([testTool], false);

      const state: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          {
            id: 'call_456',
            name: 'non-existent-tool',
            arguments: {},
            timestamp: Date.now(),
          },
        ],
        observations: [],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      };

      const result = await actionNode(state);

      expect(result.observations).toBeDefined();
      expect(result.observations!.length).toBe(1);
      expect(result.observations![0].error).toContain('not found');
    });

    it('should handle tool execution errors', async () => {
      const errorTool = toolBuilder()
        .name('error-tool')
        .description('A tool that throws errors')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async () => {
          throw new Error('Tool execution failed');
        })
        .build();

      const actionNode = createActionNode([errorTool], false);

      const state: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          {
            id: 'call_789',
            name: 'error-tool',
            arguments: { input: 'test' },
            timestamp: Date.now(),
          },
        ],
        observations: [],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      };

      const result = await actionNode(state);

      expect(result.observations).toBeDefined();
      expect(result.observations!.length).toBe(1);
      expect(result.observations![0].error).toBe('Tool execution failed');
    });
  });

  describe('createObservationNode', () => {
    it('should process observations and update scratchpad', async () => {
      const observationNode = createObservationNode(false);

      const state: ReActStateType = {
        messages: [],
        thoughts: [{ content: 'I should use the test tool' }],
        actions: [
          {
            id: 'call_123',
            name: 'test-tool',
            arguments: { input: 'hello' },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_123',
            result: 'Result: hello',
            timestamp: Date.now(),
          },
        ],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      };

      const result = await observationNode(state);

      expect(result.scratchpad).toBeDefined();
      expect(result.scratchpad!.length).toBe(1);
      expect(result.scratchpad![0].step).toBe(1);
      expect(result.scratchpad![0].thought).toContain('test tool');
      expect(result.scratchpad![0].observation).toContain('Result: hello');
    });

    it('should add observation messages', async () => {
      const observationNode = createObservationNode(false);

      const state: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          {
            id: 'call_123',
            name: 'test-tool',
            arguments: { input: 'hello' },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_123',
            result: 'Success',
            timestamp: Date.now(),
          },
        ],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      };

      const result = await observationNode(state);

      expect(result.messages).toBeDefined();
      expect(result.messages!.length).toBe(1);
      expect(result.messages![0].role).toBe('tool');
      expect(result.messages![0].content).toBe('Success');
    });

    it('should handle error observations', async () => {
      const observationNode = createObservationNode(false);

      const state: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          {
            id: 'call_456',
            name: 'error-tool',
            arguments: {},
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_456',
            result: null,
            error: 'Tool failed',
            timestamp: Date.now(),
          },
        ],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      };

      const result = await observationNode(state);

      expect(result.scratchpad![0].observation).toContain('Error: Tool failed');
      expect(result.messages![0].content).toContain('Error: Tool failed');
    });
  });
});

