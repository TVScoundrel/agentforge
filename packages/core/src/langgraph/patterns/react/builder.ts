/**
 * ReAct Agent Builder
 *
 * Fluent API for building ReAct agents with automatic validation.
 *
 * @example
 * ```ts
 * const agent = new ReActAgentBuilder()
 *   .withModel(new ChatOpenAI({ model: 'gpt-4' }))
 *   .withTools(toolRegistry)
 *   .withSystemPrompt('You are a helpful assistant.')
 *   .withMaxIterations(10)
 *   .withReturnIntermediateSteps(true)
 *   .build();
 * ```
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { CompiledStateGraph } from '@langchain/langgraph';
import type { ReActAgentConfig, ReActBuilderOptions } from './types.js';
import type { ReActStateType } from './state.js';
import { createReActAgent } from './agent.js';
import { ToolRegistry } from '../../../tools/registry.js';
import type { Tool } from '../../../tools/types.js';
import { DEFAULT_REACT_SYSTEM_PROMPT } from './prompts.js';

/**
 * Builder for creating ReAct agents with a fluent API
 *
 * This provides a more ergonomic way to create ReAct agents compared to
 * manually constructing the configuration object.
 */
export class ReActAgentBuilder {
  private config: Partial<ReActAgentConfig> = {};
  private options: ReActBuilderOptions = {};

  /**
   * Set the language model (required)
   *
   * @param model - LangChain chat model to use for reasoning
   */
  withModel(model: BaseChatModel): this {
    this.config.model = model;
    return this;
  }

  /**
   * @deprecated Use withModel() instead
   */
  withLLM(llm: BaseChatModel): this {
    return this.withModel(llm);
  }

  /**
   * Set the tools (required)
   *
   * @param tools - Tool registry or array of tools
   */
  withTools(tools: ToolRegistry | Tool[]): this {
    this.config.tools = tools;
    return this;
  }

  /**
   * Set the system prompt (optional)
   *
   * @param systemPrompt - System prompt for the agent
   */
  withSystemPrompt(systemPrompt: string): this {
    this.config.systemPrompt = systemPrompt;
    return this;
  }

  /**
   * Set the maximum iterations (optional, default: 10)
   *
   * @param maxIterations - Maximum number of thought-action loops
   */
  withMaxIterations(maxIterations: number): this {
    this.config.maxIterations = maxIterations;
    return this;
  }

  /**
   * Set whether to return intermediate steps (optional, default: false)
   *
   * @param returnIntermediateSteps - Whether to include reasoning steps in output
   */
  withReturnIntermediateSteps(returnIntermediateSteps: boolean): this {
    this.config.returnIntermediateSteps = returnIntermediateSteps;
    return this;
  }

  /**
   * Set a custom stop condition (optional)
   *
   * @param stopCondition - Function that determines when to stop the agent
   */
  withStopCondition(stopCondition: (state: ReActStateType) => boolean): this {
    this.config.stopCondition = stopCondition;
    return this;
  }

  /**
   * Enable verbose logging (optional, default: false)
   *
   * @param verbose - Whether to enable verbose logging
   */
  withVerbose(verbose: boolean): this {
    this.options.verbose = verbose;
    return this;
  }

  /**
   * Set custom node names (optional)
   *
   * @param nodeNames - Custom names for nodes (for debugging/observability)
   */
  withNodeNames(nodeNames: { reasoning?: string; action?: string; observation?: string }): this {
    this.options.nodeNames = nodeNames;
    return this;
  }

  /**
   * Build the ReAct agent
   *
   * @returns A compiled LangGraph StateGraph
   * @throws Error if required configuration is missing
   */
  build() {
    // Validate required fields
    if (!this.config.model) {
      throw new Error('ReActAgentBuilder: model is required. Use withModel() to set it.');
    }

    if (!this.config.tools) {
      throw new Error('ReActAgentBuilder: tools are required. Use withTools() to set them.');
    }

    // Create the agent with defaults
    const finalConfig: ReActAgentConfig = {
      model: this.config.model,
      tools: this.config.tools,
      systemPrompt: this.config.systemPrompt || DEFAULT_REACT_SYSTEM_PROMPT,
      maxIterations: this.config.maxIterations ?? 10,
      returnIntermediateSteps: this.config.returnIntermediateSteps ?? false,
      stopCondition: this.config.stopCondition,
    };

    return createReActAgent(finalConfig, this.options);
  }
}

/**
 * Create a new ReAct agent builder
 *
 * @returns A new ReActAgentBuilder instance
 *
 * @example
 * ```typescript
 * const agent = createReActAgentBuilder()
 *   .withLLM(llm)
 *   .withTools(tools)
 *   .build();
 * ```
 */
export function createReActAgentBuilder(): ReActAgentBuilder {
  return new ReActAgentBuilder();
}

