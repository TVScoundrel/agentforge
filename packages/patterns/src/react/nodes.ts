/**
 * ReAct pattern node implementations
 *
 * @module langgraph/patterns/react/nodes
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { type Tool, toLangChainTools } from '@agentforge/core';
import type { ReActStateType, ToolCall, ToolResult } from './state.js';
import { formatToolsForPrompt, formatScratchpad, formatThoughts } from './prompts.js';
import {
  generateToolCallCacheKey,
  createPatternLogger,
  buildDeduplicationMetrics,
} from '../shared/deduplication.js';

// Create logger for ReAct pattern
const logger = createPatternLogger('agentforge:react');

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
    if (verbose) {
      console.log(`[reasoning] Iteration ${(state.iteration as number) + 1}/${maxIterations}`);
    }

    // Build messages for the LLM
    const stateMessages = (state.messages as any[]) || [];
    const messages = [
      new SystemMessage(systemPrompt),
      ...stateMessages.map((msg: any) => {
        if (msg.role === 'user') return new HumanMessage(msg.content);
        if (msg.role === 'assistant') return new AIMessage(msg.content);
        if (msg.role === 'system') return new SystemMessage(msg.content);
        return new HumanMessage(msg.content); // fallback
      }),
    ];

    // Add context about current state
    const scratchpad = (state.scratchpad as any[]) || [];
    if (scratchpad.length > 0) {
      const scratchpadText = formatScratchpad(scratchpad);
      messages.push(new SystemMessage(`Previous steps:\n${scratchpadText}`));
    }

    // Invoke the LLM
    const response = await llmWithTools.invoke(messages);

    // Extract thought and tool calls
    const thought = typeof response.content === 'string' ? response.content : '';
    const toolCalls: ToolCall[] = [];

    // Check if the response has tool calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        toolCalls.push({
          id: toolCall.id || `call_${Date.now()}_${Math.random()}`,
          name: toolCall.name,
          arguments: toolCall.args || {},
          timestamp: Date.now(),
        });
      }
    }

    // Determine if we should continue
    const currentIteration = (state.iteration as number) || 0;
    const shouldContinue = toolCalls.length > 0 && currentIteration + 1 < maxIterations;

    // Update state
    return {
      messages: [{ role: 'assistant' as const, content: thought }],
      thoughts: thought ? [{ content: thought, timestamp: Date.now() }] : [],
      actions: toolCalls,
      iteration: 1, // Increment iteration
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
    const actions = (state.actions as ToolCall[]) || [];
    const allObservations = (state.observations as ToolResult[]) || [];
    const iteration = (state.iteration as number) || 0;

    if (verbose) {
      console.log(`[action] Executing ${actions.length} tool calls`);
    }

    logger.debug('Action node executing', {
      totalActions: actions.length,
      iteration,
      deduplicationEnabled: enableDeduplication
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
        logger.debug('Deduplication cache built', {
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
        if (verbose) {
          console.log(`[action] Skipping already-processed action: ${action.name} (id: ${action.id})`);
        }
        continue;
      }

      // Check for duplicate tool call
      if (enableDeduplication) {
        const cacheKey = generateToolCallCacheKey(action.name, action.arguments);
        const cachedResult = executionCache.get(cacheKey);

        if (cachedResult) {
          duplicatesSkipped++;

          logger.info('Duplicate tool call prevented', {
            toolName: action.name,
            arguments: action.arguments,
            iteration,
            cacheHit: true
          });

          if (verbose) {
            console.log(`[action] ⚠️  Skipping duplicate tool call: ${action.name} (already executed with same arguments)`);
          }

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
        const result = await tool.execute(action.arguments);
        const executionTime = Date.now() - startTime;

        toolsExecuted++;

        logger.debug('Tool executed successfully', {
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

        if (verbose) {
          console.log(`[action] Tool '${action.name}' executed successfully`);
        }
      } catch (error) {
        // Check if this is a GraphInterrupt - if so, let it bubble up
        // GraphInterrupt is used by LangGraph's interrupt() function for human-in-the-loop
        if (error && typeof error === 'object' && 'constructor' in error &&
            error.constructor.name === 'GraphInterrupt') {
          // Re-throw GraphInterrupt so the graph can handle it
          throw error;
        }

        // Tool execution failed (non-interrupt error)
        const errorMessage = error instanceof Error ? error.message : String(error);

        logger.warn('Tool execution failed', {
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

        if (verbose) {
          console.error(`[action] Tool '${action.name}' failed:`, errorMessage);
        }
      }
    }

    // Log summary of action node execution
    if (duplicatesSkipped > 0 || toolsExecuted > 0) {
      const metrics = buildDeduplicationMetrics(toolsExecuted, duplicatesSkipped, observations.length);
      logger.info('Action node complete', {
        iteration,
        ...metrics,
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
 */
export function createObservationNode(
  verbose: boolean = false
) {
  return async (state: ReActStateType) => {
    const observations = (state.observations as ToolResult[]) || [];
    const thoughts = (state.thoughts as any[]) || [];
    const actions = (state.actions as ToolCall[]) || [];

    if (verbose) {
      console.log(`[observation] Processing ${observations.length} observations`);
    }

    // Get the most recent observations
    const recentObservations = observations.slice(-10);

    // Update scratchpad with the latest step
    const currentStep = state.iteration as number;
    const latestThought = thoughts[thoughts.length - 1]?.content || '';
    const latestActions = actions.slice(-10);
    const latestObservations = recentObservations;

    // Create scratchpad entry
    const scratchpadEntry = {
      step: currentStep,
      thought: latestThought,
      action: latestActions.map((a: any) => `${a.name}(${JSON.stringify(a.arguments)})`).join(', '),
      observation: latestObservations
        .map((obs: any) => {
          if (obs.error) {
            return `Error: ${obs.error}`;
          }
          return typeof obs.result === 'string'
            ? obs.result
            : JSON.stringify(obs.result);
        })
        .join('; '),
      timestamp: Date.now(),
    };

    // Add observation results as messages
    const observationMessages = latestObservations.map((obs: any) => {
      const content = obs.error
        ? `Error: ${obs.error}`
        : typeof obs.result === 'string'
        ? obs.result
        : JSON.stringify(obs.result, null, 2);

      return {
        role: 'tool' as const,
        content,
        name: latestActions.find((a: any) => a.id === obs.toolCallId)?.name,
      };
    });

    return {
      scratchpad: [scratchpadEntry],
      messages: observationMessages,
    };
  };
}

