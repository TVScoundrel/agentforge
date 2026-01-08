/**
 * Node Implementations for Multi-Agent Coordination Pattern
 *
 * This module implements the core nodes for the Multi-Agent pattern.
 *
 * @module patterns/multi-agent/nodes
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { toLangChainTools } from '@agentforge/core';
import type { MultiAgentStateType } from './state.js';
import type { SupervisorConfig, WorkerConfig, AggregatorConfig } from './types.js';
import type { AgentMessage, TaskAssignment, TaskResult } from './schemas.js';
import { getRoutingStrategy } from './routing.js';

/**
 * Default system prompt for aggregator
 */
export const DEFAULT_AGGREGATOR_SYSTEM_PROMPT = `You are an aggregator agent responsible for combining results from multiple worker agents.

Your job is to:
1. Review all completed task results
2. Synthesize the information into a coherent response
3. Ensure all aspects of the original query are addressed
4. Provide a clear, comprehensive final answer

Be concise but thorough in your aggregation.`;

/**
 * Create a supervisor node that routes tasks to workers
 */
export function createSupervisorNode(config: SupervisorConfig) {
  const {
    strategy,
    verbose = false,
    maxIterations = 10,
  } = config;

  return async (state: MultiAgentStateType): Promise<Partial<MultiAgentStateType>> => {
    try {
      if (verbose) {
        console.log(`[Supervisor] Routing iteration ${state.iteration}/${maxIterations}`);
      }

      // Check if we've exceeded max iterations
      if (state.iteration >= maxIterations) {
        if (verbose) {
          console.log('[Supervisor] Max iterations reached, moving to aggregation');
        }
        return {
          status: 'aggregating',
          currentAgent: 'aggregator',
        };
      }

      // Check if all active assignments are completed
      const allCompleted = state.activeAssignments.every(assignment => 
        state.completedTasks.some(task => task.assignmentId === assignment.id)
      );

      if (allCompleted && state.activeAssignments.length > 0) {
        if (verbose) {
          console.log('[Supervisor] All tasks completed, moving to aggregation');
        }
        return {
          status: 'aggregating',
          currentAgent: 'aggregator',
        };
      }

      // Get routing strategy and make decision
      const routingImpl = getRoutingStrategy(strategy);
      const decision = await routingImpl.route(state, config);

      if (verbose) {
        console.log(`[Supervisor] Routing to ${decision.targetAgent}: ${decision.reasoning}`);
      }

      // Create task assignment
      const assignment: TaskAssignment = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workerId: decision.targetAgent,
        task: state.messages[state.messages.length - 1]?.content || state.input,
        priority: 5,
        assignedAt: Date.now(),
      };

      // Create message to worker
      const message: AgentMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from: 'supervisor',
        to: [decision.targetAgent],
        type: 'task_assignment',
        content: assignment.task,
        timestamp: Date.now(),
        metadata: {
          assignmentId: assignment.id,
          priority: assignment.priority,
        },
      };

      return {
        currentAgent: decision.targetAgent,
        status: 'executing',
        routingHistory: [decision],
        activeAssignments: [assignment],
        messages: [message],
        iteration: state.iteration + 1,
      };
    } catch (error) {
      console.error('[Supervisor] Error:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error in supervisor',
      };
    }
  };
}

/**
 * Create a worker agent node
 */
export function createWorkerNode(config: WorkerConfig) {
  const {
    id,
    capabilities,
    model,
    tools = [],
    systemPrompt,
    verbose = false,
    executeFn,
  } = config;

  return async (state: MultiAgentStateType): Promise<Partial<MultiAgentStateType>> => {
    try {
      if (verbose) {
        console.log(`[Worker:${id}] Executing task`);
      }

      // Find the current assignment for this worker
      const currentAssignment = state.activeAssignments.find(
        assignment => assignment.workerId === id && 
        !state.completedTasks.some(task => task.assignmentId === assignment.id)
      );

      if (!currentAssignment) {
        if (verbose) {
          console.log(`[Worker:${id}] No active assignment found`);
        }
        return {
          currentAgent: 'supervisor',
          status: 'routing',
        };
      }

      // Use custom execution function if provided
      if (executeFn) {
        return await executeFn(state);
      }

      // Default execution using LLM
      if (!model) {
        throw new Error(`Worker ${id} requires either a model or custom execution function`);
      }

      const defaultSystemPrompt = `You are a specialized worker agent with the following capabilities:
Skills: ${capabilities.skills.join(', ')}
Tools: ${capabilities.tools.join(', ')}

Execute the assigned task using your skills and tools. Provide a clear, actionable result.`;

      const messages = [
        new SystemMessage(systemPrompt || defaultSystemPrompt),
        new HumanMessage(currentAssignment.task),
      ];

      // Bind tools if available
      let modelToUse: any = model;
      if (tools.length > 0 && model.bindTools) {
        const langchainTools = toLangChainTools(tools);
        modelToUse = model.bindTools(langchainTools);
      }

      const response = await modelToUse.invoke(messages);
      const result = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);

      if (verbose) {
        console.log(`[Worker:${id}] Task completed:`, result.substring(0, 100) + '...');
      }

      // Create task result
      const taskResult: TaskResult = {
        assignmentId: currentAssignment.id,
        workerId: id,
        success: true,
        result,
        completedAt: Date.now(),
        metadata: {
          skills_used: capabilities.skills,
        },
      };

      // Create completion message
      const message: AgentMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from: id,
        to: ['supervisor'],
        type: 'task_result',
        content: result,
        timestamp: Date.now(),
        metadata: {
          assignmentId: currentAssignment.id,
          success: true,
        },
      };

      // Update worker workload
      const updatedWorkers = {
        ...state.workers,
        [id]: {
          ...capabilities,
          currentWorkload: Math.max(0, capabilities.currentWorkload - 1),
        },
      };

      return {
        completedTasks: [taskResult],
        messages: [message],
        workers: updatedWorkers,
        currentAgent: 'supervisor',
        status: 'routing',
      };
    } catch (error) {
      console.error(`[Worker:${id}] Error:`, error);
      
      // Create error result
      const currentAssignment = state.activeAssignments.find(
        assignment => assignment.workerId === id
      );

      if (currentAssignment) {
        const errorResult: TaskResult = {
          assignmentId: currentAssignment.id,
          workerId: id,
          success: false,
          result: '',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: Date.now(),
        };

        return {
          completedTasks: [errorResult],
          currentAgent: 'supervisor',
          status: 'routing',
        };
      }

      return {
        status: 'failed',
        error: error instanceof Error ? error.message : `Unknown error in worker ${id}`,
      };
    }
  };
}

/**
 * Create an aggregator node that combines worker results
 */
export function createAggregatorNode(config: AggregatorConfig = {}) {
  const {
    model,
    systemPrompt = DEFAULT_AGGREGATOR_SYSTEM_PROMPT,
    aggregateFn,
    verbose = false,
  } = config;

  return async (state: MultiAgentStateType): Promise<Partial<MultiAgentStateType>> => {
    try {
      if (verbose) {
        console.log('[Aggregator] Combining results from workers');
      }

      // Use custom aggregation function if provided
      if (aggregateFn) {
        const response = await aggregateFn(state);
        return {
          response,
          status: 'completed',
        };
      }

      // Default aggregation
      if (state.completedTasks.length === 0) {
        return {
          response: 'No tasks were completed.',
          status: 'completed',
        };
      }

      // If no model, just concatenate results
      if (!model) {
        const combinedResults = state.completedTasks
          .filter(task => task.success)
          .map(task => task.result)
          .join('\n\n');

        return {
          response: combinedResults || 'No successful results to aggregate.',
          status: 'completed',
        };
      }

      // Use model to intelligently aggregate results
      const taskResults = state.completedTasks
        .map((task, idx) => {
          const status = task.success ? '✓' : '✗';
          const result = task.success ? task.result : `Error: ${task.error}`;
          return `${idx + 1}. [${status}] Worker ${task.workerId}:\n${result}`;
        })
        .join('\n\n');

      const userPrompt = `Original query: ${state.input}

Worker results:
${taskResults}

Please synthesize these results into a comprehensive response that addresses the original query.`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      const response = await model.invoke(messages);
      const aggregatedResponse = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      if (verbose) {
        console.log('[Aggregator] Aggregation complete');
      }

      return {
        response: aggregatedResponse,
        status: 'completed',
      };
    } catch (error) {
      console.error('[Aggregator] Error:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error in aggregator',
      };
    }
  };
}

