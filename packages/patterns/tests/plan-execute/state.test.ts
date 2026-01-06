import { describe, it, expect } from 'vitest';
import {
  PlanExecuteState,
  PlanExecuteStateConfig,
  type PlanExecuteStateType,
} from '../../src/plan-execute/state.js';
import {
  PlanStepSchema,
  CompletedStepSchema,
  PlanSchema,
  ExecutionStatusSchema,
} from '../../src/plan-execute/schemas.js';

describe('Plan-Execute State', () => {
  describe('State Annotation', () => {
    it('should create state annotation', () => {
      expect(PlanExecuteState).toBeDefined();
      expect(PlanExecuteState.spec).toBeDefined();
    });

    it('should have all required channels', () => {
      const spec = PlanExecuteState.spec;
      expect(spec.input).toBeDefined();
      expect(spec.plan).toBeDefined();
      expect(spec.pastSteps).toBeDefined();
      expect(spec.currentStepIndex).toBeDefined();
      expect(spec.status).toBeDefined();
      expect(spec.response).toBeDefined();
      expect(spec.error).toBeDefined();
      expect(spec.iteration).toBeDefined();
      expect(spec.maxIterations).toBeDefined();
    });
  });

  describe('Schemas', () => {
    it('should validate PlanStep schema', () => {
      const validStep = {
        id: 'step-1',
        description: 'Search for information',
        tool: 'search',
        args: { query: 'test' },
      };

      const result = PlanStepSchema.safeParse(validStep);
      expect(result.success).toBe(true);
    });

    it('should validate PlanStep with dependencies', () => {
      const validStep = {
        id: 'step-2',
        description: 'Analyze results',
        dependencies: ['step-1'],
      };

      const result = PlanStepSchema.safeParse(validStep);
      expect(result.success).toBe(true);
    });

    it('should validate CompletedStep schema', () => {
      const validCompletedStep = {
        step: {
          id: 'step-1',
          description: 'Search for information',
        },
        result: { data: 'test result' },
        success: true,
        timestamp: new Date().toISOString(),
      };

      const result = CompletedStepSchema.safeParse(validCompletedStep);
      expect(result.success).toBe(true);
    });

    it('should validate CompletedStep with error', () => {
      const validCompletedStep = {
        step: {
          id: 'step-1',
          description: 'Search for information',
        },
        result: null,
        success: false,
        error: 'Tool not found',
        timestamp: new Date().toISOString(),
      };

      const result = CompletedStepSchema.safeParse(validCompletedStep);
      expect(result.success).toBe(true);
    });

    it('should validate Plan schema', () => {
      const validPlan = {
        steps: [
          { id: 'step-1', description: 'First step' },
          { id: 'step-2', description: 'Second step', dependencies: ['step-1'] },
        ],
        goal: 'Complete the task',
        createdAt: new Date().toISOString(),
        confidence: 0.9,
      };

      const result = PlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it('should validate ExecutionStatus enum', () => {
      expect(ExecutionStatusSchema.safeParse('planning').success).toBe(true);
      expect(ExecutionStatusSchema.safeParse('executing').success).toBe(true);
      expect(ExecutionStatusSchema.safeParse('replanning').success).toBe(true);
      expect(ExecutionStatusSchema.safeParse('completed').success).toBe(true);
      expect(ExecutionStatusSchema.safeParse('failed').success).toBe(true);
      expect(ExecutionStatusSchema.safeParse('invalid').success).toBe(false);
    });
  });

  describe('State Configuration', () => {
    it('should have correct default values', () => {
      expect(PlanExecuteStateConfig.input.default?.()).toBe('');
      expect(PlanExecuteStateConfig.pastSteps.default?.()).toEqual([]);
      expect(PlanExecuteStateConfig.status.default?.()).toBe('planning');
      expect(PlanExecuteStateConfig.iteration.default?.()).toBe(0);
      expect(PlanExecuteStateConfig.maxIterations.default?.()).toBe(5);
    });

    it('should have correct reducers', () => {
      const pastStepsReducer = PlanExecuteStateConfig.pastSteps.reducer;
      expect(pastStepsReducer).toBeDefined();
      if (pastStepsReducer) {
        const left = [{ step: { id: '1', description: 'test' }, result: 'a', success: true, timestamp: new Date().toISOString() }];
        const right = [{ step: { id: '2', description: 'test2' }, result: 'b', success: true, timestamp: new Date().toISOString() }];
        const result = pastStepsReducer(left, right);
        expect(result).toHaveLength(2);
        expect(result[0].result).toBe('a');
        expect(result[1].result).toBe('b');
      }

      const iterationReducer = PlanExecuteStateConfig.iteration.reducer;
      expect(iterationReducer).toBeDefined();
      if (iterationReducer) {
        expect(iterationReducer(1, 1)).toBe(2);
        expect(iterationReducer(5, 3)).toBe(8);
      }
    });
  });
});

