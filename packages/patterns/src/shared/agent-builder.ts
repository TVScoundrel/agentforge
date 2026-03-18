/**
 * Shared Agent Builder Utility
 *
 * Provides common patterns for building LangGraph agents to reduce code duplication
 * across different agent patterns (ReAct, Plan-Execute, Reflection, Multi-Agent).
 *
 * @module patterns/shared/agent-builder
 */

import { StateGraph, END, type BaseCheckpointSaver } from '@langchain/langgraph';
import type { ExtractStateType, ExtractUpdateType, StateDefinitionInit } from '@langchain/langgraph';

type AgentStateSchema = StateDefinitionInit;
type AgentRoute = string;
type AgentState<TStateSchema extends AgentStateSchema> = ExtractStateType<TStateSchema>;
type AgentUpdate<TStateSchema extends AgentStateSchema> = ExtractUpdateType<
  TStateSchema,
  AgentState<TStateSchema>
>;
type AgentGraph<
  TStateSchema extends AgentStateSchema,
  TNodeName extends string,
> = ReturnType<
  StateGraph<TStateSchema, AgentState<TStateSchema>, AgentUpdate<TStateSchema>, TNodeName>['compile']
>;

export type AgentNodeFn<TState, TUpdate> = (
  state: TState
) => Promise<TUpdate> | TUpdate;

type LangGraphNodeFn<TState, TUpdate> = (
  state: TState
) => Promise<TUpdate extends object ? TUpdate & Record<string, unknown> : TUpdate>
  | (TUpdate extends object ? TUpdate & Record<string, unknown> : TUpdate);

type StateGraphConstructor = new <TStateSchema extends AgentStateSchema>(
  state: TStateSchema
) => StateGraph<TStateSchema>;

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
  TStateSchema extends AgentStateSchema = AgentStateSchema,
  TNodeName extends string = string,
  TRoute extends string = AgentRoute,
> {
  /** State annotation (created with createStateAnnotation) */
  state: TStateSchema;
  /** List of nodes to add to the graph */
  nodes: Array<NodeDefinition<AgentState<TStateSchema>, AgentUpdate<TStateSchema>, TNodeName>>;
  /** Entry point node name (where the graph starts) */
  entryPoint: TNodeName;
  /** Simple edges (unconditional transitions) */
  edges?: Array<SimpleEdge<TNodeName>>;
  /** Conditional edges (routing logic) */
  conditionalEdges?: Array<ConditionalEdge<AgentState<TStateSchema>, TNodeName, TRoute>>;
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
  TStateSchema extends AgentStateSchema = AgentStateSchema,
  TNodeName extends string = string,
  TRoute extends string = AgentRoute,
>(
  config: AgentBuilderConfig<TStateSchema, TNodeName, TRoute>
): AgentGraph<TStateSchema, TNodeName> {
  const {
    state,
    nodes,
    entryPoint,
    edges = [],
    conditionalEdges = [],
    checkpointer,
  } = config;

  // Create the workflow
  const StateGraphCtor = StateGraph as unknown as StateGraphConstructor;
  const workflow = new StateGraphCtor(state);
  const dynamicWorkflow = workflow as unknown as {
    addNode: (
      name: TNodeName,
      fn: LangGraphNodeFn<AgentState<TStateSchema>, AgentUpdate<TStateSchema>>
    ) => void;
    addEdge: (from: TNodeName | '__start__', to: TNodeName | typeof END) => void;
    addConditionalEdges: (
      from: TNodeName,
      condition: (state: AgentState<TStateSchema>) => TRoute | typeof END | TRoute[],
      mapping?: Record<string, TNodeName | typeof END>
    ) => void;
    compile: (config?: { checkpointer?: BaseCheckpointSaver | true }) => unknown;
  };

  // Add all nodes
  for (const { name, fn } of nodes) {
    dynamicWorkflow.addNode(name, fn as LangGraphNodeFn<AgentState<TStateSchema>, AgentUpdate<TStateSchema>>);
  }

  // Set entry point
  dynamicWorkflow.addEdge('__start__', entryPoint);

  // Add simple edges
  for (const edge of edges) {
    dynamicWorkflow.addEdge(edge.from, edge.to);
  }

  // Add conditional edges
  for (const edge of conditionalEdges) {
    if (edge.mapping) {
      dynamicWorkflow.addConditionalEdges(edge.from, edge.condition, edge.mapping);
    } else {
      dynamicWorkflow.addConditionalEdges(edge.from, edge.condition);
    }
  }

  // Compile with checkpointer if provided
  return dynamicWorkflow.compile(checkpointer ? { checkpointer } : undefined) as unknown as AgentGraph<
    TStateSchema,
    TNodeName
  >;
}
