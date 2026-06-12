import { describe, expect, it, vi } from 'vitest';
import { createAggregatorNode } from '../../../src/multi-agent/nodes.js';
import type { MultiAgentStateType } from '../../../src/multi-agent/state.js';
import type { AggregatorConfig } from '../../../src/multi-agent/types.js';
import { createMockState, GraphInterrupt } from './shared.js';

describe('Multi-Agent Nodes', () => {
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
      const state = createMockState();

      const node = createAggregatorNode(config);
      const result = await node(state);

      expect(aggregateFn).toHaveBeenCalledWith(state);
      expect(result.response).toBe('Custom aggregated result');
      expect(result.status).toBe('completed');
    });

    it('should handle no completed tasks', async () => {
      const config: AggregatorConfig = {};

      const node = createAggregatorNode(config);
      const result = await node(createMockState());

      expect(result.response).toBe('No tasks were completed.');
      expect(result.status).toBe('completed');
    });

    it('should concatenate results without LLM', async () => {
      const config: AggregatorConfig = {};

      const stateWithResults: MultiAgentStateType = {
        ...createMockState(),
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
      const result = await node(createMockState());

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Aggregation failed');
    });

    it('should fail when model content cannot be serialized', async () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      const model = {
        invoke: vi.fn().mockResolvedValue({ content: circular }),
      };

      const config: AggregatorConfig = {
        model: model as AggregatorConfig['model'],
      };

      const stateWithResults: MultiAgentStateType = {
        ...createMockState(),
        completedTasks: [
          {
            assignmentId: 'task1',
            workerId: 'worker1',
            success: true,
            result: 'Result 1',
            completedAt: Date.now(),
          },
        ],
      };

      const node = createAggregatorNode(config);
      const result = await node(stateWithResults);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('circular');
    });

    it('should rethrow GraphInterrupt from custom aggregation', async () => {
      const aggregateFn = vi.fn().mockRejectedValue(
        new GraphInterrupt('Pause for human aggregation input')
      );

      const config: AggregatorConfig = {
        aggregateFn,
      };

      const node = createAggregatorNode(config);
      await expect(node(createMockState())).rejects.toBeInstanceOf(GraphInterrupt);
    });
  });
});
