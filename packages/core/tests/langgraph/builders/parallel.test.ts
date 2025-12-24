import { describe, it, expect } from 'vitest';
import { Annotation } from '@langchain/langgraph';
import { createParallelWorkflow } from '../../../src/langgraph/builders/parallel';

describe('Parallel Workflow Builder', () => {
  // Define a simple state for testing
  const TestState = Annotation.Root({
    results: Annotation<string[]>({
      reducer: (left, right) => [...left, ...right],
      default: () => [],
    }),
    count: Annotation<number>({
      reducer: (left, right) => left + right,
      default: () => 0,
    }),
  });

  type State = typeof TestState.State;

  describe('createParallelWorkflow', () => {
    it('should execute multiple nodes in parallel', async () => {
      const workflow = createParallelWorkflow<State>(TestState, {
        parallel: [
          {
            name: 'task1',
            node: async (state) => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return { results: ['task1'], count: 1 };
            },
          },
          {
            name: 'task2',
            node: async (state) => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return { results: ['task2'], count: 1 };
            },
          },
          {
            name: 'task3',
            node: async (state) => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return { results: ['task3'], count: 1 };
            },
          },
        ],
      });

      const app = workflow.compile();
      const result = await app.invoke({
        results: [],
        count: 0,
      });

      // All tasks should have executed
      expect(result.results).toHaveLength(3);
      expect(result.results).toContain('task1');
      expect(result.results).toContain('task2');
      expect(result.results).toContain('task3');
      expect(result.count).toBe(3);
    });

    it('should support aggregation node after parallel execution', async () => {
      const workflow = createParallelWorkflow<State>(TestState, {
        parallel: [
          {
            name: 'fetch1',
            node: (state) => ({ results: ['data1'], count: 1 }),
          },
          {
            name: 'fetch2',
            node: (state) => ({ results: ['data2'], count: 1 }),
          },
        ],
        aggregate: {
          name: 'combine',
          node: (state) => ({
            results: ['combined'],
            count: 1,
          }),
        },
      });

      const app = workflow.compile();
      const result = await app.invoke({
        results: [],
        count: 0,
      });

      // Should have results from parallel nodes AND aggregation
      expect(result.results).toContain('data1');
      expect(result.results).toContain('data2');
      expect(result.results).toContain('combined');
      expect(result.count).toBe(3);
    });

    it('should throw error for empty parallel node list', () => {
      expect(() => {
        createParallelWorkflow<State>(TestState, {
          parallel: [],
        });
      }).toThrow('Parallel workflow must have at least one parallel node');
    });

    it('should throw error for duplicate node names in parallel nodes', () => {
      expect(() => {
        createParallelWorkflow<State>(TestState, {
          parallel: [
            { name: 'duplicate', node: (state) => state },
            { name: 'duplicate', node: (state) => state },
          ],
        });
      }).toThrow('Duplicate node name: duplicate');
    });

    it('should throw error if aggregate node name conflicts with parallel node', () => {
      expect(() => {
        createParallelWorkflow<State>(TestState, {
          parallel: [
            { name: 'task1', node: (state) => state },
            { name: 'task2', node: (state) => state },
          ],
          aggregate: {
            name: 'task1', // Conflicts with parallel node
            node: (state) => state,
          },
        });
      }).toThrow('Duplicate node name: task1');
    });

    it('should work without autoStartEnd', async () => {
      const workflow = createParallelWorkflow<State>(
        TestState,
        {
          parallel: [
            {
              name: 'task1',
              node: (state) => ({ results: ['task1'], count: 1 }),
            },
            {
              name: 'task2',
              node: (state) => ({ results: ['task2'], count: 1 }),
            },
          ],
        },
        { autoStartEnd: true }
      );

      const app = workflow.compile();
      const result = await app.invoke({
        results: [],
        count: 0,
      });

      expect(result.results).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should handle parallel nodes with different execution times', async () => {
      const workflow = createParallelWorkflow<State>(TestState, {
        parallel: [
          {
            name: 'fast',
            node: async (state) => {
              await new Promise((resolve) => setTimeout(resolve, 5));
              return { results: ['fast'], count: 1 };
            },
          },
          {
            name: 'slow',
            node: async (state) => {
              await new Promise((resolve) => setTimeout(resolve, 50));
              return { results: ['slow'], count: 1 };
            },
          },
        ],
      });

      const app = workflow.compile();
      const startTime = Date.now();
      const result = await app.invoke({
        results: [],
        count: 0,
      });
      const duration = Date.now() - startTime;

      // Should wait for slowest node
      expect(duration).toBeGreaterThanOrEqual(50);
      expect(result.results).toContain('fast');
      expect(result.results).toContain('slow');
    });
  });
});

