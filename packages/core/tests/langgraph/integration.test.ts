import { describe, it, expect } from 'vitest';
import { StateGraph } from '@langchain/langgraph';
import { z } from 'zod';
import { createStateAnnotation, validateState } from '../../src/langgraph/state.js';

describe('LangGraph Integration', () => {
  it('should work with StateGraph end-to-end', async () => {
    // Define state
    const AgentState = createStateAnnotation({
      messages: {
        schema: z.array(z.string()),
        reducer: (left: string[], right: string[]) => [...left, ...right],
        default: () => [],
      },
      stepCount: {
        schema: z.number(),
        reducer: (left: number, right: number) => left + right,
        default: () => 0,
      },
    });

    type State = typeof AgentState.State;

    // Define nodes
    const node1 = (state: State) => ({
      messages: ['node1'],
      stepCount: 1,
    });

    const node2 = (state: State) => ({
      messages: ['node2'],
      stepCount: 1,
    });

    // Build graph
    const workflow = new StateGraph(AgentState)
      .addNode('node1', node1)
      .addNode('node2', node2)
      .addEdge('__start__', 'node1')
      .addEdge('node1', 'node2')
      .addEdge('node2', '__end__');

    const app = workflow.compile();

    // Run graph
    const result = await app.invoke({
      messages: ['start'],
      stepCount: 0,
    });

    // Verify results
    expect(result.messages).toEqual(['start', 'node1', 'node2']);
    expect(result.stepCount).toBe(2);
  });

  it('should validate state during graph execution', async () => {
    const stateConfig = {
      value: {
        schema: z.number().min(0).max(100),
        default: () => 0,
      },
    };

    const AgentState = createStateAnnotation(stateConfig);
    type State = typeof AgentState.State;

    const incrementNode = (state: State) => {
      const newValue = (state.value || 0) + 10;

      // Validate before returning
      const validated = validateState({ value: newValue }, stateConfig);

      return validated;
    };

    const workflow = new StateGraph(AgentState)
      .addNode('increment', incrementNode)
      .addEdge('__start__', 'increment')
      .addEdge('increment', '__end__');

    const app = workflow.compile();

    const result = await app.invoke({ value: 5 });

    expect(result.value).toBe(15);
  });

  it('should handle complex state with multiple reducers', async () => {
    const AgentState = createStateAnnotation({
      events: {
        schema: z.array(
          z.object({
            type: z.string(),
            timestamp: z.number(),
          })
        ),
        reducer: (left: any[], right: any[]) => [...left, ...right],
        default: () => [],
      },
      counters: {
        schema: z.record(z.string(), z.number()),
        reducer: (left: Record<string, number>, right: Record<string, number>) => {
          const merged = { ...left };
          for (const [key, value] of Object.entries(right)) {
            merged[key] = (merged[key] || 0) + value;
          }
          return merged;
        },
        default: () => ({}),
      },
      metadata: {
        schema: z.record(z.string(), z.any()),
        default: () => ({}),
      },
    });

    type State = typeof AgentState.State;

    const eventNode = (state: State) => ({
      events: [{ type: 'event1', timestamp: Date.now() }],
      counters: { event1: 1 },
    });

    const anotherEventNode = (state: State) => ({
      events: [{ type: 'event2', timestamp: Date.now() }],
      counters: { event2: 1, event1: 1 },
      metadata: { processed: true },
    });

    const workflow = new StateGraph(AgentState)
      .addNode('event1', eventNode)
      .addNode('event2', anotherEventNode)
      .addEdge('__start__', 'event1')
      .addEdge('event1', 'event2')
      .addEdge('event2', '__end__');

    const app = workflow.compile();

    const result = await app.invoke({
      events: [],
      counters: {},
      metadata: {},
    });

    expect(result.events).toHaveLength(2);
    expect(result.events[0].type).toBe('event1');
    expect(result.events[1].type).toBe('event2');
    expect(result.counters).toEqual({ event1: 2, event2: 1 });
    expect(result.metadata).toEqual({ processed: true });
  });

  it('should support conditional edges', async () => {
    const AgentState = createStateAnnotation({
      value: {
        schema: z.number(),
        default: () => 0,
      },
      path: {
        schema: z.array(z.string()),
        reducer: (left: string[], right: string[]) => [...left, ...right],
        default: () => [],
      },
    });

    type State = typeof AgentState.State;

    const router = (state: State) => {
      return state.value > 5 ? 'high' : 'low';
    };

    const highNode = (state: State) => ({
      path: ['high'],
    });

    const lowNode = (state: State) => ({
      path: ['low'],
    });

    const workflow = new StateGraph(AgentState)
      .addNode('high', highNode)
      .addNode('low', lowNode)
      .addConditionalEdges('__start__', router, {
        high: 'high',
        low: 'low',
      })
      .addEdge('high', '__end__')
      .addEdge('low', '__end__');

    const app = workflow.compile();

    const highResult = await app.invoke({ value: 10, path: [] });
    expect(highResult.path).toEqual(['high']);

    const lowResult = await app.invoke({ value: 3, path: [] });
    expect(lowResult.path).toEqual(['low']);
  });
});

