/**
 * Subgraph composition utilities for LangGraph
 *
 * Helpers for creating and composing subgraphs.
 */

import { StateGraph } from '@langchain/langgraph';

/**
 * Configuration function for building a subgraph
 */
export type SubgraphBuilder<State> = (graph: StateGraph<State>) => StateGraph<State>;

/**
 * Creates a reusable subgraph that can be added as a node to other graphs.
 *
 * This is a helper function that creates a StateGraph, applies the builder function,
 * and returns the compiled graph which can be added as a node to another graph.
 *
 * @example
 * ```typescript
 * // Create a reusable research subgraph
 * const researchSubgraph = createSubgraph(ResearchState, (graph) => {
 *   graph.addNode('search', searchNode);
 *   graph.addNode('analyze', analyzeNode);
 *   graph.addEdge('__start__', 'search');
 *   graph.addEdge('search', 'analyze');
 *   graph.addEdge('analyze', '__end__');
 *   return graph;
 * });
 *
 * // Use in main graph
 * const mainGraph = new StateGraph(MainState);
 * mainGraph.addNode('research', researchSubgraph);
 * ```
 *
 * @param stateSchema - The state annotation for the subgraph
 * @param builder - Function that configures the subgraph
 * @returns A compiled graph that can be used as a node
 */
export function createSubgraph<State>(
  stateSchema: any,
  builder: SubgraphBuilder<State>
): ReturnType<StateGraph<State>['compile']> {
  const graph = new StateGraph<State>(stateSchema);
  const configured = builder(graph);
  return configured.compile();
}

/**
 * Options for composing graphs
 */
export interface ComposeGraphsOptions {
  /**
   * Name for the subgraph node
   */
  name: string;

  /**
   * Optional description for documentation
   */
  description?: string;
}

/**
 * Adds a compiled subgraph as a node to a parent graph.
 *
 * This is a convenience function that wraps the common pattern of
 * adding a compiled graph as a node.
 *
 * @example
 * ```typescript
 * const subgraph = createSubgraph(SubState, (graph) => {
 *   // Configure subgraph
 *   return graph;
 * });
 *
 * const mainGraph = new StateGraph(MainState);
 * composeGraphs(mainGraph, subgraph, { name: 'sub_workflow' });
 * ```
 *
 * @param parentGraph - The parent graph to add the subgraph to
 * @param subgraph - The compiled subgraph to add as a node
 * @param options - Configuration options
 * @returns The parent graph for chaining
 */
export function composeGraphs<ParentState, SubState>(
  parentGraph: StateGraph<ParentState>,
  subgraph: ReturnType<StateGraph<SubState>['compile']>,
  options: ComposeGraphsOptions
): StateGraph<ParentState> {
  const { name } = options;

  // @ts-expect-error - LangGraph's complex generic types don't infer well here
  parentGraph.addNode(name, subgraph);

  return parentGraph;
}

