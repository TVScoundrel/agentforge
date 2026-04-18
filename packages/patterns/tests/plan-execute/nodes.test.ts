import { describe, it, expect, vi } from 'vitest';
import { AIMessage } from '@langchain/core/messages';
import { createPlannerNode, createExecutorNode, createReplannerNode, createFinisherNode } from '../../src/plan-execute/nodes.js';
import type { PlanExecuteStateType } from '../../src/plan-execute/state.js';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { createMockLLM } from '@agentforge/testing';
import { z } from 'zod';

function createMockPatternLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

async function importNodesWithMockedPatternLoggers() {
  vi.resetModules();

  const plannerLogger = createMockPatternLogger();
  const executorLogger = createMockPatternLogger();
  const replannerLogger = createMockPatternLogger();
  const loggersByName = new Map([
    ['agentforge:patterns:plan-execute:planner', plannerLogger],
    ['agentforge:patterns:plan-execute:executor', executorLogger],
    ['agentforge:patterns:plan-execute:replanner', replannerLogger],
  ]);

  vi.doMock('../../src/shared/deduplication.js', async () => {
    const actual = await vi.importActual<typeof import('../../src/shared/deduplication.js')>(
      '../../src/shared/deduplication.js'
    );

    return {
      ...actual,
      createPatternLogger: vi.fn((name: string) => loggersByName.get(name) ?? createMockPatternLogger()),
    };
  });

  const nodesModule = await import('../../src/plan-execute/nodes.js');

  vi.doUnmock('../../src/shared/deduplication.js');
  vi.resetModules();

  return {
    createExecutorNode: nodesModule.createExecutorNode,
    createReplannerNode: nodesModule.createReplannerNode,
    executorWarn: executorLogger.warn,
    replannerWarn: replannerLogger.warn,
  };
}

// Helper to create mock planner LLM
function createMockPlannerLLM() {
  return createMockLLM({
    responseGenerator: () => new AIMessage({
      content: JSON.stringify({
        goal: 'Test goal',
        steps: [
          { id: 'step-1', description: 'First step', tool: 'calculator', args: { a: 1, b: 2 } },
          { id: 'step-2', description: 'Second step', dependencies: ['step-1'] },
        ],
        confidence: 0.9,
      }),
    }),
  });
}

// Helper to create mock replanner LLM
function createMockReplannerLLM(shouldReplan: boolean = false) {
  return createMockLLM({
    responseGenerator: () => new AIMessage({
      content: JSON.stringify({
        shouldReplan,
        reason: shouldReplan ? 'Need to adjust plan' : 'Continue with current plan',
        newGoal: shouldReplan ? 'Updated goal' : undefined,
      }),
    }),
  });
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
      const llm = createMockPlannerLLM() as any;
      const planner = createPlannerNode({ model: llm });
      expect(planner).toBeDefined();
      expect(typeof planner).toBe('function');
    });

    it('should generate a plan from user input', async () => {
      const llm = createMockPlannerLLM() as any;
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

    it('should warn when unsupported executor options are provided', () => {
      return importNodesWithMockedPatternLoggers().then(({ createExecutorNode: createExecutorNodeWithMocks, executorWarn }) => {
        createExecutorNodeWithMocks({
          tools: [calculatorTool],
          model: createMockPlannerLLM() as any,
          parallel: true,
        });

        expect(executorWarn).toHaveBeenCalledWith(
          'ExecutorConfig.model is currently unsupported and will be ignored'
        );
        expect(executorWarn).toHaveBeenCalledWith(
          'ExecutorConfig.parallel is currently unsupported and will be ignored',
          { parallel: true }
        );
      });
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

    it('should clear step timeout after successful execution', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      try {
        const executor = createExecutorNode({ tools: [calculatorTool], stepTimeout: 1000 });

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

        expect(result.pastSteps?.[0].success).toBe(true);
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
      } finally {
        clearTimeoutSpy.mockRestore();
      }
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
      const llm = createMockReplannerLLM() as any;
      const replanner = createReplannerNode({ model: llm });
      expect(replanner).toBeDefined();
      expect(typeof replanner).toBe('function');
    });

    it('should warn when replanThreshold is provided', () => {
      return importNodesWithMockedPatternLoggers().then(({ createReplannerNode: createReplannerNodeWithMocks, replannerWarn }) => {
        createReplannerNodeWithMocks({
          model: createMockReplannerLLM() as any,
          replanThreshold: 0.7,
        });

        expect(replannerWarn).toHaveBeenCalledWith(
          'ReplannerConfig.replanThreshold is currently unsupported and will be ignored',
          { replanThreshold: 0.7 }
        );
      });
    });

    it('should decide to continue with current plan', async () => {
      const llm = createMockReplannerLLM(false) as any;
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
      const llm = createMockReplannerLLM(true) as any;
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



    it('should handle invalid JSON from the replanner LLM', async () => {
      const llm = {
        invoke: async () => new AIMessage({ content: 'not-json' }),
      } as any;

      const replanner = createReplannerNode({ model: llm });
      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'First' },
          ],
          goal: 'Test goal',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 0,
        pastSteps: [],
        status: 'replanning',
      };

      const result = await replanner(state as PlanExecuteStateType);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Failed to parse replan decision');
    });

    it('should handle missing plan', async () => {
      const llm = createMockReplannerLLM() as any;
      const replanner = createReplannerNode({ model: llm });

      const state: Partial<PlanExecuteStateType> = {
        status: 'replanning',
      };

      const result = await replanner(state as PlanExecuteStateType);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('No plan available');
    });
  });

  describe('createFinisherNode', () => {
    it('should summarize completed steps into the final response', async () => {
      const finisher = createFinisherNode();

      const state: Partial<PlanExecuteStateType> = {
        input: 'Original goal',
        plan: {
          steps: [
            { id: 'step-1', description: 'First step' },
            { id: 'step-2', description: 'Second step' },
          ],
          goal: 'Execute the plan',
          createdAt: new Date().toISOString(),
        },
        pastSteps: [
          {
            step: { id: 'step-1', description: 'First step' },
            result: 'ok',
            success: true,
            timestamp: new Date().toISOString(),
          },
          {
            step: { id: 'step-2', description: 'Second step' },
            result: null,
            success: false,
            error: 'failed',
            timestamp: new Date().toISOString(),
          },
        ],
        status: 'executing',
      };

      const result = await finisher(state as PlanExecuteStateType);
      expect(result.status).toBe('completed');

      const response = JSON.parse(result.response ?? '{}');
      expect(response.goal).toBe('Execute the plan');
      expect(response.totalSteps).toBe(2);
      expect(response.successfulSteps).toBe(1);
      expect(response.results).toEqual([
        { step: 'First step', result: 'ok', success: true },
        { step: 'Second step', result: null, success: false },
      ]);
    });
  });

});
