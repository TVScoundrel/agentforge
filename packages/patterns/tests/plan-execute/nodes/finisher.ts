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

    it('should fall back when a completed step result is not JSON serializable', async () => {
      const circular: { self?: unknown } = {};
      circular.self = circular;

      const finisher = createFinisherNode();
      const state: Partial<PlanExecuteStateType> = {
        input: 'Original goal',
        pastSteps: [
          {
            step: { id: 'step-1', description: 'Circular step' },
            result: circular,
            success: true,
            timestamp: new Date().toISOString(),
          },
        ],
        status: 'executing',
      };

      const result = await finisher(state as PlanExecuteStateType);
      const response = JSON.parse(result.response ?? '{}');

      expect(response.status).toBeUndefined();
      expect(response.results[0].step).toBe('Circular step');
      expect(response.results[0].result).toContain('Unserializable step result');
      expect(result.status).toBe('completed');
    });

    it('should omit undefined-like results from the final response payload', async () => {
      const finisher = createFinisherNode();
      const state: Partial<PlanExecuteStateType> = {
        input: 'Original goal',
        pastSteps: [
          {
            step: { id: 'step-1', description: 'Undefined step' },
            result: undefined,
            success: true,
            timestamp: new Date().toISOString(),
          },
        ],
        status: 'executing',
      };

      const result = await finisher(state as PlanExecuteStateType);
      const response = JSON.parse(result.response ?? '{}');

      expect(response.results[0]).not.toHaveProperty('result');
      expect(result.status).toBe('completed');
    });
  });
import { describe, it, expect } from 'vitest';
import { createFinisherNode } from '../../../src/plan-execute/nodes.js';
import type { PlanExecuteStateType } from '../../../src/plan-execute/state.js';
