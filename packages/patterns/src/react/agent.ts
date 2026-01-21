/**
 * ReAct agent builder
 *
 * Creates a ReAct (Reasoning and Action) agent using LangGraph.
 *
 * @module langgraph/patterns/react/agent
 */

import { StateGraph, END } from '@langchain/langgraph';
import type { CompiledStateGraph } from '@langchain/langgraph';
import { ToolRegistry, type Tool } from '@agentforge/core';
import type { ReActAgentConfig, ReActBuilderOptions } from './types.js';
import { ReActState, type ReActStateType } from './state.js';
import { DEFAULT_REACT_SYSTEM_PROMPT } from './prompts.js';
import { createReasoningNode, createActionNode, createObservationNode } from './nodes.js';

/**
 * Create a ReAct agent
 *
 * This function creates a compiled LangGraph StateGraph that implements the
 * ReAct (Reasoning and Action) pattern.
 *
 * @param config - Configuration for the ReAct agent
 * @param options - Optional builder options
 * @returns A compiled LangGraph StateGraph
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { createReActAgent } from '@agentforge/patterns';
 * import { ChatOpenAI } from '@langchain/openai';
 *
 * const agent = createReActAgent({
 *   model: new ChatOpenAI({ model: 'gpt-4' }),
 *   tools: toolRegistry,
 *   systemPrompt: 'You are a helpful assistant.',
 *   maxIterations: 10
 * });
 *
 * const result = await agent.invoke({
 *   messages: [{ role: 'user', content: 'What is the weather?' }]
 * });
 * ```
 *
 * @example
 * With checkpointer for human-in-the-loop workflows:
 * ```typescript
 * import { createReActAgent } from '@agentforge/patterns';
 * import { createAskHumanTool } from '@agentforge/tools';
 * import { MemorySaver } from '@langchain/langgraph';
 * import { ChatOpenAI } from '@langchain/openai';
 *
 * const checkpointer = new MemorySaver();
 * const askHuman = createAskHumanTool();
 *
 * const agent = createReActAgent({
 *   model: new ChatOpenAI({ model: 'gpt-4' }),
 *   tools: [askHuman, ...otherTools],
 *   checkpointer  // Required for askHuman tool
 * });
 *
 * // Invoke with thread_id for conversation continuity
 * const result = await agent.invoke(
 *   { messages: [{ role: 'user', content: 'Help me with this task' }] },
 *   { configurable: { thread_id: 'conversation-123' } }
 * );
 * ```
 */
export function createReActAgent(
  config: ReActAgentConfig,
  options?: ReActBuilderOptions
): CompiledStateGraph<any, any> {
  // Extract configuration with defaults
  const {
    model,
    tools,
    systemPrompt = DEFAULT_REACT_SYSTEM_PROMPT,
    maxIterations = 10,
    returnIntermediateSteps = false,
    stopCondition,
    checkpointer,
  } = config;

  const {
    verbose = false,
    nodeNames = {},
  } = options || {};

  // Convert tools to array if it's a registry
  const toolArray: Tool[] = tools instanceof ToolRegistry
    ? tools.getAll()
    : tools;

  // Node names (for debugging/observability)
  const REASONING_NODE = nodeNames.reasoning || 'reasoning';
  const ACTION_NODE = nodeNames.action || 'action';
  const OBSERVATION_NODE = nodeNames.observation || 'observation';

  // ===== Node Implementations =====

  const reasoningNode = createReasoningNode(
    model,
    toolArray,
    systemPrompt,
    maxIterations,
    verbose
  );

  const actionNode = createActionNode(toolArray, verbose);

  const observationNode = createObservationNode(verbose);

  // ===== Routing Logic =====

  /**
   * Determine whether to continue the ReAct loop or end
   */
  const shouldContinue = (state: ReActStateType): string => {
    // Check custom stop condition
    if (stopCondition && stopCondition(state)) {
      return END;
    }

    // Check max iterations
    if ((state.iteration as number) >= maxIterations) {
      return END;
    }

    // Check if we have a final response
    if (state.response) {
      return END;
    }

    // Check shouldContinue flag
    if (state.shouldContinue === false) {
      return END;
    }

    // Continue to action node
    return ACTION_NODE;
  };

  // ===== Build the Graph =====

  // @ts-ignore - LangGraph's complex generic types don't infer well with createStateAnnotation
  const workflow: StateGraph<ReActStateType> = new StateGraph(ReActState)
    .addNode(REASONING_NODE, reasoningNode)
    .addNode(ACTION_NODE, actionNode)
    .addNode(OBSERVATION_NODE, observationNode)
    .addEdge('__start__', REASONING_NODE)
    .addConditionalEdges(REASONING_NODE, shouldContinue as any)
    .addEdge(ACTION_NODE, OBSERVATION_NODE)
    .addEdge(OBSERVATION_NODE, REASONING_NODE);

  // Compile with checkpointer if provided
  return workflow.compile(checkpointer ? { checkpointer } : undefined) as any;
}

