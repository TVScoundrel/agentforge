import { describe, expect, it, vi } from 'vitest';
import { createWorkerNode } from '../../../src/multi-agent/nodes.js';
import type { MultiAgentStateType } from '../../../src/multi-agent/state.js';
import type { WorkerConfig } from '../../../src/multi-agent/types.js';
import { createMockState } from './shared.js';

describe('Multi-Agent Nodes', () => {
  describe('createWorkerNode core behavior', () => {
    it('should create a worker node', () => {
      const node = createWorkerNode({
        id: 'worker1',
        capabilities: {
          skills: ['skill1'],
          tools: ['tool1'],
          available: true,
          currentWorkload: 0,
        },
      });

      expect(node).toBeDefined();
      expect(typeof node).toBe('function');
    });

    it('should use custom execution function if provided', async () => {
      const executeFn = vi.fn().mockResolvedValue({
        completedTasks: [
          {
            assignmentId: 'task1',
            workerId: 'worker1',
            success: true,
            result: 'Custom result',
            completedAt: Date.now(),
          },
        ],
        currentAgent: 'supervisor',
        status: 'routing',
      });

      const config: WorkerConfig = {
        id: 'worker1',
        capabilities: {
          skills: ['skill1'],
          tools: [],
          available: true,
          currentWorkload: 0,
        },
        executeFn,
      };

      const stateWithAssignment: MultiAgentStateType = {
        ...createMockState(),
        activeAssignments: [
          {
            id: 'task1',
            workerId: 'worker1',
            task: 'Test task',
            priority: 5,
            assignedAt: Date.now(),
          },
        ],
      };

      const result = await createWorkerNode(config)(stateWithAssignment);
      expect(executeFn).toHaveBeenCalledWith(stateWithAssignment, undefined);
      expect(result.completedTasks).toHaveLength(1);
    });

    it('should fail when model content serializes to undefined', async () => {
      const model = {
        invoke: vi.fn().mockResolvedValue({ content: undefined }),
      };
      const baseState = createMockState();

      const stateWithAssignment: MultiAgentStateType = {
        ...baseState,
        workers: {
          ...baseState.workers,
          worker1: {
            ...baseState.workers.worker1,
            currentWorkload: 1,
          },
        },
        activeAssignments: [
          {
            id: 'task1',
            workerId: 'worker1',
            task: 'Test task',
            priority: 5,
            assignedAt: Date.now(),
          },
        ],
      };

      const result = await createWorkerNode({
        id: 'worker1',
        capabilities: {
          skills: ['skill1'],
          tools: [],
          available: true,
          currentWorkload: 0,
        },
        model: model as unknown as WorkerConfig['model'],
      })(stateWithAssignment);

      expect(result.status).toBe('routing');
      expect(result.completedTasks?.[0]?.error).toContain(
        'Failed to serialize model content: JSON.stringify returned undefined'
      );
      expect(result.workers?.worker1.currentWorkload).toBe(0);
    });

    it('should preserve handoff updates returned by custom execution functions', async () => {
      const handoff = {
        from: 'worker1',
        to: 'worker2',
        reason: 'Needs worker2 specialization',
        context: 'Escalated task',
        timestamp: new Date().toISOString(),
      };
      const executeFn = vi.fn().mockResolvedValue({
        handoffs: [handoff],
        completedTasks: [
          {
            assignmentId: 'task1',
            workerId: 'worker1',
            success: true,
            result: 'Escalated to worker2',
            completedAt: Date.now(),
          },
        ],
      });
      const baseState = createMockState();

      const stateWithAssignment: MultiAgentStateType = {
        ...baseState,
        workers: {
          ...baseState.workers,
          worker1: {
            ...baseState.workers.worker1,
            currentWorkload: 1,
          },
        },
        activeAssignments: [
          {
            id: 'task1',
            workerId: 'worker1',
            task: 'Test task',
            priority: 5,
            assignedAt: Date.now(),
          },
        ],
      };

      const result = await createWorkerNode({
        id: 'worker1',
        capabilities: {
          skills: ['skill1'],
          tools: [],
          available: true,
          currentWorkload: 0,
        },
        executeFn,
      })(stateWithAssignment);

      expect(result.handoffs).toEqual([handoff]);
      expect(result.workers?.worker1.currentWorkload).toBe(0);
    });

    it('should return to supervisor if no assignment found', async () => {
      const result = await createWorkerNode({
        id: 'worker1',
        capabilities: {
          skills: ['skill1'],
          tools: [],
          available: true,
          currentWorkload: 0,
        },
      })(createMockState());

      expect(result.currentAgent).toBeUndefined();
      expect(result.status).toBeUndefined();
    });

    it('should handle errors and create error result', async () => {
      const executeFn = vi.fn().mockRejectedValue(new Error('Execution failed'));
      const stateWithAssignment: MultiAgentStateType = {
        ...createMockState(),
        activeAssignments: [
          {
            id: 'task1',
            workerId: 'worker1',
            task: 'Test task',
            priority: 5,
            assignedAt: Date.now(),
          },
        ],
      };

      const result = await createWorkerNode({
        id: 'worker1',
        capabilities: {
          skills: ['skill1'],
          tools: [],
          available: true,
          currentWorkload: 0,
        },
        executeFn,
      })(stateWithAssignment);

      expect(result.completedTasks).toHaveLength(1);
      expect(result.completedTasks![0].success).toBe(false);
      expect(result.completedTasks![0].error).toBe('Execution failed');
    });
  });
});
