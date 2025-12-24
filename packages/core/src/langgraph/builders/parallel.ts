/**
 * Parallel Execution Builder
 *
 * Provides utilities for building workflows where multiple nodes execute in parallel.
 * This implements the fan-out/fan-in pattern using LangGraph's native parallel execution.
 *
 * @module langgraph/builders/parallel
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import type { StateGraphArgs } from '@langchain/langgraph';

/**
 * Configuration for a parallel node
 */
export interface ParallelNode<State> {
  /**
   * Unique name for the node
   */
  name: string;

  /**
   * The node function that processes the state
   */
  node: (state: State) => State | Promise<State> | Partial<State> | Promise<Partial<State>>;

  /**
   * Optional description of what this node does
   */
  description?: string;
}

/**
 * Configuration for an aggregation node that combines parallel results
 */
export interface AggregateNode<State> {
  /**
   * Name for the aggregation node
   */
  name: string;

  /**
   * The aggregation function that combines results from parallel nodes
   */
  node: (state: State) => State | Promise<State> | Partial<State> | Promise<Partial<State>>;

  /**
   * Optional description
   */
  description?: string;
}

/**
 * Options for creating a parallel workflow
 */
export interface ParallelWorkflowOptions {
  /**
   * Whether to automatically add START and END nodes
   * @default true
   */
  autoStartEnd?: boolean;

  /**
   * Custom name for the workflow (for debugging)
   */
  name?: string;
}

/**
 * Configuration for a parallel workflow
 */
export interface ParallelWorkflowConfig<State> {
  /**
   * Nodes that execute in parallel
   */
  parallel: ParallelNode<State>[];

  /**
   * Optional aggregation node that runs after all parallel nodes complete
   */
  aggregate?: AggregateNode<State>;
}

/**
 * Creates a parallel workflow where multiple nodes execute concurrently.
 *
 * This implements the fan-out/fan-in pattern:
 * - Fan-out: Multiple nodes execute in parallel
 * - Fan-in: Optional aggregation node combines results
 *
 * @example
 * ```typescript
 * const workflow = createParallelWorkflow(AgentState, {
 *   parallel: [
 *     { name: 'fetch_news', node: fetchNewsNode },
 *     { name: 'fetch_weather', node: fetchWeatherNode },
 *     { name: 'fetch_stocks', node: fetchStocksNode },
 *   ],
 *   aggregate: { name: 'combine', node: combineNode },
 * });
 *
 * const app = workflow.compile();
 * const result = await app.invoke({ input: 'data' });
 * ```
 *
 * @param stateSchema - The state annotation for the graph
 * @param config - Configuration for parallel nodes and optional aggregation
 * @param options - Optional configuration
 * @returns A configured StateGraph ready to compile
 */
export function createParallelWorkflow<State>(
  stateSchema: any,
  config: ParallelWorkflowConfig<State>,
  options: ParallelWorkflowOptions = {}
): StateGraph<State> {
  const { parallel, aggregate } = config;
  const { autoStartEnd = true, name } = options;

  if (parallel.length === 0) {
    throw new Error('Parallel workflow must have at least one parallel node');
  }

  // Validate node names are unique
  const nodeNames = new Set<string>();
  for (const node of parallel) {
    if (nodeNames.has(node.name)) {
      throw new Error(`Duplicate node name: ${node.name}`);
    }
    nodeNames.add(node.name);
  }

  if (aggregate && nodeNames.has(aggregate.name)) {
    throw new Error(`Duplicate node name: ${aggregate.name}`);
  }

  // Create the graph
  const graph = new StateGraph<State>(stateSchema);

  // Add all parallel nodes
  for (const { name: nodeName, node } of parallel) {
    // @ts-expect-error - LangGraph's complex generic types don't infer well here
    graph.addNode(nodeName, node);
  }

  // Add aggregation node if provided
  if (aggregate) {
    // @ts-expect-error - LangGraph's complex generic types don't infer well here
    graph.addNode(aggregate.name, aggregate.node);
  }

  // Connect START to all parallel nodes (fan-out)
  if (autoStartEnd) {
    for (const { name: nodeName } of parallel) {
      graph.addEdge(START as any, nodeName as any);
    }
  }

  // Connect parallel nodes to aggregation or END (fan-in)
  if (aggregate) {
    // All parallel nodes connect to aggregation
    for (const { name: nodeName } of parallel) {
      graph.addEdge(nodeName as any, aggregate.name as any);
    }

    // Aggregation connects to END
    if (autoStartEnd) {
      graph.addEdge(aggregate.name as any, END as any);
    }
  } else if (autoStartEnd) {
    // No aggregation, connect all parallel nodes to END
    for (const { name: nodeName } of parallel) {
      graph.addEdge(nodeName as any, END as any);
    }
  }

  return graph;
}

