/**
 * TypeScript Types for Plan-and-Execute Pattern
 *
 * This module defines the TypeScript types for the Plan-and-Execute agent pattern.
 *
 * @module patterns/plan-execute/types
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Tool } from '@agentforge/core';
import type { PlanExecuteStateType } from './state.js';

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
export interface ExecutorConfig {
  /**
   * Available tools for execution
   */
  tools: Tool[];

  /**
   * Optional language model for sub-tasks
   */
  model?: BaseChatModel;

  /**
   * Enable parallel execution of independent steps
   */
  parallel?: boolean;

  /**
   * Timeout for each step execution (ms)
   */
  stepTimeout?: number;
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
export interface PlanExecuteAgentConfig {
  /**
   * Planner configuration
   */
  planner: PlannerConfig;

  /**
   * Executor configuration
   */
  executor: ExecutorConfig;

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

