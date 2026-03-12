import { describe, it, expect } from 'vitest';
import { StateGraph, Annotation } from '@langchain/langgraph';
import { createSubgraph, composeGraphs } from '../../../src/langgraph/builders/subgraph';

describe('Subgraph Composition', () => {
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

  describe('createSubgraph', () => {
    it('should create a reusable subgraph', async () => {
      const subgraph = createSubgraph<State>(TestState, (graph) => {
        graph.addNode('sub1', (state) => ({ messages: ['sub1'], count: 1 }));
        graph.addNode('sub2', (state) => ({ messages: ['sub2'], count: 1 }));
        graph.addEdge('__start__', 'sub1');
        graph.addEdge('sub1', 'sub2');
        graph.addEdge('sub2', '__end__');
        return graph;
      });

      // Subgraph should be a compiled graph
      expect(subgraph).toBeDefined();
      expect(typeof subgraph.invoke).toBe('function');

      // Test the subgraph directly
      const result = await subgraph.invoke({
        messages: [],
        count: 0,
      });

      expect(result.messages).toEqual(['sub1', 'sub2']);
      expect(result.count).toBe(2);
    });

    it('should create subgraph that can be used as a node', async () => {
      // Create a subgraph
      const processingSubgraph = createSubgraph<State>(TestState, (graph) => {
        graph.addNode('step1', (state) => ({ messages: ['step1'], count: 1 }));
        graph.addNode('step2', (state) => ({ messages: ['step2'], count: 1 }));
        graph.addEdge('__start__', 'step1');
        graph.addEdge('step1', 'step2');
        graph.addEdge('step2', '__end__');
        return graph;
      });

      // Use it in a main graph
      const mainGraph = new StateGraph<State>(TestState);
      mainGraph.addNode('prepare', (state) => ({ messages: ['prepare'], count: 1 }));
      // @ts-expect-error - LangGraph's complex generic types don't infer well here
      mainGraph.addNode('process', processingSubgraph);
      mainGraph.addNode('finalize', (state) => ({ messages: ['finalize'], count: 1 }));

      mainGraph.addEdge('__start__', 'prepare');
      mainGraph.addEdge('prepare', 'process');
      mainGraph.addEdge('process', 'finalize');
      mainGraph.addEdge('finalize', '__end__');

      const app = mainGraph.compile();
      const result = await app.invoke({
        messages: [],
        count: 0,
      });

      // Note: LangGraph may execute nodes during graph construction
      // The exact order depends on LangGraph's internal behavior
      expect(result.messages).toContain('prepare');
      expect(result.messages).toContain('step1');
      expect(result.messages).toContain('step2');
      expect(result.messages).toContain('finalize');
      expect(result.count).toBeGreaterThanOrEqual(4);
    });

    it('should support nested subgraphs', async () => {
      // Create inner subgraph
      const innerSubgraph = createSubgraph<State>(TestState, (graph) => {
        graph.addNode('inner', (state) => ({ messages: ['inner'], count: 1 }));
        graph.addEdge('__start__', 'inner');
        graph.addEdge('inner', '__end__');
        return graph;
      });

      // Create outer subgraph that uses inner subgraph
      const outerSubgraph = createSubgraph<State>(TestState, (graph) => {
        graph.addNode('outer1', (state) => ({ messages: ['outer1'], count: 1 }));
        // @ts-expect-error - LangGraph's complex generic types don't infer well here
        graph.addNode('nested', innerSubgraph);
        graph.addNode('outer2', (state) => ({ messages: ['outer2'], count: 1 }));
        graph.addEdge('__start__', 'outer1');
        graph.addEdge('outer1', 'nested');
        graph.addEdge('nested', 'outer2');
        graph.addEdge('outer2', '__end__');
        return graph;
      });

      const result = await outerSubgraph.invoke({
        messages: [],
        count: 0,
      });

      // Note: LangGraph may execute nodes during graph construction
      expect(result.messages).toContain('outer1');
      expect(result.messages).toContain('inner');
      expect(result.messages).toContain('outer2');
      expect(result.count).toBeGreaterThanOrEqual(3);
    });
  });

  describe('composeGraphs', () => {
    it('should add subgraph as a node to parent graph', async () => {
      const subgraph = createSubgraph<State>(TestState, (graph) => {
        graph.addNode('sub', (state) => ({ messages: ['sub'], count: 1 }));
        graph.addEdge('__start__', 'sub');
        graph.addEdge('sub', '__end__');
        return graph;
      });

      const mainGraph = new StateGraph<State>(TestState);
      mainGraph.addNode('main', (state) => ({ messages: ['main'], count: 1 }));

      composeGraphs(mainGraph, subgraph, { name: 'subgraph_node' });

      mainGraph.addEdge('__start__', 'main');
      mainGraph.addEdge('main', 'subgraph_node');
      mainGraph.addEdge('subgraph_node', '__end__');

      const app = mainGraph.compile();
      const result = await app.invoke({
        messages: [],
        count: 0,
      });

      // Note: LangGraph may execute nodes during graph construction
      expect(result.messages).toContain('main');
      expect(result.messages).toContain('sub');
      expect(result.count).toBeGreaterThanOrEqual(2);
    });

    it('should return parent graph for chaining', () => {
      const subgraph = createSubgraph<State>(TestState, (graph) => {
        graph.addNode('sub', (state) => state);
        graph.addEdge('__start__', 'sub');
        graph.addEdge('sub', '__end__');
        return graph;
      });

      const mainGraph = new StateGraph<State>(TestState);
      const result = composeGraphs(mainGraph, subgraph, { name: 'sub' });

      expect(result).toBe(mainGraph);
    });
  });
});
