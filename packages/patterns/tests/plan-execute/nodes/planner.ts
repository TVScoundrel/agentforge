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

    it('should normalize structured model content before parsing', async () => {
      const llm = {
        invoke: async () => new AIMessage({
          content: {
            goal: 'Structured goal',
            steps: [{ id: 'step-1', description: 'Structured step' }],
          },
        }),
      } as any;

      const planner = createPlannerNode({ model: llm });
      const state: Partial<PlanExecuteStateType> = { input: 'Test', status: 'planning' };
      const result = await planner(state as PlanExecuteStateType);

      expect(result.status).toBe('executing');
      expect(result.plan?.goal).toBe('Structured goal');
      expect(result.plan?.steps).toHaveLength(1);
    });

    it('should extract JSON text from array-based planner content before parsing', async () => {
      const llm = {
        invoke: async () => new AIMessage({
          content: [{
            type: 'text',
            text: JSON.stringify({
              goal: 'Array content goal',
              steps: [{ id: 'step-1', description: 'Array content step' }],
            }),
          }],
        }),
      } as any;

      const planner = createPlannerNode({ model: llm });
      const state: Partial<PlanExecuteStateType> = { input: 'Test', status: 'planning' };
      const result = await planner(state as PlanExecuteStateType);

      expect(result.status).toBe('executing');
      expect(result.plan?.goal).toBe('Array content goal');
      expect(result.plan?.steps).toHaveLength(1);
    });
  });
import { describe, it, expect } from 'vitest';
import { AIMessage } from '@langchain/core/messages';
import { createPlannerNode } from '../../../src/plan-execute/nodes.js';
import type { PlanExecuteStateType } from '../../../src/plan-execute/state.js';
import { createMockPlannerLLM } from './shared.js';
