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
 */
export function createActionNode(
  tools: Tool[],
  verbose: boolean = false
) {
  // Create a map for quick tool lookup
  const toolMap = new Map(tools.map((tool) => [tool.metadata.name, tool]));

  return async (state: ReActStateType) => {
    const actions = (state.actions as ToolCall[]) || [];
    if (verbose) {
      console.log(`[action] Executing ${actions.length} tool calls`);
    }

    // Get the most recent actions (from the last reasoning step)
    const recentActions = actions.slice(-10); // Last 10 actions
    const observations: ToolResult[] = [];

    // Execute each tool call
    for (const action of recentActions) {
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
        const result = await tool.execute(action.arguments);

        observations.push({
          toolCallId: action.id,
          result,
          timestamp: Date.now(),
        });

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

