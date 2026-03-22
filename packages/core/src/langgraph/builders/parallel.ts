/**
 * Parallel Execution Builder
 *
 * Provides utilities for building workflows where multiple nodes execute in parallel.
 * This implements the fan-out/fan-in pattern using LangGraph's native parallel execution.
 *
 * @module langgraph/builders/parallel
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import type { AnnotationRoot, StateDefinition, UpdateType } from '@langchain/langgraph';

type ParallelWorkflowState<SD extends StateDefinition> = AnnotationRoot<SD>['State'];
type ParallelNodeResult<State> = Partial<State>;

/**
 * Configuration for a parallel node
 */
export interface ParallelNode<State, Update = ParallelNodeResult<State>> {
  /**
   * Unique name for the node
   */
  name: string;

  /**
   * The node function that processes the state
   */
  node: (state: State) => Update | Promise<Update>;

  /**
   * Optional description of what this node does
   */
  description?: string;
}

/**
 * Configuration for an aggregation node that combines parallel results
 */
export interface AggregateNode<State, Update = ParallelNodeResult<State>> {
  /**
   * Name for the aggregation node
   */
  name: string;

  /**
   * The aggregation function that combines results from parallel nodes
   */
  node: (state: State) => Update | Promise<Update>;

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
   * Compatibility-only no-op retained to avoid a public type break.
   *
   * @deprecated This option is currently unused and will be removed in a future major release.
   */
  name?: string;
}

/**
 * Configuration for a parallel workflow
 */
export interface ParallelWorkflowConfig<State, Update = ParallelNodeResult<State>> {
  /**
   * Nodes that execute in parallel
   */
  parallel: ParallelNode<State, Update>[];

  /**
   * Optional aggregation node that runs after all parallel nodes complete
   */
  aggregate?: AggregateNode<State, Update>;
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
export function createParallelWorkflow<
  SD extends StateDefinition = StateDefinition,
  Update extends UpdateType<SD> = UpdateType<SD>
>(
  stateSchema: AnnotationRoot<SD>,
  config: ParallelWorkflowConfig<ParallelWorkflowState<SD>, Update>,
  options: ParallelWorkflowOptions = {}
): StateGraph<AnnotationRoot<SD>, ParallelWorkflowState<SD>, Update, string> {
  const { parallel, aggregate } = config;
  const { autoStartEnd = true } = options;

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
  const graph = new StateGraph<AnnotationRoot<SD>, ParallelWorkflowState<SD>, Update, string>(stateSchema);
  type GraphNodeAction = Parameters<typeof graph.addNode>[1];

  // Add all parallel nodes
  for (const { name: nodeName, node } of parallel) {
    // LangGraph's addNode() overloads widen update objects internally. Keep that
    // interop localized here rather than weakening the public workflow types.
    graph.addNode(nodeName, node as unknown as GraphNodeAction);
  }

  // Add aggregation node if provided
  if (aggregate) {
    graph.addNode(aggregate.name, aggregate.node as unknown as GraphNodeAction);
  }

  // Connect START to all parallel nodes (fan-out)
  if (autoStartEnd) {
    for (const { name: nodeName } of parallel) {
      graph.addEdge(START, nodeName);
    }
  }

  // Connect parallel nodes to aggregation or END (fan-in)
  if (aggregate) {
    // All parallel nodes connect to aggregation
    for (const { name: nodeName } of parallel) {
      graph.addEdge(nodeName, aggregate.name);
    }

    // Aggregation connects to END
    if (autoStartEnd) {
      graph.addEdge(aggregate.name, END);
    }
  } else if (autoStartEnd) {
    // No aggregation, connect all parallel nodes to END
    for (const { name: nodeName } of parallel) {
      graph.addEdge(nodeName, END);
    }
  }

  return graph;
}
