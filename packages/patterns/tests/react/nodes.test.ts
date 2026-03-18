import { describe, it, expect, vi } from 'vitest';
import {
  createReasoningNode,
  createActionNode,
  createObservationNode,
} from '../../src/react/nodes.js';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';
import type { ReActStateType } from '../../src/react/state.js';

type MockReasoningResponse = {
  content: string;
  tool_calls?: Array<{
    id?: string;
    name: string;
    args?: Record<string, unknown>;
  }>;
};

// Helper to create mock LLM with custom response
function createMockChatModel(mockResponse?: MockReasoningResponse): BaseChatModel {
  const response = mockResponse || {
    content: 'I need to use a tool',
    tool_calls: [
      {
        id: 'call_123',
        name: 'test-tool',
        args: { input: 'test' },
      },
    ],
  };

  const invoke = vi.fn().mockResolvedValue(new AIMessage(response));
  return {
    bindTools: vi.fn().mockReturnThis(),
    invoke,
  } as unknown as BaseChatModel;
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

  const bigintTool = toolBuilder()
    .name('bigint-tool')
    .description('A test tool for bigint input')
    .category(ToolCategory.UTILITY)
    .schema(z.object({ input: z.bigint().describe('Input') }))
    .implement(async ({ input }) => `BigInt: ${String(input)}`)
    .build();

  describe('createReasoningNode', () => {
    it('should generate thoughts and tool calls', async () => {
      const mockLLM = createMockChatModel();
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
      const mockLLM = createMockChatModel({
        content: 'Final answer',
        tool_calls: [],
      });

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
      const mockLLM = createMockChatModel();
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

    it('should normalize tool messages and append scratchpad context', async () => {
      const invoke = vi.fn().mockResolvedValue(new AIMessage('Final answer'));
      const mockLLM = {
        bindTools: vi.fn().mockReturnThis(),
        invoke,
      } as unknown as BaseChatModel;

      const reasoningNode = createReasoningNode(mockLLM, [testTool], 'System prompt', 10, false);

      await reasoningNode({
        messages: [
          { role: 'user', content: 'Hello' },
          {
            role: 'tool',
            content: 'Tool output',
            name: 'test-tool',
            tool_call_id: 'call_123',
          },
        ],
        thoughts: [],
        actions: [],
        observations: [],
        scratchpad: [
          {
            step: 1,
            thought: 'Need more context',
            action: 'test-tool({"input":"hello"})',
            observation: 'Tool output',
          },
        ],
        iteration: 0,
        shouldContinue: true,
        response: undefined,
      });

      expect(invoke).toHaveBeenCalledTimes(1);

      const [messages] = invoke.mock.calls[0] as [unknown[]];
      expect(messages[2]).toBeInstanceOf(ToolMessage);
      expect((messages[2] as ToolMessage).tool_call_id).toBe('call_123');
      expect(messages[3]).toBeInstanceOf(SystemMessage);
      expect(String((messages[3] as SystemMessage).content)).toContain('Previous steps');
    });

    it('should fall back to a human message when tool_call_id is missing', async () => {
      const invoke = vi.fn().mockResolvedValue(new AIMessage('Final answer'));
      const mockLLM = {
        bindTools: vi.fn().mockReturnThis(),
        invoke,
      } as unknown as BaseChatModel;

      const reasoningNode = createReasoningNode(mockLLM, [testTool], 'System prompt', 10, false);

      await reasoningNode({
        messages: [
          {
            role: 'tool',
            content: 'Detached tool output',
            name: 'test-tool',
          },
        ],
        thoughts: [],
        actions: [],
        observations: [],
        scratchpad: [],
        iteration: 0,
        shouldContinue: true,
        response: undefined,
      });

      const [messages] = invoke.mock.calls[0] as [unknown[]];
      expect(messages[1]).not.toBeInstanceOf(ToolMessage);
      expect((messages[1] as AIMessage | SystemMessage | ToolMessage | { content: string }).content).toBe(
        'Detached tool output'
      );
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

    it('should execute actions when dedup cache key serialization fails', async () => {
      const actionNode = createActionNode([bigintTool], false, true);

      const result = await actionNode({
        messages: [],
        thoughts: [],
        actions: [
          {
            id: 'call_bigint_action',
            name: 'bigint-tool',
            arguments: { input: 1n },
            timestamp: Date.now(),
          },
        ],
        observations: [],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      });

      expect(result.observations).toBeDefined();
      expect(result.observations).toHaveLength(1);
      expect(result.observations?.[0].result).toBe('BigInt: 1');
      expect(result.observations?.[0].isDuplicate).toBeUndefined();
    });
  });

  describe('createObservationNode', () => {
    it('should process observations and update scratchpad', async () => {
      const observationNode = createObservationNode(false, true); // verbose=false, returnIntermediateSteps=true

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
      expect(result.messages![0].tool_call_id).toBe('call_123');
      expect(result.messages![0].name).toBe('test-tool');
    });

    it('should handle error observations', async () => {
      const observationNode = createObservationNode(false, true); // verbose=false, returnIntermediateSteps=true

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

    it('should stringify structured observations and preserve tool names', async () => {
      const observationNode = createObservationNode(false, true);

      const result = await observationNode({
        messages: [],
        thoughts: [{ content: 'Inspect the structured result' }],
        actions: [
          {
            id: 'call_json',
            name: 'test-tool',
            arguments: { input: 'json' },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_json',
            result: { ok: true, count: 2 },
            timestamp: Date.now(),
          },
        ],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      });

      expect(result.messages?.[0].name).toBe('test-tool');
      expect(result.messages?.[0].content).toContain('"ok": true');
      expect(result.scratchpad?.[0].observation).toContain('"count":2');
    });

    it('should preserve undefined observation results as strings in messages and scratchpad', async () => {
      const observationNode = createObservationNode(false, true);

      const result = await observationNode({
        messages: [],
        thoughts: [{ content: 'Inspect missing tool output' }],
        actions: [
          {
            id: 'call_undefined',
            name: 'test-tool',
            arguments: { input: 'undefined' },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_undefined',
            result: undefined,
            timestamp: Date.now(),
          },
        ],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      });

      expect(result.messages?.[0].content).toBe('undefined');
      expect(result.scratchpad?.[0].observation).toContain('undefined');
    });

    it('should fall back to String(result) when JSON serialization throws', async () => {
      const observationNode = createObservationNode(false, true);

      const result = await observationNode({
        messages: [],
        thoughts: [{ content: 'Inspect bigint output' }],
        actions: [
          {
            id: 'call_bigint',
            name: 'test-tool',
            arguments: { input: 'bigint' },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_bigint',
            result: 1n,
            timestamp: Date.now(),
          },
        ],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      });

      expect(result.messages?.[0].content).toBe('1');
      expect(result.scratchpad?.[0].observation).toContain('1');
    });

    it('should stringify action arguments safely when scratchpad formatting sees bigint input', async () => {
      const observationNode = createObservationNode(false, true);

      const result = await observationNode({
        messages: [],
        thoughts: [{ content: 'Inspect bigint action input' }],
        actions: [
          {
            id: 'call_bigint_args',
            name: 'bigint-tool',
            arguments: { input: 1n },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_bigint_args',
            result: 'BigInt: 1',
            timestamp: Date.now(),
          },
        ],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      });

      expect(result.scratchpad?.[0].action).toContain('bigint-tool');
      expect(result.scratchpad?.[0].action).toContain('[object Object]');
    });

    it('should default scratchpad step to 0 when iteration is unset', async () => {
      const observationNode = createObservationNode(false, true);

      const result = await observationNode({
        messages: [],
        thoughts: [{ content: 'Recover missing iteration' }],
        actions: [
          {
            id: 'call_missing_iteration',
            name: 'test-tool',
            arguments: { input: 'hello' },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_missing_iteration',
            result: 'Result: hello',
            timestamp: Date.now(),
          },
        ],
        scratchpad: [],
        iteration: undefined,
        shouldContinue: true,
        response: undefined,
      });

      expect(result.scratchpad?.[0].step).toBe(0);
    });
  });
});
