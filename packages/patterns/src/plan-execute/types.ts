/**
 * TypeScript Types for Plan-and-Execute Pattern
 *
 * This module defines the TypeScript types for the Plan-and-Execute agent pattern.
 *
 * @module patterns/plan-execute/types
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import type { Tool, ToolMetadata } from '@agentforge/core';
import type { PlanExecuteStateType } from './state.js';

export interface PlanExecuteTool {
  metadata: ToolMetadata;
  invoke: Tool<never, unknown>['invoke'];
}

/**
 * Configuration for the planner node
 */
export interface PlannerConfig {
  /**
   * Language model to use for planning
   */
  model: BaseChatModel;

  /**
   * System prompt for the planner
   */
  systemPrompt?: string;

  /**
   * Maximum number of steps in a plan
   */
  maxSteps?: number;

  /**
   * Whether to include tool descriptions in planning
   */
  includeToolDescriptions?: boolean;
}

/**
 * Configuration for the executor node
 */
export interface ExecutorConfig<TTool extends PlanExecuteTool = PlanExecuteTool> {
  /**
   * Available tools for execution
   */
  tools: readonly TTool[];

  /**
   * Optional language model for sub-tasks.
   * Currently unsupported and ignored by the runtime executor node.
   */
  model?: BaseChatModel;

  /**
   * Enable parallel execution of independent steps.
   * Currently unsupported and ignored by the runtime executor node.
   */
  parallel?: boolean;

  /**
   * Timeout for each step execution (ms)
   */
  stepTimeout?: number;

  /**
   * Enable tool call deduplication to prevent executing the same tool with identical parameters multiple times
   * @default true
   */
  enableDeduplication?: boolean;
}

/**
 * Configuration for the replanner node
 */
export interface ReplannerConfig {
  /**
   * Language model to use for replanning decisions
   */
  model: BaseChatModel;

  /**
   * Confidence threshold for replanning (0-1)
   * If confidence is below this, trigger replanning
   * Currently unsupported and ignored by the runtime replanner node.
   */
  replanThreshold?: number;

  /**
   * System prompt for replanning
   */
  systemPrompt?: string;
}

/**
 * Configuration for creating a Plan-Execute agent
 */
export interface PlanExecuteAgentConfig<TTool extends PlanExecuteTool = PlanExecuteTool> {
  /**
   * Planner configuration
   */
  planner: PlannerConfig;

  /**
   * Executor configuration
   */
  executor: ExecutorConfig<TTool>;

  /**
   * Optional replanner configuration
   * If not provided, no replanning will occur
   */
  replanner?: ReplannerConfig;

  /**
   * Maximum number of planning iterations
   */
  maxIterations?: number;

  /**
   * Whether to return intermediate steps
   */
  returnIntermediateSteps?: boolean;

  /**
   * Verbose logging
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
   * const agent = createPlanExecuteAgent({
   *   planner: { model },
   *   executor: { tools },
   *   checkpointer
   * });
   * ```
   */
  checkpointer?: BaseCheckpointSaver;
}

/**
 * Node function type for Plan-Execute pattern
 */
export type PlanExecuteNode = (state: PlanExecuteStateType) => Partial<PlanExecuteStateType> | Promise<Partial<PlanExecuteStateType>>;

/**
 * Routing decision for conditional edges
 */
export type PlanExecuteRoute = 'execute' | 'replan' | 'finish' | 'error';

/**
 * Router function type
 */
export type PlanExecuteRouter = (state: PlanExecuteStateType) => PlanExecuteRoute;
