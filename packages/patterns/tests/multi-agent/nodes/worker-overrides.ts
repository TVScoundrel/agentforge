import { describe, expect, it, vi } from 'vitest';
import { createWorkerNode } from '../../../src/multi-agent/nodes.js';
import type { MultiAgentStateType } from '../../../src/multi-agent/state.js';
import type { WorkerConfig } from '../../../src/multi-agent/types.js';
import { createMockState } from './shared.js';

describe('Multi-Agent Nodes', () => {
  describe('createWorkerNode worker override behavior', () => {
    it('should preserve worker updates from custom executeFn while decrementing workload', async () => {
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
        workers: {
          worker1: {
            skills: ['skill1', 'new-skill'],
            tools: [],
            available: true,
            currentWorkload: 5,
          },
          worker2: {
            skills: ['skill2'],
            tools: [],
            available: false,
            currentWorkload: 0,
          },
        },
      });

      const stateWithWorkload: MultiAgentStateType = {
        ...createMockState(),
        workers: {
          worker1: {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 3,
          },
          worker2: {
            skills: ['skill2'],
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
      expect(result.workers!['worker1'].skills).toEqual(['skill1', 'new-skill']);
      expect(result.workers!['worker1'].currentWorkload).toBe(4);
      expect(result.workers!['worker2'].available).toBe(false);
      expect(result.workers!['worker2'].currentWorkload).toBe(0);
    });

    it('should decrement workload even if executeFn modifies it (framework owns workload)', async () => {
      const executeFn = vi.fn().mockResolvedValue({
        completedTasks: [
          {
            assignmentId: 'task1',
            workerId: 'worker1',
            success: true,
            result: 'Result',
            completedAt: Date.now(),
          },
        ],
        workers: {
          worker1: {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 10,
          },
        },
      });

      const stateWithWorkload: MultiAgentStateType = {
        ...createMockState(),
        workers: {
          worker1: {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 5,
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

      expect(result.workers!['worker1'].currentWorkload).toBe(9);
    });

    it('should preserve all workers when executeFn returns partial workers', async () => {
      const executeFn = vi.fn().mockResolvedValue({
        completedTasks: [
          {
            assignmentId: 'task1',
            workerId: 'worker1',
            success: true,
            result: 'Result',
            completedAt: Date.now(),
          },
        ],
        workers: {
          worker1: {
            skills: ['skill1', 'new-skill'],
            tools: [],
            available: true,
            currentWorkload: 5,
          },
        },
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

      const stateWithMultipleWorkers: MultiAgentStateType = {
        ...createMockState(),
        workers: {
          worker1: {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 5,
          },
          worker2: {
            skills: ['skill2'],
            tools: ['tool2'],
            available: true,
            currentWorkload: 3,
          },
          worker3: {
            skills: ['skill3'],
            tools: ['tool3'],
            available: false,
            currentWorkload: 0,
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

      const result = await createWorkerNode(config)(stateWithMultipleWorkers);

      expect(result.workers!['worker1'].skills).toEqual(['skill1', 'new-skill']);
      expect(result.workers!['worker1'].currentWorkload).toBe(4);
      expect(result.workers!['worker2']).toBeDefined();
      expect(result.workers!['worker2'].skills).toEqual(['skill2']);
      expect(result.workers!['worker2'].currentWorkload).toBe(3);
      expect(result.workers!['worker3']).toBeDefined();
      expect(result.workers!['worker3'].skills).toEqual(['skill3']);
      expect(result.workers!['worker3'].available).toBe(false);
    });
  });
});
