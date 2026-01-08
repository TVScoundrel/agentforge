import { describe, it, expect, vi } from 'vitest';
import { AIMessage } from '@langchain/core/messages';
import { createPlannerNode, createExecutorNode, createReplannerNode } from '../../src/plan-execute/nodes.js';
import type { PlanExecuteStateType } from '../../src/plan-execute/state.js';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// Mock LLM for planner
class MockPlannerLLM {
  async invoke() {
    return new AIMessage({
      content: JSON.stringify({
        goal: 'Test goal',
        steps: [
          { id: 'step-1', description: 'First step', tool: 'calculator', args: { a: 1, b: 2 } },
          { id: 'step-2', description: 'Second step', dependencies: ['step-1'] },
        ],
        confidence: 0.9,
      }),
    });
  }
}

// Mock LLM for replanner
class MockReplannerLLM {
  private shouldReplan: boolean;

  constructor(shouldReplan: boolean = false) {
    this.shouldReplan = shouldReplan;
  }

  async invoke() {
    return new AIMessage({
      content: JSON.stringify({
        shouldReplan: this.shouldReplan,
        reason: this.shouldReplan ? 'Need to adjust plan' : 'Continue with current plan',
        newGoal: this.shouldReplan ? 'Updated goal' : undefined,
      }),
    });
  }
}

// Create a simple calculator tool
const calculatorTool = toolBuilder()
  .name('calculator')
  .description('Perform basic arithmetic')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }))
  .implement(async ({ a, b }) => a + b)
  .build();

describe('Plan-Execute Nodes', () => {
  describe('createPlannerNode', () => {
    it('should create a planner node', () => {
      const llm = new MockPlannerLLM() as any;
      const planner = createPlannerNode({ model: llm });
      expect(planner).toBeDefined();
      expect(typeof planner).toBe('function');
    });

    it('should generate a plan from user input', async () => {
      const llm = new MockPlannerLLM() as any;
      const planner = createPlannerNode({ model: llm });

      const state: Partial<PlanExecuteStateType> = {
        input: 'Calculate 1 + 2',
        status: 'planning',
      };

      const result = await planner(state as PlanExecuteStateType);

      expect(result.plan).toBeDefined();
      expect(result.plan?.steps).toHaveLength(2);
      expect(result.plan?.goal).toBe('Test goal');
      expect(result.status).toBe('executing');
      expect(result.currentStepIndex).toBe(0);
    });

    it('should limit plan steps to maxSteps', async () => {
      const llm = {
        invoke: async () => new AIMessage({
          content: JSON.stringify({
            goal: 'Test',
            steps: Array.from({ length: 10 }, (_, i) => ({
              id: `step-${i}`,
              description: `Step ${i}`,
            })),
          }),
        }),
      } as any;

      const planner = createPlannerNode({ model: llm, maxSteps: 3 });
      const state: Partial<PlanExecuteStateType> = { input: 'Test', status: 'planning' };
      const result = await planner(state as PlanExecuteStateType);

      expect(result.plan?.steps).toHaveLength(3);
    });

    it('should handle LLM errors gracefully', async () => {
      const llm = {
        invoke: async () => {
          throw new Error('LLM error');
        },
      } as any;

      const planner = createPlannerNode({ model: llm });
      const state: Partial<PlanExecuteStateType> = { input: 'Test', status: 'planning' };
      const result = await planner(state as PlanExecuteStateType);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('LLM error');
    });

    it('should handle invalid JSON from LLM', async () => {
      const llm = {
        invoke: async () => new AIMessage({ content: 'Not valid JSON' }),
      } as any;

      const planner = createPlannerNode({ model: llm });
      const state: Partial<PlanExecuteStateType> = { input: 'Test', status: 'planning' };
      const result = await planner(state as PlanExecuteStateType);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Failed to parse plan');
    });
  });

  describe('createExecutorNode', () => {
    it('should create an executor node', () => {
      const executor = createExecutorNode({ tools: [calculatorTool] });
      expect(executor).toBeDefined();
      expect(typeof executor).toBe('function');
    });

    it('should execute a step with a tool', async () => {
      const executor = createExecutorNode({ tools: [calculatorTool] });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'Add numbers', tool: 'calculator', args: { a: 5, b: 3 } },
          ],
          goal: 'Calculate',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
      };

      const result = await executor(state as PlanExecuteStateType);

      expect(result.pastSteps).toHaveLength(1);
      expect(result.pastSteps?.[0].success).toBe(true);
      expect(result.pastSteps?.[0].result).toBe(8);
      expect(result.currentStepIndex).toBe(1);
    });

    it('should handle tool not found', async () => {
      const executor = createExecutorNode({ tools: [calculatorTool] });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'Use unknown tool', tool: 'unknown_tool' },
          ],
          goal: 'Test',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
      };

      const result = await executor(state as PlanExecuteStateType);

      expect(result.pastSteps).toHaveLength(1);
      expect(result.pastSteps?.[0].success).toBe(false);
      expect(result.pastSteps?.[0].error).toContain('Tool not found');
    });

    it('should execute step without tool', async () => {
      const executor = createExecutorNode({ tools: [] });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'Manual step' },
          ],
          goal: 'Test',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
      };

      const result = await executor(state as PlanExecuteStateType);

      expect(result.pastSteps).toHaveLength(1);
      expect(result.pastSteps?.[0].success).toBe(true);
      expect(result.currentStepIndex).toBe(1);
    });

    it('should check dependencies before execution', async () => {
      const executor = createExecutorNode({ tools: [] });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'First' },
            { id: 'step-2', description: 'Second', dependencies: ['step-1'] },
          ],
          goal: 'Test',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 1,
        pastSteps: [], // step-1 not completed
        status: 'executing',
      };

      const result = await executor(state as PlanExecuteStateType);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Unmet dependencies');
    });

    it('should mark as completed when no more steps', async () => {
      const executor = createExecutorNode({ tools: [] });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'Only step' },
          ],
          goal: 'Test',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 1, // Past the last step
        pastSteps: [],
        status: 'executing',
      };

      const result = await executor(state as PlanExecuteStateType);

      expect(result.status).toBe('completed');
    });
  });

  describe('createReplannerNode', () => {
    it('should create a replanner node', () => {
      const llm = new MockReplannerLLM() as any;
      const replanner = createReplannerNode({ model: llm });
      expect(replanner).toBeDefined();
      expect(typeof replanner).toBe('function');
    });

    it('should decide to continue with current plan', async () => {
      const llm = new MockReplannerLLM(false) as any;
      const replanner = createReplannerNode({ model: llm });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'First' },
            { id: 'step-2', description: 'Second' },
          ],
          goal: 'Test goal',
          createdAt: new Date().toISOString(),
        },
        pastSteps: [
          {
            step: { id: 'step-1', description: 'First' },
            result: 'Success',
            success: true,
            timestamp: new Date().toISOString(),
          },
        ],
        currentStepIndex: 1,
        status: 'replanning',
      };

      const result = await replanner(state as PlanExecuteStateType);

      expect(result.status).toBe('executing');
    });

    it('should decide to replan', async () => {
      const llm = new MockReplannerLLM(true) as any;
      const replanner = createReplannerNode({ model: llm });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'First' },
            { id: 'step-2', description: 'Second' },
          ],
          goal: 'Test goal',
          createdAt: new Date().toISOString(),
        },
        pastSteps: [
          {
            step: { id: 'step-1', description: 'First' },
            result: null,
            success: false,
            error: 'Failed',
            timestamp: new Date().toISOString(),
          },
        ],
        currentStepIndex: 1,
        status: 'replanning',
      };

      const result = await replanner(state as PlanExecuteStateType);

      expect(result.status).toBe('planning');
      expect(result.input).toBe('Updated goal');
    });

    it('should handle missing plan', async () => {
      const llm = new MockReplannerLLM() as any;
      const replanner = createReplannerNode({ model: llm });

      const state: Partial<PlanExecuteStateType> = {
        status: 'replanning',
      };

      const result = await replanner(state as PlanExecuteStateType);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('No plan available');
    });
  });
});

