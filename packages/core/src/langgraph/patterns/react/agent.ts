/**
 * ReAct agent builder
 *
 * Creates a ReAct (Reasoning and Action) agent using LangGraph.
 *
 * @module langgraph/patterns/react/agent
 */

import { StateGraph, END } from '@langchain/langgraph';
import type { CompiledStateGraph } from '@langchain/langgraph';
import type { ReActAgentConfig, ReActBuilderOptions } from './types.js';
import { ReActState, type ReActStateType } from './state.js';
import { DEFAULT_REACT_SYSTEM_PROMPT } from './prompts.js';
import { ToolRegistry } from '../../../tools/registry.js';
import type { Tool } from '../../../tools/types.js';
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
 * ```typescript
 * import { createReActAgent } from '@agentforge/patterns';
 * import { ChatOpenAI } from '@langchain/openai';
 *
 * const agent = createReActAgent({
 *   llm: new ChatOpenAI({ model: 'gpt-4' }),
 *   tools: toolRegistry,
 *   systemPrompt: 'You are a helpful assistant.',
 *   maxIterations: 10
 * });
 *
 * const result = await agent.invoke({
 *   messages: [{ role: 'user', content: 'What is the weather?' }]
 * });
 * ```
 */
export function createReActAgent(
  config: ReActAgentConfig,
  options?: ReActBuilderOptions
): CompiledStateGraph<ReActStateType> {
  // Extract configuration with defaults
  const {
    llm,
    tools,
    systemPrompt = DEFAULT_REACT_SYSTEM_PROMPT,
    maxIterations = 10,
    returnIntermediateSteps = false,
    stopCondition,
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
    llm,
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
    if (state.iteration >= maxIterations) {
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

  const workflow = new StateGraph(ReActState)
    .addNode(REASONING_NODE, reasoningNode)
    .addNode(ACTION_NODE, actionNode)
    .addNode(OBSERVATION_NODE, observationNode)
    .addEdge('__start__', REASONING_NODE)
    .addConditionalEdges(REASONING_NODE, shouldContinue)
    .addEdge(ACTION_NODE, OBSERVATION_NODE)
    .addEdge(OBSERVATION_NODE, REASONING_NODE);

  return workflow.compile();
}

