/**
 * ReAct pattern types and configuration
 *
 * @module langgraph/patterns/react/types
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseCheckpointSaver, CompiledStateGraph } from '@langchain/langgraph';
import type { ToolRegistry, Tool, ToolMetadata } from '@agentforge/core';
import type { ZodSchema } from 'zod';
import type { ReActStateType } from './state.js';

export type ReActTool = Tool<unknown, unknown>;
// Preserve assignability for heterogeneous Tool<TInput, TOutput> values at the public
// boundary by erasing the invoke parameter while keeping schema metadata readable.
export interface ReActToolInput {
  metadata: ToolMetadata;
  schema: ZodSchema<unknown>;
  invoke: (input: never) => Promise<unknown>;
  execute?: (input: never) => Promise<unknown>;
}
export type ReActToolSource = ToolRegistry | ReActToolInput[];
export type ReActCheckpointer = BaseCheckpointSaver | true;
export type ReActPromptToolDescriptor = {
  name: string;
  description: string;
  schema: ZodSchema<unknown>;
};
export type ReActAgentGraph = CompiledStateGraph<ReActStateType, unknown>;

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
  tools: ReActToolSource;

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

  /**
   * Optional checkpointer for state persistence
   * Required for human-in-the-loop workflows (askHuman tool), interrupts, and conversation continuity
   *
   * Can be:
   * - A BaseCheckpointSaver instance (e.g., MemorySaver) for standalone agents
   * - `true` to use the parent graph's checkpointer with a separate namespace (for nested graphs)
   *
   * @example
   * Standalone agent with its own checkpointer:
   * ```typescript
   * import { MemorySaver } from '@langchain/langgraph';
   *
   * const checkpointer = new MemorySaver();
   * const agent = createReActAgent({
   *   model,
   *   tools,
   *   checkpointer
   * });
   * ```
   *
   * @example
   * Nested agent using parent's checkpointer (for multi-agent systems):
   * ```typescript
   * const agent = createReActAgent({
   *   model,
   *   tools,
   *   checkpointer: true  // Use parent's checkpointer with separate namespace
   * });
   * ```
   */
  checkpointer?: ReActCheckpointer;

  /**
   * Enable tool call deduplication to prevent calling the same tool with identical parameters multiple times
   * @default true
   */
  enableDeduplication?: boolean;
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

/**
 * Type alias for ReAct agent options
 */
export type ReActAgentOptions = ReActBuilderOptions;

/**
 * Stop condition function type
 */
export type StopConditionFn = (state: ReActStateType) => boolean;
