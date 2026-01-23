import { describe, it, expect, beforeEach } from 'vitest';
import { createActionNode } from '../../src/react/nodes.js';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import type { ReActStateType } from '../../src/react/state.js';
import type { ToolCall } from '../../src/react/schemas.js';

describe('ReAct Tool Call Deduplication', () => {
  // Create a test tool with execution tracking
  let executionCount = 0;
  let searchTool: any;
  let calculatorTool: any;

  beforeEach(() => {
    executionCount = 0;

    searchTool = toolBuilder()
      .name('search-tool')
      .description('Search for information')
      .category(ToolCategory.WEB)
      .schema(z.object({ query: z.string().describe('Search query') }))
      .implement(async ({ query }) => {
        executionCount++;
        return `Results for: ${query}`;
      })
      .build();

    calculatorTool = toolBuilder()
      .name('calculator')
      .description('Perform calculations')
      .category(ToolCategory.UTILITY)
      .schema(z.object({
        a: z.number().describe('First number'),
        b: z.number().describe('Second number'),
        operation: z.enum(['add', 'subtract']).describe('Operation'),
      }))
      .implement(async ({ a, b, operation }) => {
        executionCount++;
        return operation === 'add' ? a + b : a - b;
      })
      .build();
  });

  describe('Duplicate Detection', () => {
    it('should prevent duplicate tool calls with identical arguments', async () => {
      const actionNode = createActionNode([searchTool], false, true);

      // First iteration - execute the tool
      const state1: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          {
            id: 'call_1',
            name: 'search-tool',
            arguments: { query: 'quantum encryption' },
            timestamp: Date.now(),
          },
        ],
        observations: [],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      };

      const result1 = await actionNode(state1);
      expect(result1.observations).toBeDefined();
      expect(result1.observations!.length).toBe(1);
      expect(result1.observations![0].result).toBe('Results for: quantum encryption');
      expect(result1.observations![0].isDuplicate).toBeUndefined();
      expect(executionCount).toBe(1);

      // Second iteration - same tool call should be deduplicated
      const state2: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          ...(state1.actions as ToolCall[]),
          {
            id: 'call_2',
            name: 'search-tool',
            arguments: { query: 'quantum encryption' }, // Same arguments
            timestamp: Date.now(),
          },
        ],
        observations: result1.observations!,
        scratchpad: [],
        iteration: 2,
        shouldContinue: true,
        response: undefined,
      };

      const result2 = await actionNode(state2);
      expect(result2.observations).toBeDefined();
      expect(result2.observations!.length).toBe(1);
      expect(result2.observations![0].result).toBe('Results for: quantum encryption');
      expect(result2.observations![0].isDuplicate).toBe(true);
      expect(executionCount).toBe(1); // Should still be 1, not 2
    });

    it('should execute tool calls with different arguments', async () => {
      const actionNode = createActionNode([searchTool], false, true);

      // First iteration
      const state1: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          {
            id: 'call_1',
            name: 'search-tool',
            arguments: { query: 'quantum encryption' },
            timestamp: Date.now(),
          },
        ],
        observations: [],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      };

      const result1 = await actionNode(state1);
      expect(executionCount).toBe(1);

      // Second iteration - different query
      const state2: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          ...(state1.actions as ToolCall[]),
          {
            id: 'call_2',
            name: 'search-tool',
            arguments: { query: 'blockchain security' }, // Different arguments
            timestamp: Date.now(),
          },
        ],
        observations: result1.observations!,
        scratchpad: [],
        iteration: 2,
        shouldContinue: true,
        response: undefined,
      };

      const result2 = await actionNode(state2);
      expect(result2.observations).toBeDefined();
      expect(result2.observations!.length).toBe(1);
      expect(result2.observations![0].result).toBe('Results for: blockchain security');
      expect(result2.observations![0].isDuplicate).toBeUndefined();
      expect(executionCount).toBe(2); // Should execute both
    });

    it('should handle argument order differences correctly', async () => {
      const actionNode = createActionNode([calculatorTool], false, true);

      // First iteration
      const state1: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          {
            id: 'call_1',
            name: 'calculator',
            arguments: { a: 5, b: 3, operation: 'add' },
            timestamp: Date.now(),
          },
        ],
        observations: [],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      };

      const result1 = await actionNode(state1);
      expect(executionCount).toBe(1);

      // Second iteration - same arguments but different order (should still deduplicate)
      const state2: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          ...(state1.actions as ToolCall[]),
          {
            id: 'call_2',
            name: 'calculator',
            arguments: { operation: 'add', b: 3, a: 5 }, // Different order, same values
            timestamp: Date.now(),
          },
        ],
        observations: result1.observations!,
        scratchpad: [],
        iteration: 2,
        shouldContinue: true,
        response: undefined,
      };

      const result2 = await actionNode(state2);
      expect(result2.observations![0].isDuplicate).toBe(true);
      expect(executionCount).toBe(1); // Should deduplicate despite order difference
    });

    it('should deduplicate multiple duplicate calls in same iteration', async () => {
      const actionNode = createActionNode([searchTool], false, true);

      // First iteration - execute once
      const state1: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          {
            id: 'call_1',
            name: 'search-tool',
            arguments: { query: 'test' },
            timestamp: Date.now(),
          },
        ],
        observations: [],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      };

      const result1 = await actionNode(state1);
      expect(executionCount).toBe(1);

      // Second iteration - multiple duplicate calls
      const state2: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          ...(state1.actions as ToolCall[]),
          {
            id: 'call_2',
            name: 'search-tool',
            arguments: { query: 'test' },
            timestamp: Date.now(),
          },
          {
            id: 'call_3',
            name: 'search-tool',
            arguments: { query: 'test' },
            timestamp: Date.now(),
          },
        ],
        observations: result1.observations!,
        scratchpad: [],
        iteration: 2,
        shouldContinue: true,
        response: undefined,
      };

      const result2 = await actionNode(state2);
      expect(result2.observations).toBeDefined();
      expect(result2.observations!.length).toBe(2);
      expect(result2.observations![0].isDuplicate).toBe(true);
      expect(result2.observations![1].isDuplicate).toBe(true);
      expect(executionCount).toBe(1); // Should still be 1
    });
  });

  describe('Configuration', () => {
    it('should allow disabling deduplication', async () => {
      const actionNode = createActionNode([searchTool], false, false); // Disabled

      // First iteration
      const state1: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          {
            id: 'call_1',
            name: 'search-tool',
            arguments: { query: 'test' },
            timestamp: Date.now(),
          },
        ],
        observations: [],
        scratchpad: [],
        iteration: 1,
        shouldContinue: true,
        response: undefined,
      };

      const result1 = await actionNode(state1);
      expect(executionCount).toBe(1);

      // Second iteration - same call should execute again
      const state2: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          ...(state1.actions as ToolCall[]),
          {
            id: 'call_2',
            name: 'search-tool',
            arguments: { query: 'test' },
            timestamp: Date.now(),
          },
        ],
        observations: result1.observations!,
        scratchpad: [],
        iteration: 2,
        shouldContinue: true,
        response: undefined,
      };

      const result2 = await actionNode(state2);
      expect(result2.observations![0].isDuplicate).toBeUndefined();
      expect(executionCount).toBe(2); // Should execute both times
    });
  });

  describe('Error Handling', () => {
    it('should cache and return errors for duplicate calls', async () => {
      const errorTool = toolBuilder()
        .category(ToolCategory.UTILITY)
        .name('error-tool')
        .description('A tool that throws errors')
        .schema(z.object({ input: z.string().describe('Test input') }))
        .implement(async () => {
          executionCount++;
          throw new Error('Tool execution failed');
        })
        .build();

      const actionNode = createActionNode([errorTool as any], false, true);

      // First iteration - tool fails
      const state1: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          {
            id: 'call_1',
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

      const result1 = await actionNode(state1);
      expect(result1.observations![0].error).toContain('Tool execution failed');
      expect(executionCount).toBe(1);

      // Second iteration - same call should return cached error
      const state2: ReActStateType = {
        messages: [],
        thoughts: [],
        actions: [
          ...(state1.actions as ToolCall[]),
          {
            id: 'call_2',
            name: 'error-tool',
            arguments: { input: 'test' },
            timestamp: Date.now(),
          },
        ],
        observations: result1.observations!,
        scratchpad: [],
        iteration: 2,
        shouldContinue: true,
        response: undefined,
      };

      const result2 = await actionNode(state2);
      expect(result2.observations![0].error).toContain('Tool execution failed');
      expect(result2.observations![0].isDuplicate).toBe(true);
      expect(executionCount).toBe(1); // Should not execute again
    });
  });
});

