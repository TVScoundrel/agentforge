/**
 * Type Definitions for Multi-Agent Coordination Pattern
 *
 * This module defines TypeScript types for the Multi-Agent pattern.
 *
 * @module patterns/multi-agent/types
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
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
  llm?: BaseChatModel;

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
  llm?: BaseChatModel;

  /**
   * Available tools for this worker
   */
  tools?: Tool[];

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
   */
  executeFn?: (state: MultiAgentStateType) => Promise<Partial<MultiAgentStateType>>;
}

/**
 * Configuration for the aggregator node
 */
export interface AggregatorConfig {
  /**
   * Language model for aggregation (optional)
   */
  llm?: BaseChatModel;

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

