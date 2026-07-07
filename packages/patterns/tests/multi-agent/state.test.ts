import { describe, expect, it } from 'vitest';
import {
  MultiAgentState,
  MultiAgentStateConfig,
} from '../../src/multi-agent/state.js';
import {
  type AgentMessage,
  type WorkerCapabilities,
} from '../../src/multi-agent/schemas.js';

describe('Multi-Agent State', () => {
  describe('State Annotation', () => {
    it('should create state annotation', () => {
      expect(MultiAgentState).toBeDefined();
      expect(MultiAgentState.spec).toBeDefined();
    });

    it('should have all required channels', () => {
      const spec = MultiAgentState.spec;
      expect(spec.input).toBeDefined();
      expect(spec.messages).toBeDefined();
      expect(spec.workers).toBeDefined();
      expect(spec.currentAgent).toBeDefined();
      expect(spec.routingHistory).toBeDefined();
      expect(spec.activeAssignments).toBeDefined();
      expect(spec.completedTasks).toBeDefined();
      expect(spec.handoffs).toBeDefined();
      expect(spec.status).toBeDefined();
      expect(spec.iteration).toBeDefined();
      expect(spec.maxIterations).toBeDefined();
      expect(spec.response).toBeDefined();
      expect(spec.error).toBeDefined();
    });
  });

  describe('State Configuration', () => {
    it('should have correct default values', () => {
      expect(MultiAgentStateConfig.input.default?.()).toBe('');
      expect(MultiAgentStateConfig.messages.default?.()).toEqual([]);
      expect(MultiAgentStateConfig.workers.default?.()).toEqual({});
      expect(MultiAgentStateConfig.routingHistory.default?.()).toEqual([]);
      expect(MultiAgentStateConfig.activeAssignments.default?.()).toEqual([]);
      expect(MultiAgentStateConfig.completedTasks.default?.()).toEqual([]);
      expect(MultiAgentStateConfig.handoffs.default?.()).toEqual([]);
      expect(MultiAgentStateConfig.status.default?.()).toBe('initializing');
      expect(MultiAgentStateConfig.iteration.default?.()).toBe(0);
      expect(MultiAgentStateConfig.maxIterations.default?.()).toBe(10);
    });

    it('should have correct reducers for arrays', () => {
      const messagesReducer = MultiAgentStateConfig.messages.reducer;
      expect(messagesReducer).toBeDefined();
      if (messagesReducer) {
        const left: AgentMessage[] = [{ id: '1', type: 'user_input', from: 'user', to: 'supervisor', content: 'test', timestamp: Date.now() }];
        const right: AgentMessage[] = [{ id: '2', type: 'task_assignment', from: 'supervisor', to: 'worker-1', content: 'task', timestamp: Date.now() }];
        const result = messagesReducer(left, right);
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('1');
        expect(result[1].id).toBe('2');
      }

      const iterationReducer = MultiAgentStateConfig.iteration.reducer;
      expect(iterationReducer).toBeDefined();
      if (iterationReducer) {
        expect(iterationReducer(1, 1)).toBe(2);
        expect(iterationReducer(5, 3)).toBe(8);
      }
    });

    it('should have correct reducer for workers record', () => {
      const workersReducer = MultiAgentStateConfig.workers.reducer;
      expect(workersReducer).toBeDefined();
      if (workersReducer) {
        const left: Record<string, WorkerCapabilities> = {
          'worker-1': {
            skills: [],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        };
        const right: Record<string, WorkerCapabilities> = {
          'worker-2': {
            skills: [],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        };
        const result = workersReducer(left, right);
        expect(Object.keys(result)).toHaveLength(2);
        expect(result['worker-1']).toBeDefined();
        expect(result['worker-2']).toBeDefined();
      }
    });
  });
});
