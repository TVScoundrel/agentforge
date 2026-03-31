/**
 * Reflection Agent Factory
 *
 * Creates a Reflection agent using LangGraph.
 *
 * @module patterns/reflection/agent
 */

import { StateGraph, END } from '@langchain/langgraph';
import { ReflectionState, type ReflectionStateType } from './state.js';
import { createGeneratorNode, createReflectorNode, createReviserNode, createFinisherNode } from './nodes.js';
import type { ReflectionAgentConfig } from './types.js';

type RouteAfterGenerator = 'reflect' | 'error';
type RouteAfterReflector = 'revise' | 'finish' | 'error';
type RouteAfterReviser = 'reflect' | 'finish' | 'error';

const generatorRouteMap = {
  reflect: 'reflector',
  error: END,
} as const satisfies Record<RouteAfterGenerator, 'reflector' | typeof END>;

const reflectorRouteMap = {
  revise: 'reviser',
  finish: 'finisher',
  error: END,
} as const satisfies Record<RouteAfterReflector, 'reviser' | 'finisher' | typeof END>;

const reviserRouteMap = {
  reflect: 'reflector',
  finish: 'finisher',
  error: END,
} as const satisfies Record<RouteAfterReviser, 'reflector' | 'finisher' | typeof END>;

/**
 * Create a Reflection agent
 *
 * This function creates a compiled LangGraph StateGraph that implements the
 * Reflection pattern for iterative improvement through generation, reflection, and revision.
 *
 * @param config - Configuration for the Reflection agent
 * @returns A compiled LangGraph StateGraph
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { createReflectionAgent } from '@agentforge/patterns';
 * import { ChatOpenAI } from '@langchain/openai';
 *
 * const model = new ChatOpenAI({ model: 'gpt-4' });
 *
 * const agent = createReflectionAgent({
 *   generator: { model },
 *   reflector: { model },
 *   reviser: { model },
 *   maxIterations: 3,
 *   qualityCriteria: {
 *     minScore: 8,
 *     criteria: ['clarity', 'accuracy', 'completeness']
 *   }
 * });
 *
 * const result = await agent.invoke({
 *   input: 'Write an essay about AI safety'
 * });
 * ```
 *
 * @example
 * With checkpointer for human-in-the-loop workflows:
 * ```typescript
 * import { createReflectionAgent } from '@agentforge/patterns';
 * import { createAskHumanTool } from '@agentforge/tools';
 * import { MemorySaver } from '@langchain/langgraph';
 * import { ChatOpenAI } from '@langchain/openai';
 *
 * const checkpointer = new MemorySaver();
 * const model = new ChatOpenAI({ model: 'gpt-4' });
 *
 * const agent = createReflectionAgent({
 *   generator: { model },
 *   reflector: { model },
 *   reviser: { model },
 *   maxIterations: 3,
 *   checkpointer  // Required for askHuman tool
 * });
 *
 * // Invoke with thread_id for conversation continuity
 * const result = await agent.invoke(
 *   { input: 'Write a report on this topic' },
 *   { configurable: { thread_id: 'conversation-123' } }
 * );
 * ```
 */
export function createReflectionAgent(config: ReflectionAgentConfig) {
  // Extract configuration with defaults
  const {
    generator,
    reflector,
    reviser,
    maxIterations = 3,
    qualityCriteria,
    verbose = false,
    checkpointer,
  } = config;

  // Create nodes
  const generatorNode = createGeneratorNode({ ...generator, verbose });
  const reflectorNode = createReflectorNode({ ...reflector, qualityCriteria, verbose });
  const reviserNode = createReviserNode({ ...reviser, verbose });
  const finisherNode = createFinisherNode();

  // Define routing logic
  const routeAfterGenerator = (state: ReflectionStateType): RouteAfterGenerator => {
    if (state.status === 'failed') {
      return 'error';
    }
    return 'reflect';
  };

  const routeAfterReflector = (state: ReflectionStateType): RouteAfterReflector => {
    if (state.status === 'failed') {
      return 'error';
    }

    if (state.status === 'completed') {
      return 'finish';
    }

    // Check if max iterations reached
    if (state.iteration >= maxIterations) {
      return 'finish';
    }

    return 'revise';
  };

  const routeAfterReviser = (state: ReflectionStateType): RouteAfterReviser => {
    if (state.status === 'failed') {
      return 'error';
    }

    // Check if max iterations reached
    if (state.iteration >= maxIterations) {
      return 'finish';
    }

    return 'reflect';
  };

  // Create the graph
  const workflow = new StateGraph(ReflectionState)
    .addNode('generator', generatorNode)
    .addNode('reflector', reflectorNode)
    .addNode('reviser', reviserNode)
    .addNode('finisher', finisherNode);

  // Add edges
  workflow
    .addEdge('__start__', 'generator')
    .addConditionalEdges(
      'generator',
      routeAfterGenerator,
      generatorRouteMap
    )
    .addConditionalEdges(
      'reflector',
      routeAfterReflector,
      reflectorRouteMap
    )
    .addConditionalEdges(
      'reviser',
      routeAfterReviser,
      reviserRouteMap
    )
    .addEdge('finisher', END);

  // Compile with checkpointer if provided
  return workflow.compile(checkpointer ? { checkpointer } : undefined);
}
