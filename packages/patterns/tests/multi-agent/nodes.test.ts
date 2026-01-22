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

      expect(result.currentAgent).toBe('supervisor');
      expect(result.status).toBe('routing');
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

