/**
 * Node Implementations for Multi-Agent Coordination Pattern
 *
 * This module implements the core nodes for the Multi-Agent pattern.
 *
 * @module patterns/multi-agent/nodes
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { toLangChainTools, createLogger, LogLevel } from '@agentforge/core';
import type { MultiAgentStateType } from './state.js';
import type { SupervisorConfig, WorkerConfig, AggregatorConfig } from './types.js';
import type { AgentMessage, TaskAssignment, TaskResult } from './schemas.js';
import { getRoutingStrategy } from './routing.js';
import { isReActAgent, wrapReActAgent } from './utils.js';
import { handleNodeError } from '../shared/error-handling.js';

// Create logger for nodes
const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || LogLevel.INFO;
const logger = createLogger('multi-agent:nodes', { level: logLevel });

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
      logger.info('Supervisor node executing', {
        iteration: state.iteration,
        maxIterations,
        activeAssignments: state.activeAssignments.length,
        completedTasks: state.completedTasks.length
      });

      logger.debug(`Routing iteration ${state.iteration}/${maxIterations}`);

      // Check if we've exceeded max iterations
      if (state.iteration >= maxIterations) {
        logger.warn('Max iterations reached', {
          iteration: state.iteration,
          maxIterations
        });

        logger.debug('Max iterations reached, moving to aggregation');
        return {
          status: 'aggregating',
          currentAgent: 'aggregator',
        };
      }

      // Check if all active assignments are completed
      const allCompleted = state.activeAssignments.every(assignment =>
        state.completedTasks.some(task => task.assignmentId === assignment.id)
      );

      logger.debug('Checking task completion', {
        activeAssignments: state.activeAssignments.length,
        completedTasks: state.completedTasks.length,
        allCompleted
      });

      if (allCompleted && state.activeAssignments.length > 0) {
        logger.info('All tasks completed, moving to aggregation', {
          completedCount: state.completedTasks.length
        });

        logger.debug('All tasks completed, moving to aggregation');
        return {
          status: 'aggregating',
          currentAgent: 'aggregator',
        };
      }

      // Get routing strategy and make decision
      logger.debug('Getting routing strategy', { strategy });
      const routingImpl = getRoutingStrategy(strategy);
      const decision = await routingImpl.route(state, config);

      // Determine target agents (support both single and parallel routing)
      const targetAgents = decision.targetAgents && decision.targetAgents.length > 0
        ? decision.targetAgents
        : decision.targetAgent
          ? [decision.targetAgent]
          : [];

      logger.debug('Target agents determined', {
        targetAgents,
        isParallel: targetAgents.length > 1,
        decision: {
          reasoning: decision.reasoning,
          confidence: decision.confidence
        }
      });

      if (targetAgents.length === 0) {
        logger.error('No target agents specified in routing decision');
        throw new Error('Routing decision must specify at least one target agent');
      }

      if (targetAgents.length === 1) {
        logger.info('Routing to single agent', {
          targetAgent: targetAgents[0],
          reasoning: decision.reasoning,
          confidence: decision.confidence
        });
      } else {
        logger.info('Routing to multiple agents in parallel', {
          targetAgents,
          count: targetAgents.length,
          reasoning: decision.reasoning,
          confidence: decision.confidence
        });
      }

      if (targetAgents.length === 1) {
        logger.debug(`Routing to ${targetAgents[0]}: ${decision.reasoning}`);
      } else {
        logger.debug(`Routing to ${targetAgents.length} agents in parallel [${targetAgents.join(', ')}]: ${decision.reasoning}`);
      }

      // Create task assignments for all target agents (parallel execution)
      const task = state.messages[state.messages.length - 1]?.content || state.input;
      const assignments: TaskAssignment[] = targetAgents.map(workerId => ({
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workerId,
        task,
        priority: 5,
        assignedAt: Date.now(),
      }));

      logger.debug('Created task assignments', {
        assignmentCount: assignments.length,
        assignments: assignments.map(a => ({
          id: a.id,
          workerId: a.workerId,
          taskLength: a.task.length
        }))
      });

      // Create messages to workers
      const messages: AgentMessage[] = assignments.map(assignment => ({
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from: 'supervisor',
        to: [assignment.workerId],
        type: 'task_assignment',
        content: assignment.task,
        timestamp: Date.now(),
        metadata: {
          assignmentId: assignment.id,
          priority: assignment.priority,
        },
      }));

      // Increment workload for all assigned workers
      const updatedWorkers = { ...state.workers };
      for (const assignment of assignments) {
        const worker = updatedWorkers[assignment.workerId];
        if (!worker) {
          // CRITICAL: Don't silently skip - this indicates a configuration error
          logger.error('Worker not found in state', {
            workerId: assignment.workerId,
            availableWorkers: Object.keys(updatedWorkers)
          });
          throw new Error(
            `Worker ${assignment.workerId} not found in state.workers. ` +
            `Available workers: ${Object.keys(updatedWorkers).join(', ')}`
          );
        }
        updatedWorkers[assignment.workerId] = {
          ...worker,
          currentWorkload: worker.currentWorkload + 1,
        };
      }

      logger.info('Supervisor routing complete', {
        currentAgent: targetAgents.join(','),
        status: 'executing',
        assignmentCount: assignments.length,
        nextIteration: state.iteration + 1,
        workloadUpdates: Object.entries(updatedWorkers)
          .filter(([id]) => targetAgents.includes(id))
          .map(([id, caps]) => ({ workerId: id, newWorkload: caps.currentWorkload }))
      });

      return {
        currentAgent: targetAgents.join(','), // Store all agents (for backward compat)
        status: 'executing',
        routingHistory: [decision],
        activeAssignments: assignments, // Multiple assignments for parallel execution!
        messages,
        workers: updatedWorkers, // Include updated workload
        // Add 1 to iteration counter (uses additive reducer)
        iteration: 1,
      };
    } catch (error) {
      logger.error('Supervisor node error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        iteration: state.iteration
      });
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
    agent,
  } = config;

  return async (state: MultiAgentStateType, runConfig?: any): Promise<Partial<MultiAgentStateType>> => {
    try {
      logger.info('Worker node executing', {
        workerId: id,
        iteration: state.iteration,
        activeAssignments: state.activeAssignments.length
      });

      // Find the current assignment for this worker
      const currentAssignment = state.activeAssignments.find(
        assignment => assignment.workerId === id &&
        !state.completedTasks.some(task => task.assignmentId === assignment.id)
      );

      if (!currentAssignment) {
        logger.debug('No active assignment found for worker', {
          workerId: id,
          totalActiveAssignments: state.activeAssignments.length,
          completedTasks: state.completedTasks.length
        });
        return {};
      }

      logger.info('Worker processing assignment', {
        workerId: id,
        assignmentId: currentAssignment.id,
        taskLength: currentAssignment.task.length,
        taskPreview: currentAssignment.task.substring(0, 100)
      });

      // Helper function for default LLM execution
      async function executeWithLLM(): Promise<Partial<MultiAgentStateType>> {
        logger.debug('Using default LLM execution', {
          workerId: id,
          hasTools: tools.length > 0,
          toolCount: tools.length
        });

        const defaultSystemPrompt = `You are a specialized worker agent with the following capabilities:
Skills: ${capabilities.skills.join(', ')}
Tools: ${capabilities.tools.join(', ')}

Execute the assigned task using your skills and tools. Provide a clear, actionable result.`;

        const messages = [
          new SystemMessage(systemPrompt || defaultSystemPrompt),
          new HumanMessage(currentAssignment!.task),
        ];

        // Bind tools if available
        let modelToUse: any = model;
        if (tools.length > 0 && model!.bindTools) {
          logger.debug('Binding tools to model', {
            workerId: id,
            toolCount: tools.length,
            toolNames: tools.map(t => t.metadata.name)
          });
          const langchainTools = toLangChainTools(tools);
          modelToUse = model!.bindTools(langchainTools);
        }

        logger.debug('Invoking LLM', { workerId: id });
        const response = await modelToUse.invoke(messages);
        const result = typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);

        logger.info('Worker task completed', {
          workerId: id,
          assignmentId: currentAssignment!.id,
          resultLength: result.length,
          resultPreview: result.substring(0, 100)
        });

        // Create task result
        const taskResult: TaskResult = {
          assignmentId: currentAssignment!.id,
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
            assignmentId: currentAssignment!.id,
            success: true,
          },
        };

        return {
          completedTasks: [taskResult],
          messages: [message],
        };
      }

      // Execute the task using one of the available methods
      let executionResult: Partial<MultiAgentStateType>;

      // Priority 1: Use custom execution function if provided
      if (executeFn) {
        logger.debug('Using custom execution function', { workerId: id });
        executionResult = await executeFn(state, runConfig);
      }
      // Priority 2: Use ReAct agent if provided
      else if (agent && isReActAgent(agent)) {
        logger.debug('Using ReAct agent', { workerId: id });
        const wrappedFn = wrapReActAgent(id, agent, verbose);
        executionResult = await wrappedFn(state, runConfig);
      }
      // Priority 3: Default execution using LLM
      else if (model) {
        executionResult = await executeWithLLM();
      } else {
        logger.error('Worker missing required configuration', { workerId: id });
        throw new Error(
          `Worker ${id} requires either a model, an agent, or a custom execution function. ` +
          `Provide one of: config.model, config.agent, or config.executeFn`
        );
      }

      // Update worker workload - read from state, not config
      // CRITICAL: This happens AFTER execution for ALL paths (custom, ReAct, or LLM)
      // This ensures workload is decremented on both success and failure
      const currentWorker = state.workers[id];

      // CRITICAL: Merge with any worker updates from executionResult
      // Custom executeFn or ReAct agents may return worker updates that must be preserved
      const baseWorkers = executionResult.workers || state.workers;
      const workerToUpdate = baseWorkers[id] || currentWorker;

      const updatedWorkers = {
        ...baseWorkers,
        [id]: {
          ...workerToUpdate,
          currentWorkload: Math.max(0, workerToUpdate.currentWorkload - 1),
        },
      };

      logger.debug('Worker workload decremented', {
        workerId: id,
        previousWorkload: workerToUpdate.currentWorkload,
        newWorkload: updatedWorkers[id].currentWorkload,
        hadExecutionResultWorkers: !!executionResult.workers
      });

      // Merge workload update with execution result
      return {
        ...executionResult,
        workers: updatedWorkers,
      };
    } catch (error) {
      // Handle error with proper GraphInterrupt detection
      const errorMessage = handleNodeError(error, `worker:${id}`, false);

      logger.error('Worker node error', {
        workerId: id,
        error: errorMessage
      });

      // CRITICAL: Decrement workload on error too
      const currentWorker = state.workers[id];
      const updatedWorkers = {
        ...state.workers,
        [id]: {
          ...currentWorker,
          currentWorkload: Math.max(0, currentWorker.currentWorkload - 1),
        },
      };

      logger.debug('Worker workload decremented (error path)', {
        workerId: id,
        previousWorkload: currentWorker.currentWorkload,
        newWorkload: updatedWorkers[id].currentWorkload
      });

      // Create error result
      const currentAssignment = state.activeAssignments.find(
        assignment => assignment.workerId === id
      );

      if (currentAssignment) {
        logger.warn('Creating error result for assignment', {
          workerId: id,
          assignmentId: currentAssignment.id
        });

        const errorResult: TaskResult = {
          assignmentId: currentAssignment.id,
          workerId: id,
          success: false,
          result: '',
          error: errorMessage,
          completedAt: Date.now(),
        };

        return {
          completedTasks: [errorResult],
          currentAgent: 'supervisor',
          status: 'routing',
          workers: updatedWorkers, // Include workload update
        };
      }

      logger.error('No assignment found for error handling', { workerId: id });

      return {
        status: 'failed',
        error: errorMessage,
        workers: updatedWorkers, // Include workload update even on failure
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
      logger.info('Aggregator node executing', {
        completedTasks: state.completedTasks.length,
        successfulTasks: state.completedTasks.filter(t => t.success).length,
        failedTasks: state.completedTasks.filter(t => !t.success).length
      });

      logger.debug('Combining results from workers');

      // Use custom aggregation function if provided
      if (aggregateFn) {
        logger.debug('Using custom aggregation function');
        const response = await aggregateFn(state);
        logger.info('Custom aggregation complete', {
          responseLength: response.length
        });
        return {
          response,
          status: 'completed',
        };
      }

      // Default aggregation
      if (state.completedTasks.length === 0) {
        logger.warn('No completed tasks to aggregate');
        return {
          response: 'No tasks were completed.',
          status: 'completed',
        };
      }

      // If no model, just concatenate results
      if (!model) {
        logger.debug('No model provided, concatenating results');
        const combinedResults = state.completedTasks
          .filter(task => task.success)
          .map(task => task.result)
          .join('\n\n');

        logger.info('Simple concatenation complete', {
          resultLength: combinedResults.length
        });

        return {
          response: combinedResults || 'No successful results to aggregate.',
          status: 'completed',
        };
      }

      // Use model to intelligently aggregate results
      logger.debug('Using LLM for intelligent aggregation', {
        taskCount: state.completedTasks.length
      });

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

      logger.debug('Invoking aggregation LLM');
      const response = await model.invoke(messages);
      const aggregatedResponse = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      logger.info('Aggregation complete', {
        responseLength: aggregatedResponse.length,
        responsePreview: aggregatedResponse.substring(0, 100)
      });

      logger.debug('Aggregation complete');

      return {
        response: aggregatedResponse,
        status: 'completed',
      };
    } catch (error) {
      logger.error('Aggregator node error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        completedTasks: state.completedTasks.length
      });
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error in aggregator',
      };
    }
  };
}

