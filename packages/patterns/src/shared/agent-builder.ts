/**
 * Shared Agent Builder Utility
 *
 * Provides common patterns for building LangGraph agents to reduce code duplication
 * across different agent patterns (ReAct, Plan-Execute, Reflection, Multi-Agent).
 *
 * @module patterns/shared/agent-builder
 */

import { StateGraph, END, type BaseCheckpointSaver } from '@langchain/langgraph';
import type { ExtractStateType, ExtractUpdateType } from '@langchain/langgraph';

type AgentStateSchema = unknown;
type AgentRoute = string;
type AgentNodeOutput<TUpdate> = TUpdate extends object
  ? TUpdate & Record<string, unknown>
  : TUpdate;
type AgentGraph<
  TStateSchema,
  TState,
  TUpdate,
  TNodeName extends string,
> = ReturnType<StateGraph<TStateSchema, TState, TUpdate, TNodeName>['compile']>;

export type AgentNodeFn<TState, TUpdate> = (
  state: TState
) => Promise<AgentNodeOutput<TUpdate>> | AgentNodeOutput<TUpdate>;

/**
 * Node definition for agent builder
 */
export interface NodeDefinition<
  TState,
  TUpdate,
  TNodeName extends string = string,
> {
  /** Name of the node (must be unique within the graph) */
  name: TNodeName;
  /** Node function that processes state */
  fn: AgentNodeFn<TState, TUpdate>;
}

/**
 * Simple edge definition (unconditional edge)
 */
export interface SimpleEdge<TNodeName extends string = string> {
  /** Source node name */
  from: TNodeName;
  /** Target node name or END */
  to: TNodeName | typeof END;
}

/**
 * Conditional edge definition (routing logic)
 */
export interface ConditionalEdge<
  TState,
  TNodeName extends string = string,
  TRoute extends string = AgentRoute,
> {
  /** Source node name */
  from: TNodeName;
  /** Routing function that returns the next node name */
  condition: (state: TState) => TRoute | typeof END | TRoute[];
  /** Optional mapping of condition results to node names */
  mapping?: Record<string, TNodeName | typeof END>;
}

/**
 * Configuration for building a LangGraph agent
 */
export interface AgentBuilderConfig<
  TStateSchema = AgentStateSchema,
  TState = ExtractStateType<TStateSchema>,
  TUpdate = ExtractUpdateType<TStateSchema, TState>,
  TNodeName extends string = string,
  TRoute extends string = AgentRoute,
> {
  /** State annotation (created with createStateAnnotation) */
  state: TStateSchema;
  /** List of nodes to add to the graph */
  nodes: Array<NodeDefinition<TState, TUpdate, TNodeName>>;
  /** Entry point node name (where the graph starts) */
  entryPoint: TNodeName;
  /** Simple edges (unconditional transitions) */
  edges?: Array<SimpleEdge<TNodeName>>;
  /** Conditional edges (routing logic) */
  conditionalEdges?: Array<ConditionalEdge<TState, TNodeName, TRoute>>;
  /** Optional checkpointer for persistence and human-in-the-loop */
  checkpointer?: BaseCheckpointSaver | true;
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
export function buildAgent<
  TStateSchema = AgentStateSchema,
  TState = ExtractStateType<TStateSchema>,
  TUpdate = ExtractUpdateType<TStateSchema, TState>,
  TNodeName extends string = string,
  TRoute extends string = AgentRoute,
>(
  config: AgentBuilderConfig<TStateSchema, TState, TUpdate, TNodeName, TRoute>
): AgentGraph<TStateSchema, TState, TUpdate, TNodeName> {
  const {
    state,
    nodes,
    entryPoint,
    edges = [],
    conditionalEdges = [],
    checkpointer,
  } = config;

  // Create the workflow
  const workflow = new StateGraph<TStateSchema, TState, TUpdate, TNodeName>(
    state as never
  );

  // Add all nodes
  for (const { name, fn } of nodes) {
    workflow.addNode(name, fn);
  }

  // Set entry point
  workflow.addEdge('__start__', entryPoint);

  // Add simple edges
  for (const edge of edges) {
    workflow.addEdge(edge.from, edge.to);
  }

  // Add conditional edges
  for (const edge of conditionalEdges) {
    if (edge.mapping) {
      workflow.addConditionalEdges(edge.from, edge.condition, edge.mapping);
    } else {
      workflow.addConditionalEdges(edge.from, edge.condition);
    }
  }

  // Compile with checkpointer if provided
  return workflow.compile(checkpointer ? { checkpointer } : undefined);
}
