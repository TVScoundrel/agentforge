import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import type { JsonValue } from '@agentforge/core';
import type {
  Message,
  ScratchpadEntry,
  Thought,
  ToolCall,
  ToolResult,
} from '../state.js';
import { formatScratchpad } from '../prompts.js';
import { createPatternLogger } from '../../shared/deduplication.js';

export const reasoningLogger = createPatternLogger('agentforge:patterns:react:reasoning');
export const actionLogger = createPatternLogger('agentforge:patterns:react:action');
export const observationLogger = createPatternLogger('agentforge:patterns:react:observation');

type PatternLogger = typeof reasoningLogger;
type SupportedConversationMessage =
  | HumanMessage
  | AIMessage
  | SystemMessage
  | ToolMessage;

export type LlmToolCall = {
  id?: string;
  name: string;
  args?: Record<string, unknown>;
};

export type LlmResponseWithToolCalls = {
  content: unknown;
  tool_calls?: LlmToolCall[];
};

export function normalizeConversationMessage(message: Message): SupportedConversationMessage {
  switch (message.role) {
    case 'user':
      return new HumanMessage(message.content);
    case 'assistant':
      return new AIMessage(message.content);
    case 'system':
      return new SystemMessage(message.content);
    case 'tool':
      if (!message.tool_call_id) {
        reasoningLogger.warn(
          'Tool message missing tool_call_id; falling back to human message',
          message.name ? { name: message.name } : undefined
        );
        return new HumanMessage(message.content);
      }
      return new ToolMessage({
        content: message.content,
        tool_call_id: message.tool_call_id,
        name: message.name,
      });
    default:
      return new HumanMessage(message.content);
  }
}

export function buildReasoningMessages(
  systemPrompt: string,
  stateMessages: Message[],
  scratchpad: ScratchpadEntry[]
): BaseMessage[] {
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...stateMessages.map(normalizeConversationMessage),
  ];

  if (scratchpad.length > 0) {
    messages.push(new SystemMessage(`Previous steps:\n${formatScratchpad(scratchpad)}`));
  }

  return messages;
}

export function extractToolCalls(response: LlmResponseWithToolCalls): ToolCall[] {
  if (!response.tool_calls || response.tool_calls.length === 0) {
    return [];
  }

  return response.tool_calls.map((toolCall) => ({
    id: toolCall.id || `call_${Date.now()}_${Math.random()}`,
    name: toolCall.name,
    arguments: toolCall.args ?? {},
    timestamp: Date.now(),
  }));
}

export function formatObservationContent(observation: ToolResult): string {
  if (observation.error) {
    return `Error: ${observation.error}`;
  }

  return stringifyObservationResult(observation.result, 2);
}

export function formatActionSummary(actions: ToolCall[]): string {
  return actions
    .map((action) => `${action.name}(${JSON.stringify(action.arguments)})`)
    .join(', ');
}

export function formatObservationSummary(observations: ToolResult[]): string {
  return observations
    .map((observation) => {
      if (observation.error) {
        return `Error: ${observation.error}`;
      }

      return stringifyObservationResult(observation.result);
    })
    .join('; ');
}

export function stringifyObservationResult(result: unknown, space?: number): string {
  if (typeof result === 'string') {
    return result;
  }

  const stringified = JSON.stringify(result, null, space);
  return stringified ?? String(result);
}

export function getLatestThought(thoughts: Thought[]): string {
  return thoughts[thoughts.length - 1]?.content ?? '';
}

export function debugIfVerbose(
  logger: PatternLogger,
  verbose: boolean,
  message: string,
  data?: JsonValue
): void {
  if (verbose) {
    logger.debug(message, data);
  }
}
