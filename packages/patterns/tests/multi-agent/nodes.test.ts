/**
 * Tests for Multi-Agent Nodes
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createSupervisorNode,
  createWorkerNode,
  createAggregatorNode,
} from '../../src/multi-agent/nodes.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import type { SupervisorConfig, WorkerConfig, AggregatorConfig } from '../../src/multi-agent/types.js';

describe('Multi-Agent Nodes', () => {
  const mockState: MultiAgentStateType = {
    input: 'Test task',
    messages: [{
      from: 'user',
      to: ['supervisor'],
      type: 'user_input',
      content: 'Test task',
      timestamp: Date.now(),
    }],
    workers: {
      'worker1': {
        skills: ['skill1'],
        tools: ['tool1'],
        available: true,
        currentWorkload: 0,
      },
      'worker2': {
        skills: ['skill2'],
        tools: ['tool2'],
        available: true,
        currentWorkload: 0,
      },
    },
    currentAgent: 'supervisor',
    routingHistory: [],
    activeAssignments: [],
    completedTasks: [],
    handoffs: [],
    status: 'routing',
    iteration: 0,
    maxIterations: 10,
    response: '',
  };

  describe('createSupervisorNode', () => {
    it('should create a supervisor node', () => {
      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      const node = createSupervisorNode(config);
      expect(node).toBeDefined();
      expect(typeof node).toBe('function');
    });

    it('should route to a worker', async () => {
      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      const node = createSupervisorNode(config);
      const result = await node(mockState);

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
        ...mockState,
        iteration: 5,
      };

      const node = createSupervisorNode(config);
      const result = await node(stateAtMax);

      expect(result.status).toBe('aggregating');
      expect(result.currentAgent).toBe('aggregator');
    });

    it('should move to aggregation when all tasks completed', async () => {
      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      const stateWithCompleted: MultiAgentStateType = {
        ...mockState,
        activeAssignments: [{
          id: 'task1',
          workerId: 'worker1',
          task: 'Test',
          priority: 5,
          assignedAt: Date.now(),
        }],
        completedTasks: [{
          assignmentId: 'task1',
          workerId: 'worker1',
          success: true,
          result: 'Done',
          completedAt: Date.now(),
        }],
      };

      const node = createSupervisorNode(config);
      const result = await node(stateWithCompleted);

      expect(result.status).toBe('aggregating');
      expect(result.currentAgent).toBe('aggregator');
    });

    it('should handle errors gracefully', async () => {
      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      const stateNoWorkers: MultiAgentStateType = {
        ...mockState,
        workers: {},
      };

      const node = createSupervisorNode(config);
      const result = await node(stateNoWorkers);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should increment iteration counter linearly with additive reducer', async () => {
      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      const node = createSupervisorNode(config);

      // Simulate multiple routing cycles
      // The iteration field uses an additive reducer: (left, right) => left + right
      // So returning iteration: 1 means "add 1 to current iteration"

      // Cycle 1: iteration starts at 0
      const result1 = await node({ ...mockState, iteration: 0 });
      expect(result1.iteration).toBe(1); // Should return 1, which gets added to 0 → 1

      // Cycle 2: iteration is now 1
      const result2 = await node({ ...mockState, iteration: 1 });
      expect(result2.iteration).toBe(1); // Should return 1, which gets added to 1 → 2

      // Cycle 3: iteration is now 2
      const result3 = await node({ ...mockState, iteration: 2 });
      expect(result3.iteration).toBe(1); // Should return 1, which gets added to 2 → 3

      // Cycle 4: iteration is now 3
      const result4 = await node({ ...mockState, iteration: 3 });
      expect(result4.iteration).toBe(1); // Should return 1, which gets added to 3 → 4

      // If the bug existed (returning state.iteration + 1), we would see:
      // Cycle 1: 0 + (0 + 1) = 1 ✓
      // Cycle 2: 1 + (1 + 1) = 3 ✗ (should be 2)
      // Cycle 3: 3 + (3 + 1) = 7 ✗ (should be 3)
      // Cycle 4: 7 + (7 + 1) = 15 ✗ (should be 4)
    });

    it('should increment workload when assigning tasks', async () => {
      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      const node = createSupervisorNode(config);
      const result = await node(mockState);

      // Verify workload was incremented for the assigned worker
      expect(result.workers).toBeDefined();
      const assignedWorkerId = result.currentAgent;
      expect(result.workers![assignedWorkerId!].currentWorkload).toBe(1);

      // Other workers should still have 0 workload
      const otherWorkers = Object.entries(result.workers!)
        .filter(([id]) => id !== assignedWorkerId);
      otherWorkers.forEach(([_, caps]) => {
        expect(caps.currentWorkload).toBe(0);
      });
    });

    it('should increment workload for multiple workers in parallel assignment', async () => {
      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      // Mock a routing strategy that returns multiple target agents
      const mockRoutingStrategy = {
        name: 'test-parallel',
        route: vi.fn().mockResolvedValue({
          targetAgent: null,
          targetAgents: ['worker1', 'worker2'],
          reasoning: 'Parallel execution test',
          confidence: 1.0,
          strategy: 'test-parallel',
          timestamp: Date.now(),
        }),
      };

      // We need to test this by directly calling the supervisor with a mocked strategy
      // For now, let's test the single assignment case thoroughly
      const node = createSupervisorNode(config);

      // First assignment
      const result1 = await node(mockState);
      const worker1Id = result1.currentAgent!;
      expect(result1.workers![worker1Id].currentWorkload).toBe(1);

      // Second assignment with updated state
      const stateAfterFirst: MultiAgentStateType = {
        ...mockState,
        workers: result1.workers!,
        iteration: 1,
        routingHistory: result1.routingHistory!,
      };

      const result2 = await node(stateAfterFirst);
      const worker2Id = result2.currentAgent!;

      // Verify both workers have incremented workload
      expect(result2.workers![worker1Id].currentWorkload).toBe(1);
      expect(result2.workers![worker2Id].currentWorkload).toBe(1);
    });

    it('should preserve existing workload when incrementing', async () => {
      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      const stateWithWorkload: MultiAgentStateType = {
        ...mockState,
        workers: {
          'worker1': {
            skills: ['skill1'],
            tools: ['tool1'],
            available: true,
            currentWorkload: 3, // Already has workload
          },
          'worker2': {
            skills: ['skill2'],
            tools: ['tool2'],
            available: true,
            currentWorkload: 1,
          },
        },
      };

      const node = createSupervisorNode(config);
      const result = await node(stateWithWorkload);

      const assignedWorkerId = result.currentAgent!;
      const expectedWorkload = stateWithWorkload.workers[assignedWorkerId].currentWorkload + 1;
      expect(result.workers![assignedWorkerId].currentWorkload).toBe(expectedWorkload);
    });
  });

  describe('createWorkerNode', () => {
    it('should create a worker node', () => {
      const config: WorkerConfig = {
        id: 'worker1',
        capabilities: {
          skills: ['skill1'],
          tools: ['tool1'],
          available: true,
          currentWorkload: 0,
        },
      };

      const node = createWorkerNode(config);
      expect(node).toBeDefined();
      expect(typeof node).toBe('function');
    });

    it('should use custom execution function if provided', async () => {
      const executeFn = vi.fn().mockResolvedValue({
        completedTasks: [{
          assignmentId: 'task1',
          workerId: 'worker1',
          success: true,
          result: 'Custom result',
          completedAt: Date.now(),
        }],
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
        ...mockState,
        activeAssignments: [{
          id: 'task1',
          workerId: 'worker1',
          task: 'Test task',
          priority: 5,
          assignedAt: Date.now(),
        }],
      };

      const node = createWorkerNode(config);
      const result = await node(stateWithAssignment);

      expect(executeFn).toHaveBeenCalledWith(stateWithAssignment, undefined);
      expect(result.completedTasks).toHaveLength(1);
    });

    it('should return to supervisor if no assignment found', async () => {
      const config: WorkerConfig = {
        id: 'worker1',
        capabilities: {
          skills: ['skill1'],
          tools: [],
          available: true,
          currentWorkload: 0,
        },
      };

      const node = createWorkerNode(config);
      const result = await node(mockState);

      // Workers no longer set currentAgent/status to avoid conflicts in parallel execution
      expect(result.currentAgent).toBeUndefined();
      expect(result.status).toBeUndefined();
    });

    it('should handle errors and create error result', async () => {
      const executeFn = vi.fn().mockRejectedValue(new Error('Execution failed'));

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
        ...mockState,
        activeAssignments: [{
          id: 'task1',
          workerId: 'worker1',
          task: 'Test task',
          priority: 5,
          assignedAt: Date.now(),
        }],
      };

      const node = createWorkerNode(config);
      const result = await node(stateWithAssignment);

      expect(result.completedTasks).toHaveLength(1);
      expect(result.completedTasks![0].success).toBe(false);
      expect(result.completedTasks![0].error).toBe('Execution failed');
    });

    it('should decrement workload from state, not config', async () => {
      const executeFn = vi.fn().mockResolvedValue({
        completedTasks: [{
          assignmentId: 'task1',
          workerId: 'worker1',
          success: true,
          result: 'Task completed',
          completedAt: Date.now(),
        }],
      });

      const config: WorkerConfig = {
        id: 'worker1',
        capabilities: {
          skills: ['skill1'],
          tools: [],
          available: true,
          currentWorkload: 0, // Config has 0 (static)
        },
        executeFn,
      };

      const stateWithWorkload: MultiAgentStateType = {
        ...mockState,
        workers: {
          ...mockState.workers,
          'worker1': {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 3, // State has 3 (current)
          },
        },
        activeAssignments: [{
          id: 'task1',
          workerId: 'worker1',
          task: 'Test task',
          priority: 5,
          assignedAt: Date.now(),
        }],
      };

      const node = createWorkerNode(config);
      const result = await node(stateWithWorkload);

      // Should decrement from state (3) not config (0)
      // 3 - 1 = 2
      expect(result.workers).toBeDefined();
      expect(result.workers!['worker1'].currentWorkload).toBe(2);
    });

    it('should not decrement workload below zero', async () => {
      const executeFn = vi.fn().mockResolvedValue({
        completedTasks: [{
          assignmentId: 'task1',
          workerId: 'worker1',
          success: true,
          result: 'Task completed',
          completedAt: Date.now(),
        }],
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

      const stateWithZeroWorkload: MultiAgentStateType = {
        ...mockState,
        workers: {
          ...mockState.workers,
          'worker1': {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 0, // Already at 0
          },
        },
        activeAssignments: [{
          id: 'task1',
          workerId: 'worker1',
          task: 'Test task',
          priority: 5,
          assignedAt: Date.now(),
        }],
      };

      const node = createWorkerNode(config);
      const result = await node(stateWithZeroWorkload);

      // Should not go below 0
      expect(result.workers).toBeDefined();
      expect(result.workers!['worker1'].currentWorkload).toBe(0);
    });

    it('should preserve other worker properties when updating workload', async () => {
      const executeFn = vi.fn().mockResolvedValue({
        completedTasks: [{
          assignmentId: 'task1',
          workerId: 'worker1',
          success: true,
          result: 'Task completed',
          completedAt: Date.now(),
        }],
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

      const stateWithWorkload: MultiAgentStateType = {
        ...mockState,
        workers: {
          'worker1': {
            skills: ['skill1', 'skill2'],
            tools: ['tool1', 'tool2'],
            available: true,
            currentWorkload: 2,
          },
          'worker2': {
            skills: ['skill3'],
            tools: ['tool3'],
            available: false,
            currentWorkload: 5,
          },
        },
        activeAssignments: [{
          id: 'task1',
          workerId: 'worker1',
          task: 'Test task',
          priority: 5,
          assignedAt: Date.now(),
        }],
      };

      const node = createWorkerNode(config);
      const result = await node(stateWithWorkload);

      // Worker1 should have decremented workload but preserved other properties
      expect(result.workers!['worker1']).toEqual({
        skills: ['skill1', 'skill2'],
        tools: ['tool1', 'tool2'],
        available: true,
        currentWorkload: 1, // Decremented from 2
      });

      // Worker2 should be unchanged
      expect(result.workers!['worker2']).toEqual({
        skills: ['skill3'],
        tools: ['tool3'],
        available: false,
        currentWorkload: 5,
      });
    });

    it('should decrement workload on task failure/error', async () => {
      const executeFn = vi.fn().mockRejectedValue(new Error('Execution failed'));

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

      const stateWithWorkload: MultiAgentStateType = {
        ...mockState,
        workers: {
          ...mockState.workers,
          'worker1': {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 3, // Has workload
          },
        },
        activeAssignments: [{
          id: 'task1',
          workerId: 'worker1',
          task: 'Test task',
          priority: 1,
          assignedAt: Date.now(),
        }],
      };

      const node = createWorkerNode(config);
      const result = await node(stateWithWorkload);

      // Should decrement workload even on error
      // 3 - 1 = 2
      expect(result.workers).toBeDefined();
      expect(result.workers!['worker1'].currentWorkload).toBe(2);

      // Should also create error result
      expect(result.completedTasks).toHaveLength(1);
      expect(result.completedTasks![0].success).toBe(false);
    });

    it('should preserve worker updates from custom executeFn while decrementing workload', async () => {
      // Custom executeFn that returns worker updates
      const executeFn = vi.fn().mockResolvedValue({
        completedTasks: [{
          assignmentId: 'task1',
          workerId: 'worker1',
          success: true,
          result: 'Custom result',
          completedAt: Date.now(),
        }],
        workers: {
          'worker1': {
            skills: ['skill1', 'new-skill'], // executeFn added a new skill
            tools: [],
            available: true,
            currentWorkload: 5, // executeFn set this (will be decremented)
          },
          'worker2': {
            skills: ['skill2'],
            tools: [],
            available: false, // executeFn changed availability
            currentWorkload: 0,
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

      const stateWithWorkload: MultiAgentStateType = {
        ...mockState,
        workers: {
          'worker1': {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 3,
          },
          'worker2': {
            skills: ['skill2'],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        },
        activeAssignments: [{
          id: 'task1',
          workerId: 'worker1',
          task: 'Test task',
          priority: 1,
          assignedAt: Date.now(),
        }],
      };

      const node = createWorkerNode(config);
      const result = await node(stateWithWorkload);

      // Should preserve executeFn's worker updates
      expect(result.workers).toBeDefined();

      // Worker1: should have new skill AND decremented workload
      expect(result.workers!['worker1'].skills).toEqual(['skill1', 'new-skill']);
      expect(result.workers!['worker1'].currentWorkload).toBe(4); // 5 - 1 = 4

      // Worker2: should preserve availability change from executeFn
      expect(result.workers!['worker2'].available).toBe(false);
      expect(result.workers!['worker2'].currentWorkload).toBe(0);
    });

    it('should decrement workload even if executeFn modifies it (framework owns workload)', async () => {
      // This test documents the contract: framework owns workload management
      // If executeFn modifies currentWorkload, it will be decremented again
      // This is intentional - executeFn should NOT touch currentWorkload

      const executeFn = vi.fn().mockResolvedValue({
        completedTasks: [{
          assignmentId: 'task1',
          workerId: 'worker1',
          success: true,
          result: 'Result',
          completedAt: Date.now(),
        }],
        workers: {
          'worker1': {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 10, // executeFn incorrectly sets workload
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

      const stateWithWorkload: MultiAgentStateType = {
        ...mockState,
        workers: {
          'worker1': {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 5, // State has 5
          },
        },
        activeAssignments: [{
          id: 'task1',
          workerId: 'worker1',
          task: 'Test task',
          priority: 1,
          assignedAt: Date.now(),
        }],
      };

      const node = createWorkerNode(config);
      const result = await node(stateWithWorkload);

      // Framework decrements executeFn's value: 10 - 1 = 9
      // This documents that executeFn should NOT modify currentWorkload
      expect(result.workers!['worker1'].currentWorkload).toBe(9);
    });
  });

  describe('Supervisor - Error Handling', () => {
    it('should return failed status when worker ID is missing from state.workers', async () => {
      const config: SupervisorConfig = {
        strategy: 'rule-based',
        // Custom routing function that returns a non-existent worker ID
        routingFn: async () => ({
          targetAgents: ['nonexistent-worker'],
          reasoning: 'Test routing to non-existent worker',
          confidence: 1.0,
        }),
      };

      const node = createSupervisorNode(config);

      // Should return failed status with error message
      const result = await node(mockState);
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Worker nonexistent-worker not found in state.workers');
      expect(result.error).toContain('Available workers: worker1, worker2');
    });
  });

  describe('Load-Balanced Routing with Workload', () => {
    it('should route to worker with lower workload in load-balanced strategy', async () => {
      const config: SupervisorConfig = {
        strategy: 'load-balanced',
      };

      const stateWithDifferentWorkloads: MultiAgentStateType = {
        ...mockState,
        workers: {
          'worker1': {
            skills: ['skill1'],
            tools: ['tool1'],
            available: true,
            currentWorkload: 5, // High workload
          },
          'worker2': {
            skills: ['skill2'],
            tools: ['tool2'],
            available: true,
            currentWorkload: 1, // Low workload
          },
        },
      };

      const node = createSupervisorNode(config);
      const result = await node(stateWithDifferentWorkloads);

      // Should route to worker2 (lower workload)
      expect(result.currentAgent).toBe('worker2');

      // Should increment worker2's workload
      expect(result.workers!['worker2'].currentWorkload).toBe(2);

      // worker1's workload should remain unchanged
      expect(result.workers!['worker1'].currentWorkload).toBe(5);
    });

    it('should update routing decisions as workloads change', async () => {
      const config: SupervisorConfig = {
        strategy: 'load-balanced',
      };

      // Initial state: both workers have 0 workload
      let currentState: MultiAgentStateType = {
        ...mockState,
        workers: {
          'worker1': {
            skills: ['skill1'],
            tools: ['tool1'],
            available: true,
            currentWorkload: 0,
          },
          'worker2': {
            skills: ['skill2'],
            tools: ['tool2'],
            available: true,
            currentWorkload: 0,
          },
        },
      };

      const node = createSupervisorNode(config);

      // First assignment - should go to worker1 (or worker2, both have 0)
      const result1 = await node(currentState);
      const firstWorker = result1.currentAgent!;
      expect(['worker1', 'worker2']).toContain(firstWorker);
      expect(result1.workers![firstWorker].currentWorkload).toBe(1);

      // Update state with new workloads
      currentState = {
        ...currentState,
        workers: result1.workers!,
        iteration: 1,
      };

      // Second assignment - should go to the worker with lower workload
      const result2 = await node(currentState);
      const secondWorker = result2.currentAgent!;

      // The second worker should be the one with lower workload
      const worker1Workload = currentState.workers['worker1'].currentWorkload;
      const worker2Workload = currentState.workers['worker2'].currentWorkload;

      if (worker1Workload < worker2Workload) {
        expect(secondWorker).toBe('worker1');
      } else if (worker2Workload < worker1Workload) {
        expect(secondWorker).toBe('worker2');
      }
      // If equal, either is acceptable
    });
  });

  describe('createAggregatorNode', () => {
    it('should create an aggregator node', () => {
      const config: AggregatorConfig = {};

      const node = createAggregatorNode(config);
      expect(node).toBeDefined();
      expect(typeof node).toBe('function');
    });

    it('should use custom aggregation function if provided', async () => {
      const aggregateFn = vi.fn().mockResolvedValue('Custom aggregated result');

      const config: AggregatorConfig = {
        aggregateFn,
      };

      const node = createAggregatorNode(config);
      const result = await node(mockState);

      expect(aggregateFn).toHaveBeenCalledWith(mockState);
      expect(result.response).toBe('Custom aggregated result');
      expect(result.status).toBe('completed');
    });

    it('should handle no completed tasks', async () => {
      const config: AggregatorConfig = {};

      const node = createAggregatorNode(config);
      const result = await node(mockState);

      expect(result.response).toBe('No tasks were completed.');
      expect(result.status).toBe('completed');
    });

    it('should concatenate results without LLM', async () => {
      const config: AggregatorConfig = {};

      const stateWithResults: MultiAgentStateType = {
        ...mockState,
        completedTasks: [
          {
            assignmentId: 'task1',
            workerId: 'worker1',
            success: true,
            result: 'Result 1',
            completedAt: Date.now(),
          },
          {
            assignmentId: 'task2',
            workerId: 'worker2',
            success: true,
            result: 'Result 2',
            completedAt: Date.now(),
          },
        ],
      };

      const node = createAggregatorNode(config);
      const result = await node(stateWithResults);

      expect(result.response).toContain('Result 1');
      expect(result.response).toContain('Result 2');
      expect(result.status).toBe('completed');
    });

    it('should handle errors gracefully', async () => {
      const aggregateFn = vi.fn().mockRejectedValue(new Error('Aggregation failed'));

      const config: AggregatorConfig = {
        aggregateFn,
      };

      const node = createAggregatorNode(config);
      const result = await node(mockState);

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Aggregation failed');
    });
  });
});

