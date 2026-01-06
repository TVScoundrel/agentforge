/**
 * Multi-Agent System Factory
 *
 * This module provides the main factory function for creating multi-agent systems.
 *
 * @module patterns/multi-agent/agent
 */

import { StateGraph, END } from '@langchain/langgraph';
import { MultiAgentState } from './state.js';
import type { MultiAgentStateType } from './state.js';
import type { MultiAgentSystemConfig, MultiAgentRouter } from './types.js';
import { createSupervisorNode, createWorkerNode, createAggregatorNode } from './nodes.js';

/**
 * Create a multi-agent coordination system
 *
 * This factory function creates a complete multi-agent system with:
 * - A supervisor agent that routes tasks to workers
 * - Multiple specialized worker agents
 * - An aggregator that combines worker results
 *
 * @param config - Configuration for the multi-agent system
 * @returns Compiled LangGraph workflow
 *
 * @example
 * ```typescript
 * const system = createMultiAgentSystem({
 *   supervisor: {
 *     strategy: 'skill-based',
 *     llm: chatModel,
 *   },
 *   workers: [
 *     {
 *       id: 'researcher',
 *       capabilities: {
 *         skills: ['research', 'analysis'],
 *         tools: ['search', 'scrape'],
 *         available: true,
 *         currentWorkload: 0,
 *       },
 *       llm: chatModel,
 *     },
 *     {
 *       id: 'writer',
 *       capabilities: {
 *         skills: ['writing', 'editing'],
 *         tools: ['format', 'spell_check'],
 *         available: true,
 *         currentWorkload: 0,
 *       },
 *       llm: chatModel,
 *     },
 *   ],
 *   aggregator: {
 *     llm: chatModel,
 *   },
 * });
 *
 * const result = await system.invoke({
 *   input: 'Research AI trends and write a summary',
 * });
 * ```
 */
export function createMultiAgentSystem(config: MultiAgentSystemConfig) {
  const {
    supervisor,
    workers,
    aggregator,
    maxIterations = 10,
    verbose = false,
  } = config;

  // Validate configuration
  if (workers.length === 0) {
    throw new Error('At least one worker must be configured');
  }

  // Create the graph
  // @ts-expect-error - LangGraph's complex generic types don't infer well with createStateAnnotation
  const workflow = new StateGraph(MultiAgentState);

  // Add supervisor node
  const supervisorNode = createSupervisorNode({
    ...supervisor,
    maxIterations,
    verbose,
  });
  workflow.addNode('supervisor', supervisorNode);

  // Add worker nodes
  const workerIds: string[] = [];
  for (const workerConfig of workers) {
    const workerNode = createWorkerNode({
      ...workerConfig,
      verbose,
    });
    workflow.addNode(workerConfig.id, workerNode);
    workerIds.push(workerConfig.id);
  }

  // Add aggregator node
  const aggregatorNode = createAggregatorNode({
    ...aggregator,
    verbose,
  });
  workflow.addNode('aggregator', aggregatorNode);

  // Define routing logic
  const supervisorRouter: MultiAgentRouter = (state: MultiAgentStateType) => {
    // Check for completion or failure
    if (state.status === 'completed' || state.status === 'failed') {
      return END;
    }

    // Check if we should aggregate
    if (state.status === 'aggregating') {
      return 'aggregator';
    }

    // Route to the current agent
    if (state.currentAgent && state.currentAgent !== 'supervisor') {
      return state.currentAgent;
    }

    // Default: stay at supervisor
    return 'supervisor';
  };

  const workerRouter: MultiAgentRouter = (state: MultiAgentStateType) => {
    // Workers always return to supervisor
    return 'supervisor';
  };

  const aggregatorRouter: MultiAgentRouter = (state: MultiAgentStateType) => {
    // Aggregator always ends
    return END;
  };

  // Set entry point
  // @ts-expect-error - LangGraph's complex generic types don't infer well with createStateAnnotation
  workflow.setEntryPoint('supervisor');

  // Add edges from supervisor
  // @ts-expect-error - LangGraph's complex generic types don't infer well with createStateAnnotation
  workflow.addConditionalEdges('supervisor', supervisorRouter, [
    'aggregator',
    END,
    ...workerIds,
  ]);

  // Add edges from workers back to supervisor
  for (const workerId of workerIds) {
    // @ts-expect-error - LangGraph's complex generic types don't infer well with createStateAnnotation
    workflow.addConditionalEdges(workerId, workerRouter, ['supervisor']);
  }

  // Add edge from aggregator to end
  // @ts-expect-error - LangGraph's complex generic types don't infer well with createStateAnnotation
  workflow.addConditionalEdges('aggregator', aggregatorRouter, [END]);

  // Compile and return
  return workflow.compile();
}

/**
 * Helper function to register workers dynamically in state
 *
 * @param workers - Worker configurations
 * @returns Workers registry for initial state
 */
export function registerWorkers(workers: Array<{ id: string; capabilities: any }>) {
  const registry: Record<string, any> = {};
  for (const worker of workers) {
    registry[worker.id] = worker.capabilities;
  }
  return registry;
}

