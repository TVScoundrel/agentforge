/**
 * Plan-and-Execute Agent Factory
 *
 * This module provides the main factory function for creating Plan-and-Execute agents.
 *
 * @module patterns/plan-execute/agent
 */

import { StateGraph, END } from '@langchain/langgraph';
import { PlanExecuteState, type PlanExecuteStateType } from './state.js';
import { createPlannerNode, createExecutorNode, createReplannerNode, createFinisherNode } from './nodes.js';
import type { PlanExecuteAgentConfig, PlanExecuteRoute } from './types.js';

/**
 * Create a Plan-and-Execute agent
 *
 * This agent separates planning from execution for better performance on complex tasks.
 * It creates a plan, executes steps, and optionally replans based on results.
 *
 * @param config - Configuration for the agent
 * @returns A compiled LangGraph StateGraph
 *
 * @example
 * ```typescript
 * import { createPlanExecuteAgent } from '@agentforge/patterns';
 * import { ChatOpenAI } from '@langchain/openai';
 *
 * const agent = createPlanExecuteAgent({
 *   planner: {
 *     model: new ChatOpenAI({ model: 'gpt-4' }),
 *     maxSteps: 5
 *   },
 *   executor: {
 *     tools: [searchTool, calculatorTool],
 *     parallel: false
 *   },
 *   replanner: {
 *     model: new ChatOpenAI({ model: 'gpt-4' }),
 *     replanThreshold: 0.7
 *   }
 * });
 *
 * const result = await agent.invoke({
 *   input: 'Research the latest AI developments and summarize them'
 * });
 * ```
 */
export function createPlanExecuteAgent(config: PlanExecuteAgentConfig) {
  const {
    planner,
    executor,
    replanner,
    maxIterations = 5,
    verbose = false,
  } = config;

  // Create nodes
  const plannerNode = createPlannerNode(planner);
  const executorNode = createExecutorNode(executor);
  const finisherNode = createFinisherNode();

  // Create a no-op replanner if not configured
  const replannerNode = replanner
    ? createReplannerNode(replanner)
    : async (state: PlanExecuteStateType) => ({ status: 'executing' as const });

  // Create the graph
  // @ts-ignore - LangGraph's complex generic types don't infer well with createStateAnnotation
  const workflow = new StateGraph(PlanExecuteState)
    .addNode('planner', plannerNode)
    .addNode('executor', executorNode)
    .addNode('finisher', finisherNode)
    .addNode('replanner', replannerNode);

  // Define routing logic
  const routeAfterExecutor = (state: PlanExecuteStateType): PlanExecuteRoute => {
    // Check for errors
    if (state.status === 'failed') {
      return 'error';
    }

    // Check if status is already completed
    if (state.status === 'completed') {
      return 'finish';
    }

    // Check if all steps are completed
    const allStepsCompleted = state.currentStepIndex !== undefined &&
      state.plan?.steps &&
      state.currentStepIndex >= state.plan.steps.length;

    if (allStepsCompleted) {
      return 'finish';
    }

    // Check if we should replan
    if (replanner && state.iteration < maxIterations) {
      // Check if any recent steps failed
      const recentSteps = state.pastSteps?.slice(-3) || [];
      const hasFailures = recentSteps.some(step => !step.success);

      if (hasFailures) {
        return 'replan';
      }
    }

    // Continue executing
    return 'execute';
  };

  const routeAfterReplanner = (state: PlanExecuteStateType): PlanExecuteRoute => {
    if (state.status === 'failed') {
      return 'error';
    }

    if (state.status === 'planning') {
      // Replan triggered, go back to planner
      return 'replan';
    }

    // Continue executing
    return 'execute';
  };

  // Set entry point
  workflow.addEdge('__start__', 'planner');

  // Add edges from planner
  workflow.addEdge('planner', 'executor');

  // Add conditional edges from executor
  workflow.addConditionalEdges(
    'executor',
    routeAfterExecutor as any,
    {
      execute: 'executor', // Loop back to execute next step
      replan: 'replanner',
      finish: 'finisher',
      error: END,
    }
  );

  // Add edge from finisher to END
  workflow.addEdge('finisher', END);

  // Add conditional edges from replanner
  workflow.addConditionalEdges(
    'replanner',
    routeAfterReplanner as any,
    {
      replan: 'planner',
      execute: 'executor',
      error: END,
      finish: END,
    }
  );

  // Compile and return
  return workflow.compile() as any;
}

