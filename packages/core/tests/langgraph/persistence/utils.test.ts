import { describe, it, expect } from 'vitest';
import { StateGraph, Annotation } from '@langchain/langgraph';
import { createMemoryCheckpointer } from '../../../src/langgraph/persistence/checkpointer.js';
import {
  getCheckpointHistory,
  getLatestCheckpoint,
  clearThread,
} from '../../../src/langgraph/persistence/utils.js';

describe('Checkpointer Utilities', () => {
  describe('getCheckpointHistory', () => {
    it('should get checkpoint history for a thread', async () => {
      const checkpointer = createMemoryCheckpointer();

      const State = Annotation.Root({
        count: Annotation<number>({
          reducer: (left, right) => left + right,
          default: () => 0,
        }),
      });

      type StateType = typeof State.State;

      const workflow = new StateGraph(State)
        .addNode('increment', (state: StateType) => ({ count: 1 }))
        .addEdge('__start__', 'increment')
        .addEdge('increment', '__end__');

      const app = workflow.compile({ checkpointer });

      const config = { configurable: { thread_id: 'test-thread' } };

      // Create some checkpoints
      await app.invoke({ count: 0 }, config);
      await app.invoke({ count: 0 }, config);
      await app.invoke({ count: 0 }, config);

      // Get history
      const history = await getCheckpointHistory(checkpointer, {
        threadId: 'test-thread',
        limit: 10,
      });

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should respect limit parameter', async () => {
      const checkpointer = createMemoryCheckpointer();

      const State = Annotation.Root({
        count: Annotation<number>({
          default: () => 0,
        }),
      });

      type StateType = typeof State.State;

      const workflow = new StateGraph(State)
        .addNode('increment', (state: StateType) => ({ count: (state.count || 0) + 1 }))
        .addEdge('__start__', 'increment')
        .addEdge('increment', '__end__');

      const app = workflow.compile({ checkpointer });

      const config = { configurable: { thread_id: 'test-thread' } };

      // Create multiple checkpoints
      for (let i = 0; i < 5; i++) {
        await app.invoke({ count: 0 }, config);
      }

      // Get limited history
      const history = await getCheckpointHistory(checkpointer, {
        threadId: 'test-thread',
        limit: 2,
      });

      expect(history.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array for non-existent thread', async () => {
      const checkpointer = createMemoryCheckpointer();

      const history = await getCheckpointHistory(checkpointer, {
        threadId: 'non-existent-thread',
      });

      expect(history).toEqual([]);
    });
  });

  describe('getLatestCheckpoint', () => {
    it('should get the latest checkpoint for a thread', async () => {
      const checkpointer = createMemoryCheckpointer();

      const State = Annotation.Root({
        count: Annotation<number>({
          reducer: (left, right) => left + right,
          default: () => 0,
        }),
      });

      type StateType = typeof State.State;

      const workflow = new StateGraph(State)
        .addNode('increment', (state: StateType) => ({ count: 1 }))
        .addEdge('__start__', 'increment')
        .addEdge('increment', '__end__');

      const app = workflow.compile({ checkpointer });

      const config = { configurable: { thread_id: 'test-thread' } };

      // Create a checkpoint
      await app.invoke({ count: 0 }, config);

      // Get latest checkpoint
      const latest = await getLatestCheckpoint(checkpointer, {
        threadId: 'test-thread',
      });

      expect(latest).toBeDefined();
      expect(latest).not.toBeNull();
      expect(latest?.checkpoint).toBeDefined();
    });

    it('should return null for non-existent thread', async () => {
      const checkpointer = createMemoryCheckpointer();

      const latest = await getLatestCheckpoint(checkpointer, {
        threadId: 'non-existent-thread',
      });

      expect(latest).toBeNull();
    });
  });

  describe('clearThread', () => {
    it('should throw error for non-empty threads', async () => {
      const checkpointer = createMemoryCheckpointer();

      const State = Annotation.Root({
        count: Annotation<number>({
          default: () => 0,
        }),
      });

      type StateType = typeof State.State;

      const workflow = new StateGraph(State)
        .addNode('increment', (state: StateType) => ({ count: 1 }))
        .addEdge('__start__', 'increment')
        .addEdge('increment', '__end__');

      const app = workflow.compile({ checkpointer });

      const config = { configurable: { thread_id: 'test-thread' } };

      // Create a checkpoint
      await app.invoke({ count: 0 }, config);

      // Try to clear - should throw
      await expect(
        clearThread(checkpointer, { threadId: 'test-thread' })
      ).rejects.toThrow('not supported');
    });

    it('should not throw for empty threads', async () => {
      const checkpointer = createMemoryCheckpointer();

      // Should not throw for non-existent thread
      await expect(
        clearThread(checkpointer, { threadId: 'non-existent-thread' })
      ).resolves.not.toThrow();
    });
  });
});

