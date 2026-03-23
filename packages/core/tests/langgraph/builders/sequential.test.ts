import { describe, it, expect } from 'vitest';
import { Annotation, END, START } from '@langchain/langgraph';
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
  describe('createSequentialWorkflow', () => {
    it('should create a sequential workflow with multiple nodes', async () => {
      const workflow = createSequentialWorkflow(
        TestState,
        [
          {
            name: 'step1',
            node: (_state) => ({ messages: ['step1'], count: 1 }),
          },
          {
            name: 'step2',
            node: (_state) => ({ messages: ['step2'], count: 1 }),
          },
          {
            name: 'step3',
            node: (_state) => ({ messages: ['step3'], count: 1 }),
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
      const workflow = createSequentialWorkflow(
        TestState,
        [
          {
            name: 'async1',
            node: async (_state) => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return { messages: ['async1'], count: 1 };
            },
          },
          {
            name: 'async2',
            node: async (_state) => {
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
        createSequentialWorkflow(TestState, []);
      }).toThrow('Sequential workflow must have at least one node');
    });

    it('should throw error for duplicate node names', () => {
      expect(() => {
        createSequentialWorkflow(TestState, [
          { name: 'duplicate', node: (state) => state },
          { name: 'duplicate', node: (state) => state },
        ]);
      }).toThrow('Duplicate node name: duplicate');
    });

    it('should respect autoStartEnd option', async () => {
      const workflow = createSequentialWorkflow(
        TestState,
        [
          {
            name: 'only',
            node: (_state) => ({ messages: ['only'], count: 1 }),
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

    it('should derive state typing from the provided schema', async () => {
      const workflow = createSequentialWorkflow(
        TestState,
        [
          {
            name: 'typed',
            node: (state) => ({
              messages: [`count:${state.count}`],
            }),
          },
        ]
      );

      const app = workflow.compile();
      const result = await app.invoke({
        messages: [],
        count: 2,
      });

      expect(result.messages).toEqual(['count:2']);
      expect(result.count).toBe(2);
    });

    it('should reject non-annotation schemas at runtime', () => {
      expect(() => {
        createSequentialWorkflow({ State: { messages: [], count: 0 } } as never, [
          {
            name: 'invalid',
            node: () => ({ messages: ['invalid'], count: 1 }),
          },
        ]);
      }).toThrow('Sequential workflow requires a LangGraph Annotation.Root schema');
    });

    it('should reject schema-like objects with invalid spec payloads', () => {
      expect(() => {
        createSequentialWorkflow({ spec: {} } as never, [
          {
            name: 'invalid',
            node: () => ({ messages: ['invalid'], count: 1 }),
          },
        ]);
      }).toThrow('Sequential workflow requires a LangGraph Annotation.Root schema');
    });

    it('should wire sequential edges when autoStartEnd is enabled', () => {
      const workflow = createSequentialWorkflow(
        TestState,
        [
          {
            name: 'first',
            node: (_state) => ({ messages: ['first'], count: 1 }),
          },
          {
            name: 'second',
            node: (_state) => ({ messages: ['second'], count: 1 }),
          },
          {
            name: 'third',
            node: (_state) => ({ messages: ['third'], count: 1 }),
          },
        ]
      );

      expect(workflow.edges).toEqual(
        new Set([
          [START, 'first'],
          ['first', 'second'],
          ['second', 'third'],
          ['third', END],
        ])
      );
    });

    it('should omit START and END edges when autoStartEnd is disabled', () => {
      const workflow = createSequentialWorkflow(
        TestState,
        [
          {
            name: 'first',
            node: (_state) => ({ messages: ['first'], count: 1 }),
          },
          {
            name: 'second',
            node: (_state) => ({ messages: ['second'], count: 1 }),
          },
        ],
        { autoStartEnd: false }
      );

      expect(workflow.edges).toEqual(new Set([['first', 'second']]));
    });
  });

  describe('sequentialBuilder', () => {
    it('should build a sequential workflow using fluent API', async () => {
      const workflow = sequentialBuilder(TestState)
        .addNode('first', (_state) => ({ messages: ['first'], count: 1 }))
        .addNode('second', (_state) => ({ messages: ['second'], count: 1 }))
        .addNode('third', (_state) => ({ messages: ['third'], count: 1 }))
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
      const workflow = sequentialBuilder(TestState)
        .addNode('node1', (_state) => ({ messages: ['node1'], count: 1 }))
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
      const workflow = sequentialBuilder(TestState)
        .addNode('documented', (_state) => ({ messages: ['doc'], count: 1 }), 'A documented node')
        .build();

      const app = workflow.compile();
      const result = await app.invoke({
        messages: [],
        count: 0,
      });

      expect(result.messages).toEqual(['doc']);
    });

    it('should infer builder node state from the schema', async () => {
      const workflow = sequentialBuilder(TestState)
        .addNode('typed', (state) => ({ messages: [`messages:${state.messages.length}`] }))
        .build();

      const app = workflow.compile();
      const result = await app.invoke({
        messages: ['existing'],
        count: 0,
      });

      expect(result.messages).toEqual(['existing', 'messages:1']);
      expect(result.count).toBe(0);
    });
  });
});
