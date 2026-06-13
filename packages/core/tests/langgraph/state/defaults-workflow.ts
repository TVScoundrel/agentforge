import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { StateGraph, END } from '@langchain/langgraph';
import {
  createStateAnnotation,
  validateState,
  type StateChannelConfig,
} from '../../../src/langgraph/state.js';

describe('LangGraph State Utilities', () => {
  describe('Defaults for non-reducer channels (P2 Bug Fix)', () => {
    it('should apply defaults for non-reducer channels in LangGraph workflows', async () => {
      const StateConfig = {
        status: {
          schema: z.string(),
          default: () => 'initialized',
          description: 'Current status',
        } satisfies StateChannelConfig<string>,
        shouldContinue: {
          schema: z.boolean(),
          default: () => true,
          description: 'Whether to continue',
        } satisfies StateChannelConfig<boolean>,
        messages: {
          schema: z.array(z.string()),
          reducer: (left: string[], right: string[]) => [...left, ...right],
          default: () => [],
          description: 'Messages',
        } satisfies StateChannelConfig<string[], string[]>,
      };

      const State = createStateAnnotation(StateConfig);

      const workflow = new StateGraph(State)
        .addNode('start', () => ({ messages: ['Started'] }))
        .addEdge('__start__', 'start')
        .addEdge('start', END);

      const graph = workflow.compile();
      const result = await graph.invoke({});

      expect(result.status).toBe('initialized');
      expect(result.shouldContinue).toBe(true);
      expect(result.messages).toEqual(['Started']);
    });

    it('should show that validateState() does apply defaults correctly', () => {
      const StateConfig = {
        status: {
          schema: z.string(),
          default: () => 'initialized',
        } satisfies StateChannelConfig<string>,
        shouldContinue: {
          schema: z.boolean(),
          default: () => true,
        } satisfies StateChannelConfig<boolean>,
      };

      const validated = validateState({}, StateConfig);

      expect(validated.status).toBe('initialized');
      expect(validated.shouldContinue).toBe(true);
    });

    it('should use "last value wins" semantics for non-reducer channels with defaults', async () => {
      const StateConfig = {
        counter: {
          schema: z.number(),
          default: () => 0,
          description: 'Counter value',
        } satisfies StateChannelConfig<number>,
      };

      const State = createStateAnnotation(StateConfig);

      const workflow = new StateGraph(State)
        .addNode('node1', () => ({ counter: 5 }))
        .addNode('node2', () => ({ counter: 10 }))
        .addEdge('__start__', 'node1')
        .addEdge('node1', 'node2')
        .addEdge('node2', END);

      const graph = workflow.compile();
      const result = await graph.invoke({});

      expect(result.counter).toBe(10);
    });

    it('should handle non-reducer channels without defaults', async () => {
      const StateConfig = {
        value: {
          schema: z.string().optional(),
          description: 'Optional value',
        } satisfies StateChannelConfig<string | undefined>,
      };

      const State = createStateAnnotation(StateConfig);

      const workflow = new StateGraph(State)
        .addNode('node1', () => ({ value: 'hello' }))
        .addEdge('__start__', 'node1')
        .addEdge('node1', END);

      const graph = workflow.compile();
      const result = await graph.invoke({});

      expect(result.value).toBe('hello');
    });

    it('should allow nodes to explicitly set undefined and override defaults', async () => {
      const StateConfig = {
        status: {
          schema: z.string().optional(),
          default: () => 'initialized',
          description: 'Current status',
        } satisfies StateChannelConfig<string | undefined>,
      };

      const State = createStateAnnotation(StateConfig);

      const workflow = new StateGraph(State)
        .addNode('node1', () => ({ status: undefined }))
        .addEdge('__start__', 'node1')
        .addEdge('node1', END);

      const graph = workflow.compile();
      const result = await graph.invoke({});

      expect(result.status).toBeUndefined();
    });

    it('should preserve defaults when nodes omit keys (best practice)', async () => {
      const StateConfig = {
        status: {
          schema: z.string(),
          default: () => 'initialized',
          description: 'Current status',
        } satisfies StateChannelConfig<string>,
        counter: {
          schema: z.number(),
          reducer: (left: number, right: number) => left + right,
          default: () => 0,
          description: 'Counter',
        } satisfies StateChannelConfig<number, number>,
      };

      const State = createStateAnnotation(StateConfig);

      const workflow = new StateGraph(State)
        .addNode('node1', () => ({ counter: 1 }))
        .addNode('node2', () => ({ counter: 2 }))
        .addEdge('__start__', 'node1')
        .addEdge('node1', 'node2')
        .addEdge('node2', END);

      const graph = workflow.compile();
      const result = await graph.invoke({});

      expect(result.status).toBe('initialized');
      expect(result.counter).toBe(3);
    });
  });
});
