import { describe, expect, it } from 'vitest';
import { createSupervisorNode } from '../../../src/multi-agent/nodes.js';
import type { MultiAgentStateType } from '../../../src/multi-agent/state.js';
import type { SupervisorConfig } from '../../../src/multi-agent/types.js';
import { createMockState, GraphInterrupt } from './shared.js';

describe('Multi-Agent Nodes', () => {
  describe('createSupervisorNode', () => {
    it('should create a supervisor node', () => {
      const node = createSupervisorNode({ strategy: 'round-robin' });
      expect(node).toBeDefined();
      expect(typeof node).toBe('function');
    });

    it('should route to a worker', async () => {
      const node = createSupervisorNode({ strategy: 'round-robin' });
      const result = await node(createMockState());

      expect(result.currentAgent).toBeDefined();
      expect(result.status).toBe('executing');
      expect(result.routingHistory).toHaveLength(1);
      expect(result.activeAssignments).toHaveLength(1);
      expect(result.messages).toHaveLength(1);
      expect(result.iteration).toBe(1);
    });

    it('should move to aggregation when max iterations reached', async () => {
      const config: SupervisorConfig = {
        strategy: 'round-robin',
        maxIterations: 5,
      };

      const stateAtMax: MultiAgentStateType = {
        ...createMockState(),
        iteration: 5,
      };

      const result = await createSupervisorNode(config)(stateAtMax);
      expect(result.status).toBe('aggregating');
      expect(result.currentAgent).toBe('aggregator');
    });

    it('should move to aggregation when all tasks completed', async () => {
      const stateWithCompleted: MultiAgentStateType = {
        ...createMockState(),
        activeAssignments: [
          {
            id: 'task1',
            workerId: 'worker1',
            task: 'Test',
            priority: 5,
            assignedAt: Date.now(),
          },
        ],
        completedTasks: [
          {
            assignmentId: 'task1',
            workerId: 'worker1',
            success: true,
            result: 'Done',
            completedAt: Date.now(),
          },
        ],
      };

      const result = await createSupervisorNode({ strategy: 'round-robin' })(
        stateWithCompleted
      );
      expect(result.status).toBe('aggregating');
      expect(result.currentAgent).toBe('aggregator');
    });

    it('should handle errors gracefully', async () => {
      const stateNoWorkers: MultiAgentStateType = {
        ...createMockState(),
        workers: {},
      };

      const result = await createSupervisorNode({ strategy: 'round-robin' })(
        stateNoWorkers
      );
      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should increment iteration counter linearly with additive reducer', async () => {
      const node = createSupervisorNode({ strategy: 'round-robin' });
      const baseState = createMockState();

      expect((await node({ ...baseState, iteration: 0 })).iteration).toBe(1);
      expect((await node({ ...baseState, iteration: 1 })).iteration).toBe(1);
      expect((await node({ ...baseState, iteration: 2 })).iteration).toBe(1);
      expect((await node({ ...baseState, iteration: 3 })).iteration).toBe(1);
    });
  });

  describe('Supervisor - Error Handling', () => {
    it('should return failed status when worker ID is missing from state.workers', async () => {
      const node = createSupervisorNode({
        strategy: 'rule-based',
        routingFn: async () => ({
          targetAgents: ['nonexistent-worker'],
          reasoning: 'Test routing to non-existent worker',
          confidence: 1.0,
        }),
      });

      const result = await node(createMockState());
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Worker nonexistent-worker not found in state.workers');
      expect(result.error).toContain('Available workers: worker1, worker2');
    });

    it('should rethrow GraphInterrupt from custom routing', async () => {
      const node = createSupervisorNode({
        strategy: 'rule-based',
        routingFn: async () => {
          throw new GraphInterrupt('Pause for human routing input');
        },
      });

      await expect(node(createMockState())).rejects.toBeInstanceOf(GraphInterrupt);
    });
  });
});
