/**
 * ReAct pattern node implementations
 *
 * @module langgraph/patterns/react/nodes
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { type JsonValue, type Tool, toLangChainTools } from '@agentforge/core';
import type {
  Message,
  ReActStateType,
  ScratchpadEntry,
  Thought,
  ToolCall,
  ToolResult,
} from './state.js';
import { formatScratchpad } from './prompts.js';
import {
  generateToolCallCacheKey,
  createPatternLogger,
  buildDeduplicationMetrics,
} from '../shared/deduplication.js';
import { handleNodeError } from '../shared/error-handling.js';

// Create loggers for ReAct pattern nodes
const reasoningLogger = createPatternLogger('agentforge:patterns:react:reasoning');
const actionLogger = createPatternLogger('agentforge:patterns:react:action');
const observationLogger = createPatternLogger('agentforge:patterns:react:observation');
type PatternLogger = typeof reasoningLogger;

type SupportedConversationMessage =
  | HumanMessage
  | AIMessage
  | SystemMessage
  | ToolMessage;

type LlmToolCall = {
  id?: string;
  name: string;
  args?: Record<string, unknown>;
};

type LlmResponseWithToolCalls = {
  content: unknown;
  tool_calls?: LlmToolCall[];
};

function normalizeConversationMessage(message: Message): SupportedConversationMessage {
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

function buildReasoningMessages(
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

function extractToolCalls(response: LlmResponseWithToolCalls): ToolCall[] {
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

function formatObservationContent(observation: ToolResult): string {
  if (observation.error) {
    return `Error: ${observation.error}`;
  }

  return typeof observation.result === 'string'
    ? observation.result
    : JSON.stringify(observation.result, null, 2);
}

function formatActionSummary(actions: ToolCall[]): string {
  return actions
    .map((action) => `${action.name}(${JSON.stringify(action.arguments)})`)
    .join(', ');
}

function formatObservationSummary(observations: ToolResult[]): string {
  return observations
    .map((observation) => {
      if (observation.error) {
        return `Error: ${observation.error}`;
      }

      return typeof observation.result === 'string'
        ? observation.result
        : JSON.stringify(observation.result);
    })
    .join('; ');
}

function getLatestThought(thoughts: Thought[]): string {
  return thoughts[thoughts.length - 1]?.content ?? '';
}

function debugIfVerbose(
  logger: PatternLogger,
  verbose: boolean,
  message: string,
  data?: JsonValue
): void {
  if (verbose) {
    logger.debug(message, data);
  }
}

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
  // Bind tools to the LLM
  const langchainTools = toLangChainTools(tools);
  const llmWithTools = llm.bindTools ? llm.bindTools(langchainTools) : llm;

  return async (state: ReActStateType) => {
    const currentIteration = state.iteration || 0;
    const startTime = Date.now();

    debugIfVerbose(reasoningLogger, verbose, 'Reasoning iteration started', {
      iteration: currentIteration + 1,
      maxIterations,
      observationCount: state.observations.length,
      hasActions: state.actions.length > 0
    });

    // Build messages for the LLM
    const messages = buildReasoningMessages(systemPrompt, state.messages, state.scratchpad);

    // Invoke the LLM
    const response = await llmWithTools.invoke(messages);

    // Extract thought and tool calls
    const thought = typeof response.content === 'string' ? response.content : '';
    const toolCalls = extractToolCalls(response as LlmResponseWithToolCalls);

    // Determine if we should continue
    const shouldContinue = toolCalls.length > 0 && currentIteration + 1 < maxIterations;

    reasoningLogger.info('Reasoning complete', {
      iteration: currentIteration + 1,
      thoughtGenerated: !!thought,
      actionCount: toolCalls.length,
      shouldContinue,
      isFinalResponse: toolCalls.length === 0,
      duration: Date.now() - startTime
    });

    // Update state
    return {
      messages: [{ role: 'assistant' as const, content: thought }],
      thoughts: thought ? [{ content: thought, timestamp: Date.now() }] : [],
      actions: toolCalls,
      iteration: 1, // Add 1 to iteration counter (uses additive reducer)
      shouldContinue,
      response: toolCalls.length === 0 ? thought : undefined, // Final response if no tool calls
    };
  };
}

/**
 * Create an action node that executes tool calls
 *
 * @param tools - Available tools
 * @param verbose - Whether to log debug information
 * @param enableDeduplication - Whether to enable tool call deduplication
 */
export function createActionNode(
  tools: Tool[],
  verbose: boolean = false,
  enableDeduplication: boolean = true
) {
  // Create a map for quick tool lookup
  const toolMap = new Map(tools.map((tool) => [tool.metadata.name, tool]));

  return async (state: ReActStateType) => {
    const actions = state.actions;
    const allObservations = state.observations;
    const iteration = state.iteration || 0;
    const startTime = Date.now();

    debugIfVerbose(actionLogger, verbose, 'Action node started', {
      actionCount: actions.length,
      iteration,
      cacheEnabled: enableDeduplication
    });

    // Get the most recent actions (from the last reasoning step)
    const recentActions = actions.slice(-10); // Last 10 actions
    const observations: ToolResult[] = [];

    // Build a cache of previously executed tool calls for deduplication
    const executionCache = new Map<string, ToolResult>();
    let cacheSize = 0;

    if (enableDeduplication) {
      // Build cache from ALL previous observations
      // Match each observation to its corresponding action to get the tool name and arguments
      for (const observation of allObservations) {
        const correspondingAction = actions.find(a => a.id === observation.toolCallId);
        if (correspondingAction) {
          const cacheKey = generateToolCallCacheKey(correspondingAction.name, correspondingAction.arguments);
          executionCache.set(cacheKey, observation);
          cacheSize++;
        }
      }

      if (cacheSize > 0) {
        debugIfVerbose(actionLogger, verbose, 'Deduplication cache built', {
          cacheSize,
          totalObservations: allObservations.length
        });
      }
    }

    // Track deduplication metrics
    let duplicatesSkipped = 0;
    let toolsExecuted = 0;

    // Execute each tool call
    for (const action of recentActions) {
      // Skip actions that already have observations (already processed)
      const existingObservation = allObservations.find(obs => obs.toolCallId === action.id);
      if (existingObservation) {
        debugIfVerbose(actionLogger, verbose, 'Skipping already-processed action', {
          toolName: action.name,
          toolCallId: action.id,
          iteration
        });
        continue;
      }

      // Check for duplicate tool call
      if (enableDeduplication) {
        const cacheKey = generateToolCallCacheKey(action.name, action.arguments);
        const cachedResult = executionCache.get(cacheKey);

        if (cachedResult) {
          duplicatesSkipped++;

          actionLogger.info('Duplicate tool call prevented', {
            toolName: action.name,
            arguments: action.arguments,
            iteration,
            cacheHit: true
          });

          // Return a special observation indicating this was a duplicate
          observations.push({
            toolCallId: action.id,
            result: cachedResult.result,
            error: cachedResult.error,
            timestamp: Date.now(),
            isDuplicate: true,
          });
          continue;
        }
      }

      const tool = toolMap.get(action.name);

      if (!tool) {
        // Tool not found
        observations.push({
          toolCallId: action.id,
          result: null,
          error: `Tool '${action.name}' not found`,
          timestamp: Date.now(),
        });
        continue;
      }

      try {
        // Execute the tool
        const startTime = Date.now();
        const result = await tool.invoke(action.arguments);
        const executionTime = Date.now() - startTime;

        toolsExecuted++;

        debugIfVerbose(actionLogger, verbose, 'Tool executed successfully', {
          toolName: action.name,
          executionTime,
          iteration
        });

        const observation: ToolResult = {
          toolCallId: action.id,
          result,
          timestamp: Date.now(),
        };

        observations.push(observation);

        // Cache this execution for future deduplication
        if (enableDeduplication) {
          const cacheKey = generateToolCallCacheKey(action.name, action.arguments);
          executionCache.set(cacheKey, observation);
        }
      } catch (error) {
        // Handle error with proper GraphInterrupt detection
        const errorMessage = handleNodeError(error, `action:${action.name}`, verbose);

        actionLogger.error('Tool execution failed', {
          toolName: action.name,
          error: errorMessage,
          iteration
        });

        observations.push({
          toolCallId: action.id,
          result: null,
          error: errorMessage,
          timestamp: Date.now(),
        });
      }
    }

    // Log summary of action node execution
    if (duplicatesSkipped > 0 || toolsExecuted > 0) {
      const metrics = buildDeduplicationMetrics(toolsExecuted, duplicatesSkipped, observations.length);
      actionLogger.info('Action node complete', {
        iteration,
        ...metrics,
        duration: Date.now() - startTime
      });
    }

    return {
      observations,
    };
  };
}

/**
 * Create an observation node that processes tool results and updates scratchpad
 *
 * @param verbose - Whether to log debug information
 * @param returnIntermediateSteps - Whether to populate the scratchpad with intermediate steps
 */
export function createObservationNode(
  verbose: boolean = false,
  returnIntermediateSteps: boolean = false
) {
  return async (state: ReActStateType) => {
    const observations = state.observations;
    const thoughts = state.thoughts;
    const actions = state.actions;
    const iteration = state.iteration || 0;

    debugIfVerbose(observationLogger, verbose, 'Processing observations', {
      observationCount: observations.length,
      iteration
    });

    // Get the most recent observations
    const recentObservations = observations.slice(-10);
    const latestActions = actions.slice(-10);
    const actionNamesById = new Map(latestActions.map((action) => [action.id, action.name]));

    // Add observation results as messages
    const observationMessages = recentObservations.map((observation) => ({
        role: 'tool' as const,
        content: formatObservationContent(observation),
        name: actionNamesById.get(observation.toolCallId),
        tool_call_id: observation.toolCallId,
      }));

    // Only populate scratchpad if returnIntermediateSteps is enabled
    const scratchpadEntries = returnIntermediateSteps ? [{
      step: state.iteration,
      thought: getLatestThought(thoughts),
      action: formatActionSummary(latestActions),
      observation: formatObservationSummary(recentObservations),
      timestamp: Date.now(),
    }] : [];

    debugIfVerbose(observationLogger, verbose, 'Observation node complete', {
      iteration,
      scratchpadUpdated: returnIntermediateSteps,
      messageCount: observationMessages.length
    });

    return {
      scratchpad: scratchpadEntries,
      messages: observationMessages,
    };
  };
}
