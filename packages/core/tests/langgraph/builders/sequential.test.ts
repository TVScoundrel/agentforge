import { describe, it, expect } from 'vitest';
import { Annotation } from '@langchain/langgraph';
import {
  createSequentialWorkflow,
  sequentialBuilder,
} from '../../../src/langgraph/builders/sequential';

describe('Sequential Workflow Builder', () => {
  // Define a simple state for testing
  const TestState = Annotation.Root({
    messages: Annotation<string[]>({
      reducer: (left, right) => [...left, ...right],
      default: () => [],
    }),
    count: Annotation<number>({
      reducer: (left, right) => left + right,
      default: () => 0,
    }),
  });

  type State = typeof TestState.State;

  describe('createSequentialWorkflow', () => {
    it('should create a sequential workflow with multiple nodes', async () => {
      const workflow = createSequentialWorkflow<State>(
        TestState,
        [
          {
            name: 'step1',
            node: (state) => ({ messages: ['step1'], count: 1 }),
          },
          {
            name: 'step2',
            node: (state) => ({ messages: ['step2'], count: 1 }),
          },
          {
            name: 'step3',
            node: (state) => ({ messages: ['step3'], count: 1 }),
          },
        ]
      );

      const app = workflow.compile();
      const result = await app.invoke({
        messages: [],
        count: 0,
      });

      expect(result.messages).toEqual(['step1', 'step2', 'step3']);
      expect(result.count).toBe(3);
    });

    it('should handle async nodes', async () => {
      const workflow = createSequentialWorkflow<State>(
        TestState,
        [
          {
            name: 'async1',
            node: async (state) => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return { messages: ['async1'], count: 1 };
            },
          },
          {
            name: 'async2',
            node: async (state) => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return { messages: ['async2'], count: 1 };
            },
          },
        ]
      );

      const app = workflow.compile();
      const result = await app.invoke({
        messages: [],
        count: 0,
      });

      expect(result.messages).toEqual(['async1', 'async2']);
      expect(result.count).toBe(2);
    });

    it('should throw error for empty node list', () => {
      expect(() => {
        createSequentialWorkflow<State>(TestState, []);
      }).toThrow('Sequential workflow must have at least one node');
    });

    it('should throw error for duplicate node names', () => {
      expect(() => {
        createSequentialWorkflow<State>(TestState, [
          { name: 'duplicate', node: (state) => state },
          { name: 'duplicate', node: (state) => state },
        ]);
      }).toThrow('Duplicate node name: duplicate');
    });

    it('should respect autoStartEnd option', async () => {
      const workflow = createSequentialWorkflow<State>(
        TestState,
        [
          {
            name: 'only',
            node: (state) => ({ messages: ['only'], count: 1 }),
          },
        ],
        { autoStartEnd: true }
      );

      const app = workflow.compile();
      const result = await app.invoke({
        messages: [],
        count: 0,
      });

      expect(result.messages).toEqual(['only']);
      expect(result.count).toBe(1);
    });
  });

  describe('sequentialBuilder', () => {
    it('should build a sequential workflow using fluent API', async () => {
      const workflow = sequentialBuilder<State>(TestState)
        .addNode('first', (state) => ({ messages: ['first'], count: 1 }))
        .addNode('second', (state) => ({ messages: ['second'], count: 1 }))
        .addNode('third', (state) => ({ messages: ['third'], count: 1 }))
        .build();

      const app = workflow.compile();
      const result = await app.invoke({
        messages: [],
        count: 0,
      });

      expect(result.messages).toEqual(['first', 'second', 'third']);
      expect(result.count).toBe(3);
    });

    it('should support options in fluent API', async () => {
      const workflow = sequentialBuilder<State>(TestState)
        .addNode('node1', (state) => ({ messages: ['node1'], count: 1 }))
        .options({ name: 'test-workflow' })
        .build();

      const app = workflow.compile();
      const result = await app.invoke({
        messages: [],
        count: 0,
      });

      expect(result.messages).toEqual(['node1']);
      expect(result.count).toBe(1);
    });

    it('should support node descriptions in fluent API', async () => {
      const workflow = sequentialBuilder<State>(TestState)
        .addNode('documented', (state) => ({ messages: ['doc'], count: 1 }), 'A documented node')
        .build();

      const app = workflow.compile();
      const result = await app.invoke({
        messages: [],
        count: 0,
      });

      expect(result.messages).toEqual(['doc']);
    });
  });
});

