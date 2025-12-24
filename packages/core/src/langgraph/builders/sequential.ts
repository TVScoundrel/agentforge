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
import type { StateGraphArgs } from '@langchain/langgraph';

/**
 * Configuration for a node in a sequential workflow
 */
export interface SequentialNode<State> {
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
 * Options for creating a sequential workflow
 */
export interface SequentialWorkflowOptions {
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
export function createSequentialWorkflow<State>(
  stateSchema: any,
  nodes: SequentialNode<State>[],
  options: SequentialWorkflowOptions = {}
): StateGraph<State> {
  const { autoStartEnd = true, name } = options;

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
  const graph = new StateGraph<State>(stateSchema);

  // Add all nodes
  for (const { name: nodeName, node } of nodes) {
    // @ts-expect-error - LangGraph's complex generic types don't infer well here
    graph.addNode(nodeName, node);
  }

  // Chain nodes together with edges
  if (autoStartEnd) {
    // Connect START to first node
    graph.addEdge(START as any, nodes[0].name as any);
  }

  // Connect each node to the next
  for (let i = 0; i < nodes.length - 1; i++) {
    graph.addEdge(nodes[i].name as any, nodes[i + 1].name as any);
  }

  if (autoStartEnd) {
    // Connect last node to END
    graph.addEdge(nodes[nodes.length - 1].name as any, END as any);
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
export function sequentialBuilder<State>(
  stateSchema: any
) {
  const nodes: SequentialNode<State>[] = [];
  let options: SequentialWorkflowOptions = {};

  return {
    /**
     * Add a node to the sequential workflow
     */
    addNode(
      name: string,
      node: (state: State) => State | Promise<State> | Partial<State> | Promise<Partial<State>>,
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
    build(): StateGraph<State> {
      return createSequentialWorkflow(stateSchema, nodes, options);
    },
  };
}

