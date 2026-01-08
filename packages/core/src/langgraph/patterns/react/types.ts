/**
 * ReAct pattern types and configuration
 *
 * @module langgraph/patterns/react/types
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ToolRegistry } from '../../../tools/registry.js';
import type { Tool } from '../../../tools/types.js';
import type { ReActStateType } from './state.js';

/**
 * Configuration for creating a ReAct agent
 */
export interface ReActAgentConfig {
  /**
   * Language model to use for reasoning
   */
  model: BaseChatModel;

  /**
   * Tools available to the agent
   * Can be a ToolRegistry or an array of Tools
   */
  tools: ToolRegistry | Tool[];

  /**
   * System prompt for the agent
   * @default "You are a helpful assistant that uses tools to solve problems."
   */
  systemPrompt?: string;

  /**
   * Maximum number of thought-action-observation iterations
   * @default 10
   */
  maxIterations?: number;

  /**
   * Whether to return intermediate steps in the response
   * @default false
   */
  returnIntermediateSteps?: boolean;

  /**
   * Custom stop condition function
   * Return true to stop the ReAct loop
   */
  stopCondition?: (state: ReActStateType) => boolean;
}

/**
 * Options for the ReAct agent builder
 */
export interface ReActBuilderOptions {
  /**
   * Whether to enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Custom node names (for debugging/observability)
   */
  nodeNames?: {
    reasoning?: string;
    action?: string;
    observation?: string;
  };
}

