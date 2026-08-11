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

    it('should normalize structured replanner content before parsing', async () => {
      const llm = {
        invoke: async () => new AIMessage({
          content: {
            shouldReplan: true,
            reason: 'Structured content',
            newGoal: 'Structured goal',
          },
        }),
      } as any;

      const replanner = createReplannerNode({ model: llm });
      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [{ id: 'step-1', description: 'First' }],
          goal: 'Test goal',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 0,
        pastSteps: [],
        status: 'replanning',
      };

      const result = await replanner(state as PlanExecuteStateType);

      expect(result.status).toBe('planning');
      expect(result.input).toBe('Structured goal');
    });

    it('should extract JSON text from array-based replanner content before parsing', async () => {
      const llm = {
        invoke: async () => new AIMessage({
          content: [{
            type: 'text',
            text: JSON.stringify({
              shouldReplan: true,
              reason: 'Array content',
              newGoal: 'Array content goal',
            }),
          }],
        }),
      } as any;

      const replanner = createReplannerNode({ model: llm });
      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [{ id: 'step-1', description: 'First' }],
          goal: 'Test goal',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 0,
        pastSteps: [],
        status: 'replanning',
      };

      const result = await replanner(state as PlanExecuteStateType);

      expect(result.status).toBe('planning');
      expect(result.input).toBe('Array content goal');
    });

    it('should omit blank dependency lines for steps with empty dependency arrays', async () => {
      const invoke = vi.fn(async () => new AIMessage({
        content: JSON.stringify({
          shouldReplan: false,
          reason: 'Continue with current plan',
        }),
      }));

      const replanner = createReplannerNode({ model: { invoke } as any });
      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'First', dependencies: [] },
            { id: 'step-2', description: 'Second', dependencies: ['step-1'] },
          ],
          goal: 'Test goal',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 0,
        pastSteps: [],
        status: 'replanning',
      };

      const result = await replanner(state as PlanExecuteStateType);

      expect(result.status).toBe('executing');
      expect(invoke).toHaveBeenCalledTimes(1);

      const messages = invoke.mock.calls[0]?.[0] as Array<{ content: unknown }>;
      const userPrompt = messages[1]?.content;

      expect(typeof userPrompt).toBe('string');
      expect(userPrompt).toContain('Step 1: First');
      expect(userPrompt).not.toContain('Step 1: First\nDependencies: ');
      expect(userPrompt).toContain('Step 2: Second\nDependencies: step-1');
    });

    it('should tolerate unserializable completed step results in replanning prompts', async () => {
      const circular: { self?: unknown } = {};
      circular.self = circular;

      const llm = createMockReplannerLLM(false) as any;
      const replanner = createReplannerNode({ model: llm });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [{ id: 'step-1', description: 'First' }],
          goal: 'Test goal',
          createdAt: new Date().toISOString(),
        },
        pastSteps: [
          {
            step: { id: 'step-1', description: 'First' },
            result: circular,
            success: true,
            timestamp: new Date().toISOString(),
          },
        ],
        currentStepIndex: 0,
        status: 'replanning',
      };

      const result = await replanner(state as PlanExecuteStateType);

      expect(result.status).toBe('executing');
    });

    it('should render undefined completed step results without an unserializable fallback label', async () => {
      const invoke = vi.fn(async () => new AIMessage({
        content: JSON.stringify({
          shouldReplan: false,
          reason: 'Continue with current plan',
        }),
      }));

      const replanner = createReplannerNode({ model: { invoke } as any });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [{ id: 'step-1', description: 'First' }],
          goal: 'Test goal',
          createdAt: new Date().toISOString(),
        },
        pastSteps: [
          {
            step: { id: 'step-1', description: 'First' },
            result: undefined,
            success: true,
            timestamp: new Date().toISOString(),
          },
        ],
        currentStepIndex: 0,
        status: 'replanning',
      };

      const result = await replanner(state as PlanExecuteStateType);

      expect(result.status).toBe('executing');
      expect(invoke).toHaveBeenCalledTimes(1);

      const messages = invoke.mock.calls[0]?.[0] as Array<{ content: unknown }>;
      const userPrompt = messages[1]?.content;

      expect(typeof userPrompt).toBe('string');
      expect(userPrompt).toContain('Result: undefined');
      expect(userPrompt).not.toContain('JSON.stringify returned undefined');
      expect(userPrompt).not.toContain('Unserializable step result');
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
import { describe, it, expect, vi } from 'vitest';
import { AIMessage } from '@langchain/core/messages';
import { createReplannerNode } from '../../../src/plan-execute/nodes.js';
import type { PlanExecuteStateType } from '../../../src/plan-execute/state.js';
import { createMockReplannerLLM, importNodesWithMockedPatternLoggers } from './shared.js';
