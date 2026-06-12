import { describe, expect, it, vi } from 'vitest';
import { createWorkerNode } from '../../../src/multi-agent/nodes.js';
import type { MultiAgentStateType } from '../../../src/multi-agent/state.js';
import { createMockState } from './shared.js';

function createWorkloadResult() {
  return {
    completedTasks: [
      {
        assignmentId: 'task1',
        workerId: 'worker1',
        success: true,
        result: 'Task completed',
        completedAt: Date.now(),
      },
    ],
  };
}

describe('Multi-Agent Nodes', () => {
  describe('createWorkerNode workload behavior', () => {
    it('should decrement workload from state, not config', async () => {
      const executeFn = vi.fn().mockResolvedValue(createWorkloadResult());
      const baseState = createMockState();
      const stateWithWorkload: MultiAgentStateType = {
        ...baseState,
        workers: {
          ...baseState.workers,
          worker1: {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 3,
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
      })(stateWithWorkload);

      expect(result.workers).toBeDefined();
      expect(result.workers!['worker1'].currentWorkload).toBe(2);
    });

    it('should not decrement workload below zero', async () => {
      const executeFn = vi.fn().mockResolvedValue(createWorkloadResult());
      const baseState = createMockState();
      const stateWithZeroWorkload: MultiAgentStateType = {
        ...baseState,
        workers: {
          ...baseState.workers,
          worker1: {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 0,
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
      })(stateWithZeroWorkload);

      expect(result.workers).toBeDefined();
      expect(result.workers!['worker1'].currentWorkload).toBe(0);
    });

    it('should preserve other worker properties when updating workload', async () => {
      const executeFn = vi.fn().mockResolvedValue(createWorkloadResult());
      const stateWithWorkload: MultiAgentStateType = {
        ...createMockState(),
        workers: {
          worker1: {
            skills: ['skill1', 'skill2'],
            tools: ['tool1', 'tool2'],
            available: true,
            currentWorkload: 2,
          },
          worker2: {
            skills: ['skill3'],
            tools: ['tool3'],
            available: false,
            currentWorkload: 5,
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
      })(stateWithWorkload);

      expect(result.workers!['worker1']).toEqual({
        skills: ['skill1', 'skill2'],
        tools: ['tool1', 'tool2'],
        available: true,
        currentWorkload: 1,
      });
      expect(result.workers!['worker2']).toEqual({
        skills: ['skill3'],
        tools: ['tool3'],
        available: false,
        currentWorkload: 5,
      });
    });

    it('should decrement workload on task failure/error', async () => {
      const executeFn = vi.fn().mockRejectedValue(new Error('Execution failed'));
      const baseState = createMockState();
      const stateWithWorkload: MultiAgentStateType = {
        ...baseState,
        workers: {
          ...baseState.workers,
          worker1: {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 3,
          },
        },
        activeAssignments: [
          {
            id: 'task1',
            workerId: 'worker1',
            task: 'Test task',
            priority: 1,
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
      })(stateWithWorkload);

      expect(result.workers).toBeDefined();
      expect(result.workers!['worker1'].currentWorkload).toBe(2);
      expect(result.completedTasks).toHaveLength(1);
      expect(result.completedTasks![0].success).toBe(false);
    });
  });
});
