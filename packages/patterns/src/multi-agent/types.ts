/**
 * Type Definitions for Multi-Agent Coordination Pattern
 *
 * This module defines TypeScript types for the Multi-Agent pattern.
 *
 * @module patterns/multi-agent/types
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { CompiledStateGraph, BaseCheckpointSaver } from '@langchain/langgraph';
import type { Tool } from '@agentforge/core';
import type { MultiAgentStateType } from './state.js';
import type { RoutingStrategy, WorkerCapabilities, RoutingDecision } from './schemas.js';

/**
 * Configuration for the supervisor node
 */
export interface SupervisorConfig {
  /**
   * Language model for routing decisions (used for LLM-based routing)
   */
  model?: BaseChatModel;

  /**
   * Routing strategy to use
   */
  strategy: RoutingStrategy;

  /**
   * System prompt for the supervisor (LLM-based routing only)
   */
  systemPrompt?: string;

  /**
   * Custom routing function (for rule-based routing)
   */
  routingFn?: (state: MultiAgentStateType) => Promise<RoutingDecision>;

  /**
   * Whether to include verbose logging
   */
  verbose?: boolean;

  /**
   * Maximum number of routing iterations
   */
  maxIterations?: number;
}

/**
 * Configuration for a worker agent node
 */
export interface WorkerConfig {
  /**
   * Unique identifier for this worker
   */
  id: string;

  /**
   * Worker capabilities
   */
  capabilities: WorkerCapabilities;

  /**
   * Language model for the worker
   */
  model?: BaseChatModel;

  /**
   * Available tools for this worker
   */
  tools?: Tool<any, any>[];

  /**
   * System prompt for the worker
   */
  systemPrompt?: string;

  /**
   * Whether to include verbose logging
   */
  verbose?: boolean;

  /**
   * Custom execution function
   *
   * If provided, this function will be used to execute tasks for this worker.
   * Takes precedence over the `agent` property.
   */
  executeFn?: (state: MultiAgentStateType) => Promise<Partial<MultiAgentStateType>>;

  /**
   * ReAct agent instance
   *
   * If provided, the Multi-Agent pattern will automatically wrap this ReAct agent
   * to work as a worker. The agent should be a compiled LangGraph StateGraph
   * (e.g., created with `createReActAgent()`).
   *
   * Note: `executeFn` takes precedence over `agent` if both are provided.
   *
   * @example
   * ```typescript
   * const hrAgent = createReActAgent({ model, tools, systemPrompt });
   *
   * const system = createMultiAgentSystem({
   *   workers: [{
   *     id: 'hr',
   *     capabilities: { skills: ['hr'], ... },
   *     agent: hrAgent,  // Automatically wrapped!
   *   }]
   * });
   * ```
   */
  agent?: CompiledStateGraph<any, any>;
}

/**
 * Configuration for the aggregator node
 */
export interface AggregatorConfig {
  /**
   * Language model for aggregation (optional)
   */
  model?: BaseChatModel;

  /**
   * System prompt for aggregation
   */
  systemPrompt?: string;

  /**
   * Custom aggregation function
   */
  aggregateFn?: (state: MultiAgentStateType) => Promise<string>;

  /**
   * Whether to include verbose logging
   */
  verbose?: boolean;
}

/**
 * Configuration for the multi-agent system
 */
export interface MultiAgentSystemConfig {
  /**
   * Supervisor configuration
   */
  supervisor: SupervisorConfig;

  /**
   * Worker configurations
   */
  workers: WorkerConfig[];

  /**
   * Aggregator configuration (optional)
   */
  aggregator?: AggregatorConfig;

  /**
   * Maximum iterations for the entire system
   */
  maxIterations?: number;

  /**
   * Whether to include verbose logging
   */
  verbose?: boolean;

  /**
   * Optional checkpointer for state persistence
   * Required for human-in-the-loop workflows (askHuman tool), interrupts, and conversation continuity
   *
   * @example
   * ```typescript
   * import { MemorySaver } from '@langchain/langgraph';
   *
   * const checkpointer = new MemorySaver();
   * const system = createMultiAgentSystem({
   *   supervisor: { strategy: 'skill-based', model },
   *   workers: [...],
   *   checkpointer
   * });
   * ```
   */
  checkpointer?: BaseCheckpointSaver;
}

/**
 * Node type for multi-agent graph
 */
export type MultiAgentNode = 'supervisor' | 'aggregator' | string; // string for worker IDs

/**
 * Route type for multi-agent graph
 */
export type MultiAgentRoute = 'continue' | 'aggregate' | 'end' | string; // string for worker IDs

/**
 * Router function type
 */
export type MultiAgentRouter = (state: MultiAgentStateType) => MultiAgentRoute;

/**
 * Routing strategy implementation
 */
export interface RoutingStrategyImpl {
  /**
   * Name of the strategy
   */
  name: RoutingStrategy;

  /**
   * Execute the routing strategy
   */
  route: (state: MultiAgentStateType, config: SupervisorConfig) => Promise<RoutingDecision>;
}

