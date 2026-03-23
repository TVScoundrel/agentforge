/**
 * Sequential Workflow Builder
 *
 * Provides utilities for building linear workflows where nodes execute in sequence.
 * This is a thin wrapper around LangGraph's StateGraph that simplifies the common
 * pattern of chaining nodes together.
 *
 * @module langgraph/builders/sequential
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import type { AnnotationRoot, StateDefinition, UpdateType } from '@langchain/langgraph';

type SequentialWorkflowState<SD extends StateDefinition> = AnnotationRoot<SD>['State'];
type SequentialNodeResult<State> = Partial<State>;

/**
 * Configuration for a node in a sequential workflow
 */
export interface SequentialNode<State, Update = SequentialNodeResult<State>> {
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
 * Options for creating a sequential workflow
 */
export interface SequentialWorkflowOptions {
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
 * Creates a sequential workflow where nodes execute in order.
 *
 * This is a convenience function that creates a StateGraph and chains
 * the provided nodes together with edges.
 *
 * @example
 * ```typescript
 * const workflow = createSequentialWorkflow(AgentState, [
 *   { name: 'fetch', node: fetchNode },
 *   { name: 'process', node: processNode },
 *   { name: 'save', node: saveNode },
 * ]);
 *
 * const app = workflow.compile();
 * const result = await app.invoke({ input: 'data' });
 * ```
 *
 * @param stateSchema - The state annotation for the graph
 * @param nodes - Array of nodes to execute in sequence
 * @param options - Optional configuration
 * @returns A configured StateGraph ready to compile
 */
export function createSequentialWorkflow<
  SD extends StateDefinition = StateDefinition,
  Update extends UpdateType<SD> = UpdateType<SD>
>(
  stateSchema: AnnotationRoot<SD>,
  nodes: SequentialNode<SequentialWorkflowState<SD>, Update>[],
  options: SequentialWorkflowOptions = {}
): StateGraph<AnnotationRoot<SD>, SequentialWorkflowState<SD>, Update, string> {
  const { autoStartEnd = true } = options;

  if (nodes.length === 0) {
    throw new Error('Sequential workflow must have at least one node');
  }

  // Validate node names are unique
  const nodeNames = new Set<string>();
  for (const node of nodes) {
    if (nodeNames.has(node.name)) {
      throw new Error(`Duplicate node name: ${node.name}`);
    }
    nodeNames.add(node.name);
  }

  // Create the graph
  const graph = new StateGraph<AnnotationRoot<SD>, SequentialWorkflowState<SD>, Update, string>(stateSchema);
  type GraphNodeAction = Parameters<typeof graph.addNode>[1];

  // Add all nodes
  for (const { name: nodeName, node } of nodes) {
    // LangGraph's addNode() overloads widen update objects internally. Keep that
    // interop localized here rather than weakening the public workflow types.
    graph.addNode(nodeName, node as unknown as GraphNodeAction);
  }

  // Chain nodes together with edges
  if (autoStartEnd) {
    // Connect START to first node
    graph.addEdge(START, nodes[0].name);
  }

  // Connect each node to the next
  for (let i = 0; i < nodes.length - 1; i++) {
    graph.addEdge(nodes[i].name, nodes[i + 1].name);
  }

  if (autoStartEnd) {
    // Connect last node to END
    graph.addEdge(nodes[nodes.length - 1].name, END);
  }

  return graph;
}

/**
 * Creates a sequential workflow builder with a fluent API.
 *
 * This provides a more flexible way to build sequential workflows
 * by allowing you to add nodes one at a time.
 *
 * @example
 * ```typescript
 * const workflow = sequentialBuilder(AgentState)
 *   .addNode('fetch', fetchNode)
 *   .addNode('process', processNode)
 *   .addNode('save', saveNode)
 *   .build();
 *
 * const app = workflow.compile();
 * ```
 *
 * @param stateSchema - The state annotation for the graph
 * @returns A fluent builder for sequential workflows
 */
export function sequentialBuilder<
  SD extends StateDefinition = StateDefinition,
  Update extends UpdateType<SD> = UpdateType<SD>
>(
  stateSchema: AnnotationRoot<SD>
) {
  type State = SequentialWorkflowState<SD>;
  const nodes: SequentialNode<State, Update>[] = [];
  let options: SequentialWorkflowOptions = {};

  return {
    /**
     * Add a node to the sequential workflow
     */
    addNode(
      name: string,
      node: (state: State) => Update | Promise<Update>,
      description?: string
    ) {
      nodes.push({ name, node, description });
      return this;
    },

    /**
     * Set options for the workflow
     */
    options(opts: SequentialWorkflowOptions) {
      options = { ...options, ...opts };
      return this;
    },

    /**
     * Build the StateGraph
     */
    build(): StateGraph<AnnotationRoot<SD>, State, Update, string> {
      return createSequentialWorkflow<SD, Update>(stateSchema, nodes, options);
    },
  };
}
