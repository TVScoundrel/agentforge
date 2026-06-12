import { describe, expect, it } from 'vitest';
import { createSupervisorNode } from '../../../src/multi-agent/nodes.js';
import type { MultiAgentStateType } from '../../../src/multi-agent/state.js';
import { createMockState } from './shared.js';

describe('Multi-Agent Nodes', () => {
  describe('createSupervisorNode workload behavior', () => {
    it('should increment workload when assigning tasks', async () => {
      const result = await createSupervisorNode({ strategy: 'round-robin' })(
        createMockState()
      );

      expect(result.workers).toBeDefined();
      const assignedWorkerId = result.currentAgent;
      expect(result.workers![assignedWorkerId!].currentWorkload).toBe(1);

      const otherWorkers = Object.entries(result.workers!).filter(
        ([id]) => id !== assignedWorkerId
      );
      otherWorkers.forEach(([_, caps]) => {
        expect(caps.currentWorkload).toBe(0);
      });
    });

    it('should increment workload for multiple workers in parallel assignment', async () => {
      const node = createSupervisorNode({ strategy: 'round-robin' });
      const result1 = await node(createMockState());
      const worker1Id = result1.currentAgent!;
      expect(result1.workers![worker1Id].currentWorkload).toBe(1);

      const stateAfterFirst: MultiAgentStateType = {
        ...createMockState(),
        workers: result1.workers!,
        iteration: 1,
        routingHistory: result1.routingHistory!,
      };

      const result2 = await node(stateAfterFirst);
      const worker2Id = result2.currentAgent!;

      expect(result2.workers![worker1Id].currentWorkload).toBe(1);
      expect(result2.workers![worker2Id].currentWorkload).toBe(1);
    });

    it('should preserve existing workload when incrementing', async () => {
      const stateWithWorkload: MultiAgentStateType = {
        ...createMockState(),
        workers: {
          worker1: {
            skills: ['skill1'],
            tools: ['tool1'],
            available: true,
            currentWorkload: 3,
          },
          worker2: {
            skills: ['skill2'],
            tools: ['tool2'],
            available: true,
            currentWorkload: 1,
          },
        },
      };

      const result = await createSupervisorNode({ strategy: 'round-robin' })(
        stateWithWorkload
      );

      const assignedWorkerId = result.currentAgent!;
      const expectedWorkload = stateWithWorkload.workers[assignedWorkerId].currentWorkload + 1;
      expect(result.workers![assignedWorkerId].currentWorkload).toBe(expectedWorkload);
    });

    it('should route to worker with lower workload in load-balanced strategy', async () => {
      const stateWithDifferentWorkloads: MultiAgentStateType = {
        ...createMockState(),
        workers: {
          worker1: {
            skills: ['skill1'],
            tools: ['tool1'],
            available: true,
            currentWorkload: 5,
          },
          worker2: {
            skills: ['skill2'],
            tools: ['tool2'],
            available: true,
            currentWorkload: 1,
          },
        },
      };

      const result = await createSupervisorNode({ strategy: 'load-balanced' })(
        stateWithDifferentWorkloads
      );

      expect(result.currentAgent).toBe('worker2');
      expect(result.workers!['worker2'].currentWorkload).toBe(2);
      expect(result.workers!['worker1'].currentWorkload).toBe(5);
    });

    it('should update routing decisions as workloads change', async () => {
      const node = createSupervisorNode({ strategy: 'load-balanced' });
      let currentState: MultiAgentStateType = {
        ...createMockState(),
        workers: {
          worker1: {
            skills: ['skill1'],
            tools: ['tool1'],
            available: true,
            currentWorkload: 0,
          },
          worker2: {
            skills: ['skill2'],
            tools: ['tool2'],
            available: true,
            currentWorkload: 0,
          },
        },
      };

      const result1 = await node(currentState);
      const firstWorker = result1.currentAgent!;
      expect(['worker1', 'worker2']).toContain(firstWorker);
      expect(result1.workers![firstWorker].currentWorkload).toBe(1);

      currentState = {
        ...currentState,
        workers: result1.workers!,
        iteration: 1,
      };

      const result2 = await node(currentState);
      const secondWorker = result2.currentAgent!;
      const worker1Workload = currentState.workers.worker1.currentWorkload;
      const worker2Workload = currentState.workers.worker2.currentWorkload;

      if (worker1Workload < worker2Workload) {
        expect(secondWorker).toBe('worker1');
      } else if (worker2Workload < worker1Workload) {
        expect(secondWorker).toBe('worker2');
      }
    });
  });
});
