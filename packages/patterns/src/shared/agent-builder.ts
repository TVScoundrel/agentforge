/**
 * Shared Agent Builder Utility
 *
 * Provides common patterns for building LangGraph agents to reduce code duplication
 * across different agent patterns (ReAct, Plan-Execute, Reflection, Multi-Agent).
 *
 * @module patterns/shared/agent-builder
 */

import { StateGraph, END } from '@langchain/langgraph';
import type { CompiledStateGraph } from '@langchain/langgraph';

/**
 * Node definition for agent builder
 */
export interface NodeDefinition {
  /** Name of the node (must be unique within the graph) */
  name: string;
  /** Node function that processes state */
  fn: (state: any) => Promise<any> | any;
}

/**
 * Simple edge definition (unconditional edge)
 */
export interface SimpleEdge {
  /** Source node name */
  from: string;
  /** Target node name or END */
  to: string | typeof END;
}

/**
 * Conditional edge definition (routing logic)
 */
export interface ConditionalEdge {
  /** Source node name */
  from: string;
  /** Routing function that returns the next node name */
  condition: (state: any) => string | typeof END | string[];
  /** Optional mapping of condition results to node names */
  mapping?: Record<string, string | typeof END>;
}

/**
 * Configuration for building a LangGraph agent
 */
export interface AgentBuilderConfig {
  /** State annotation (created with createStateAnnotation) */
  state: any;
  /** List of nodes to add to the graph */
  nodes: NodeDefinition[];
  /** Entry point node name (where the graph starts) */
  entryPoint: string;
  /** Simple edges (unconditional transitions) */
  edges?: SimpleEdge[];
  /** Conditional edges (routing logic) */
  conditionalEdges?: ConditionalEdge[];
  /** Optional checkpointer for persistence and human-in-the-loop */
  checkpointer?: any;
}

/**
 * Build a LangGraph agent with standard patterns
 *
 * This utility function encapsulates the common pattern of:
 * 1. Creating a StateGraph
 * 2. Adding nodes
 * 3. Setting entry point
 * 4. Adding edges (simple and conditional)
 * 5. Compiling with optional checkpointer
 *
 * @param config - Agent builder configuration
 * @returns Compiled LangGraph StateGraph
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { buildAgent } from '@agentforge/patterns/shared';
 *
 * const agent = buildAgent({
 *   state: MyState,
 *   nodes: [
 *     { name: 'step1', fn: step1Node },
 *     { name: 'step2', fn: step2Node },
 *   ],
 *   entryPoint: 'step1',
 *   edges: [
 *     { from: 'step1', to: 'step2' },
 *     { from: 'step2', to: END },
 *   ],
 * });
 * ```
 *
 * @example
 * With conditional routing:
 * ```typescript
 * const agent = buildAgent({
 *   state: ReActState,
 *   nodes: [
 *     { name: 'reasoning', fn: reasoningNode },
 *     { name: 'action', fn: actionNode },
 *     { name: 'observation', fn: observationNode },
 *   ],
 *   entryPoint: 'reasoning',
 *   edges: [
 *     { from: 'action', to: 'observation' },
 *     { from: 'observation', to: 'reasoning' },
 *   ],
 *   conditionalEdges: [
 *     {
 *       from: 'reasoning',
 *       condition: shouldContinue,
 *       mapping: { continue: 'action', end: END },
 *     },
 *   ],
 *   checkpointer,
 * });
 * ```
 */
export function buildAgent(config: AgentBuilderConfig): CompiledStateGraph<any, any> {
  const {
    state,
    nodes,
    entryPoint,
    edges = [],
    conditionalEdges = [],
    checkpointer,
  } = config;

  // Create the workflow
  // @ts-ignore - LangGraph's complex generic types don't infer well with createStateAnnotation
  const workflow = new StateGraph(state);

  // Add all nodes
  for (const { name, fn } of nodes) {
    workflow.addNode(name, fn);
  }

  // Set entry point
  workflow.addEdge('__start__', entryPoint);

  // Add simple edges
  for (const edge of edges) {
    workflow.addEdge(edge.from, edge.to as any);
  }

  // Add conditional edges
  for (const edge of conditionalEdges) {
    if (edge.mapping) {
      workflow.addConditionalEdges(edge.from, edge.condition as any, edge.mapping as any);
    } else {
      workflow.addConditionalEdges(edge.from, edge.condition as any);
    }
  }

  // Compile with checkpointer if provided
  return workflow.compile(checkpointer ? { checkpointer } : undefined) as any;
}

