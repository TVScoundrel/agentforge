import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { type Tool, toLangChainTools } from '@agentforge/core';
import type { ReActStateType } from '../state.js';
import {
  buildReasoningMessages,
  debugIfVerbose,
  extractToolCalls,
  reasoningLogger,
  type LlmResponseWithToolCalls,
} from './shared.js';

/**
 * Create a reasoning node that generates thoughts and decides on actions
 *
 * @param llm - Language model to use
 * @param tools - Available tools
 * @param systemPrompt - System prompt for the agent
 * @param maxIterations - Maximum iterations allowed
 * @param verbose - Whether to log debug information
 */
export function createReasoningNode(
  llm: BaseChatModel,
  tools: Tool[],
  systemPrompt: string,
  maxIterations: number,
  verbose: boolean = false
) {
  const langchainTools = toLangChainTools(tools);
  const llmWithTools = llm.bindTools ? llm.bindTools(langchainTools) : llm;

  return async (state: ReActStateType) => {
    const currentIteration = state.iteration || 0;
    const startTime = Date.now();

    debugIfVerbose(reasoningLogger, verbose, 'Reasoning iteration started', {
      iteration: currentIteration + 1,
      maxIterations,
      observationCount: state.observations.length,
      hasActions: state.actions.length > 0,
    });

    const messages = buildReasoningMessages(systemPrompt, state.messages, state.scratchpad);
    const response = await llmWithTools.invoke(messages);
    const thought = typeof response.content === 'string' ? response.content : '';
    const toolCalls = extractToolCalls(response as LlmResponseWithToolCalls);
    const shouldContinue = toolCalls.length > 0 && currentIteration + 1 < maxIterations;

    reasoningLogger.info('Reasoning complete', {
      iteration: currentIteration + 1,
      thoughtGenerated: !!thought,
      actionCount: toolCalls.length,
      shouldContinue,
      isFinalResponse: toolCalls.length === 0,
      duration: Date.now() - startTime,
    });

    return {
      messages: [{ role: 'assistant' as const, content: thought }],
      thoughts: thought ? [{ content: thought, timestamp: Date.now() }] : [],
      actions: toolCalls,
      iteration: 1,
      shouldContinue,
      response: toolCalls.length === 0 ? thought : undefined,
    };
  };
}
