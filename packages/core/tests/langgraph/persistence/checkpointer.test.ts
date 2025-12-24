import { describe, it, expect } from 'vitest';
import { StateGraph, Annotation } from '@langchain/langgraph';
import {
  createMemoryCheckpointer,
  isMemoryCheckpointer,
} from '../../../src/langgraph/persistence/checkpointer.js';

describe('Checkpointer Factories', () => {
  describe('createMemoryCheckpointer', () => {
    it('should create a memory checkpointer', () => {
      const checkpointer = createMemoryCheckpointer();

      expect(checkpointer).toBeDefined();
      expect(isMemoryCheckpointer(checkpointer)).toBe(true);
    });

    it('should work with StateGraph', async () => {
      const checkpointer = createMemoryCheckpointer();

      // Define a simple state
      const State = Annotation.Root({
        count: Annotation<number>({
          reducer: (left, right) => left + right,
          default: () => 0,
        }),
      });

      type StateType = typeof State.State;

      // Create a simple graph
      const workflow = new StateGraph(State)
        .addNode('increment', (state: StateType) => ({ count: 1 }))
        .addEdge('__start__', 'increment')
        .addEdge('increment', '__end__');

      const app = workflow.compile({ checkpointer });

      // Run the graph with a thread ID
      const config = { configurable: { thread_id: 'test-thread' } };
      const result = await app.invoke({ count: 0 }, config);

      expect(result.count).toBe(1);

      // Run again with the same thread - should accumulate due to checkpointing
      const result2 = await app.invoke({ count: 0 }, config);
      expect(result2.count).toBe(2); // State accumulates with checkpointing
    });

    it('should persist state across invocations with same thread', async () => {
      const checkpointer = createMemoryCheckpointer();

      const State = Annotation.Root({
        messages: Annotation<string[]>({
          reducer: (left, right) => [...left, ...right],
          default: () => [],
        }),
      });

      type StateType = typeof State.State;

      const workflow = new StateGraph(State)
        .addNode('add_message', (state: StateType) => ({
          messages: ['new message'],
        }))
        .addEdge('__start__', 'add_message')
        .addEdge('add_message', '__end__');

      const app = workflow.compile({ checkpointer });

      const config = { configurable: { thread_id: 'conversation-1' } };

      // First invocation
      const result1 = await app.invoke({ messages: ['hello'] }, config);
      expect(result1.messages).toEqual(['hello', 'new message']);

      // Second invocation with same thread
      const result2 = await app.invoke({ messages: ['world'] }, config);
      expect(result2.messages).toEqual(['hello', 'new message', 'world', 'new message']);
    });

    it('should isolate state between different threads', async () => {
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

      // Thread 1
      const config1 = { configurable: { thread_id: 'thread-1' } };
      const result1 = await app.invoke({ count: 0 }, config1);
      expect(result1.count).toBe(1);

      // Thread 2
      const config2 = { configurable: { thread_id: 'thread-2' } };
      const result2 = await app.invoke({ count: 0 }, config2);
      expect(result2.count).toBe(1);

      // Thread 1 again - should have its own state
      const result3 = await app.invoke({ count: 0 }, config1);
      expect(result3.count).toBe(2); // Accumulated from previous invocation
    });
  });

  describe('isMemoryCheckpointer', () => {
    it('should identify memory checkpointers', () => {
      const checkpointer = createMemoryCheckpointer();
      expect(isMemoryCheckpointer(checkpointer)).toBe(true);
    });
  });
});

