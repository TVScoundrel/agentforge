import { describe, it, expect, beforeEach } from 'vitest';
import { createExecutorNode } from '../../src/plan-execute/nodes.js';
import type { PlanExecuteStateType, Plan, PlanStep, CompletedStep } from '../../src/plan-execute/state.js';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

describe('Plan-Execute Tool Call Deduplication', () => {
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
      }))
      .implement(async ({ a, b }) => {
        executionCount++;
        return a + b;
      })
      .build();
  });

  describe('Duplicate Detection', () => {
    it('should prevent duplicate step executions with identical tool and arguments', async () => {
      const executorNode = createExecutorNode({
        tools: [searchTool],
        enableDeduplication: true,
      });

      const plan: Plan = {
        goal: 'Search for information',
        steps: [
          {
            id: 'step-1',
            description: 'Search for quantum encryption',
            tool: 'search-tool',
            args: { query: 'quantum encryption' },
          },
          {
            id: 'step-2',
            description: 'Search for quantum encryption again',
            tool: 'search-tool',
            args: { query: 'quantum encryption' }, // Same as step-1
          },
        ],
        confidence: 0.9,
      };

      // Execute first step
      const state1: PlanExecuteStateType = {
        input: 'Search for quantum encryption',
        plan,
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
        iteration: 1,
      };

      const result1 = await executorNode(state1);
      expect(result1.pastSteps).toBeDefined();
      expect(result1.pastSteps!.length).toBe(1);
      expect(result1.pastSteps![0].result).toBe('Results for: quantum encryption');
      expect(executionCount).toBe(1);

      // Execute second step - should be deduplicated
      const state2: PlanExecuteStateType = {
        input: 'Search for quantum encryption',
        plan,
        currentStepIndex: 1,
        pastSteps: result1.pastSteps!,
        status: 'executing',
        iteration: 2,
      };

      const result2 = await executorNode(state2);
      expect(result2.pastSteps).toBeDefined();
      expect(result2.pastSteps!.length).toBe(1);
      expect(result2.pastSteps![0].result).toBe('Results for: quantum encryption');
      expect(executionCount).toBe(1); // Should still be 1, not 2
    });

    it('should execute steps with different arguments', async () => {
      const executorNode = createExecutorNode({
        tools: [searchTool],
        enableDeduplication: true,
      });

      const plan: Plan = {
        goal: 'Search for different topics',
        steps: [
          {
            id: 'step-1',
            description: 'Search for quantum encryption',
            tool: 'search-tool',
            args: { query: 'quantum encryption' },
          },
          {
            id: 'step-2',
            description: 'Search for blockchain',
            tool: 'search-tool',
            args: { query: 'blockchain security' }, // Different query
          },
        ],
        confidence: 0.9,
      };

      // Execute first step
      const state1: PlanExecuteStateType = {
        input: 'Search',
        plan,
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
        iteration: 1,
      };

      const result1 = await executorNode(state1);
      expect(executionCount).toBe(1);

      // Execute second step - different arguments, should execute
      const state2: PlanExecuteStateType = {
        input: 'Search',
        plan,
        currentStepIndex: 1,
        pastSteps: result1.pastSteps!,
        status: 'executing',
        iteration: 2,
      };

      const result2 = await executorNode(state2);
      expect(result2.pastSteps![0].result).toBe('Results for: blockchain security');
      expect(executionCount).toBe(2); // Should execute both
    });

    it('should handle argument order differences correctly', async () => {
      const executorNode = createExecutorNode({
        tools: [calculatorTool],
        enableDeduplication: true,
      });

      const plan: Plan = {
        goal: 'Calculate numbers',
        steps: [
          {
            id: 'step-1',
            description: 'Add 5 and 3',
            tool: 'calculator',
            args: { a: 5, b: 3 },
          },
          {
            id: 'step-2',
            description: 'Add 5 and 3 again',
            tool: 'calculator',
            args: { b: 3, a: 5 }, // Same values, different order
          },
        ],
        confidence: 0.9,
      };

      // Execute first step
      const state1: PlanExecuteStateType = {
        input: 'Calculate',
        plan,
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
        iteration: 1,
      };

      const result1 = await executorNode(state1);
      expect(executionCount).toBe(1);

      // Execute second step - should deduplicate despite order difference
      const state2: PlanExecuteStateType = {
        input: 'Calculate',
        plan,
        currentStepIndex: 1,
        pastSteps: result1.pastSteps!,
        status: 'executing',
        iteration: 2,
      };

      const result2 = await executorNode(state2);
      expect(executionCount).toBe(1); // Should deduplicate
    });
  });

  describe('Configuration', () => {
    it('should allow disabling deduplication', async () => {
      const executorNode = createExecutorNode({
        tools: [searchTool],
        enableDeduplication: false, // Disabled
      });

      const plan: Plan = {
        goal: 'Search twice',
        steps: [
          {
            id: 'step-1',
            description: 'Search',
            tool: 'search-tool',
            args: { query: 'test' },
          },
          {
            id: 'step-2',
            description: 'Search again',
            tool: 'search-tool',
            args: { query: 'test' },
          },
        ],
        confidence: 0.9,
      };

      // Execute first step
      const state1: PlanExecuteStateType = {
        input: 'Search',
        plan,
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
        iteration: 1,
      };

      const result1 = await executorNode(state1);
      expect(executionCount).toBe(1);

      // Execute second step - should execute again (not deduplicated)
      const state2: PlanExecuteStateType = {
        input: 'Search',
        plan,
        currentStepIndex: 1,
        pastSteps: result1.pastSteps!,
        status: 'executing',
        iteration: 2,
      };

      const result2 = await executorNode(state2);
      expect(executionCount).toBe(2); // Should execute both times
    });
  });

  describe('Error Handling', () => {
    it('should cache and return errors for duplicate steps', async () => {
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

      const executorNode = createExecutorNode({
        tools: [errorTool],
        enableDeduplication: true,
      });

      const plan: Plan = {
        goal: 'Execute error tool twice',
        steps: [
          {
            id: 'step-1',
            description: 'Execute error tool',
            tool: 'error-tool',
            args: { input: 'test' },
          },
          {
            id: 'step-2',
            description: 'Execute error tool again',
            tool: 'error-tool',
            args: { input: 'test' },
          },
        ],
        confidence: 0.9,
      };

      // Execute first step - should fail
      const state1: PlanExecuteStateType = {
        input: 'Test',
        plan,
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
        iteration: 1,
      };

      const result1 = await executorNode(state1);
      expect(result1.pastSteps![0].success).toBe(false);
      expect(result1.pastSteps![0].error).toContain('Tool execution failed');
      expect(executionCount).toBe(1);

      // Execute second step - should return cached error
      const state2: PlanExecuteStateType = {
        input: 'Test',
        plan,
        currentStepIndex: 1,
        pastSteps: result1.pastSteps!,
        status: 'executing',
        iteration: 2,
      };

      const result2 = await executorNode(state2);
      expect(result2.pastSteps![0].success).toBe(false);
      expect(result2.pastSteps![0].error).toContain('Tool execution failed');
      expect(executionCount).toBe(1); // Should not execute again
    });
  });

  describe('Steps Without Tools', () => {
    it('should handle steps without tools (no deduplication needed)', async () => {
      const executorNode = createExecutorNode({
        tools: [searchTool],
        enableDeduplication: true,
      });

      const plan: Plan = {
        goal: 'Mixed steps',
        steps: [
          {
            id: 'step-1',
            description: 'Manual step without tool',
            // No tool specified
          },
          {
            id: 'step-2',
            description: 'Another manual step',
            // No tool specified
          },
        ],
        confidence: 0.9,
      };

      // Execute first step
      const state1: PlanExecuteStateType = {
        input: 'Test',
        plan,
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
        iteration: 1,
      };

      const result1 = await executorNode(state1);
      expect(result1.pastSteps![0].success).toBe(true);
      expect(executionCount).toBe(0); // No tool executed

      // Execute second step
      const state2: PlanExecuteStateType = {
        input: 'Test',
        plan,
        currentStepIndex: 1,
        pastSteps: result1.pastSteps!,
        status: 'executing',
        iteration: 2,
      };

      const result2 = await executorNode(state2);
      expect(result2.pastSteps![0].success).toBe(true);
      expect(executionCount).toBe(0); // Still no tool executed
    });
  });
});
