/**
 * Utility functions for Multi-Agent Coordination Pattern
 *
 * This module provides helper functions for working with the Multi-Agent pattern,
 * including ReAct agent detection and wrapping.
 *
 * @module patterns/multi-agent/utils
 */

import type { CompiledStateGraph } from '@langchain/langgraph';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { MultiAgentStateType } from './state.js';
import type { TaskResult } from './schemas.js';
import type { WorkerExecutionConfig } from './types.js';
import { createLogger, LogLevel } from '@agentforge/core';
import { handleNodeError } from '../shared/error-handling.js';

// Create logger for multi-agent utils
// Log level can be controlled via LOG_LEVEL environment variable
const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || LogLevel.INFO;
const logger = createLogger('agentforge:patterns:multi-agent:utils', { level: logLevel });

type ReActAgentGraph = CompiledStateGraph<string, unknown>;

interface ReActAction {
  name?: unknown;
}

interface ReActResultShape {
  messages?: Array<{ content?: unknown }>;
  actions?: ReActAction[];
  iteration?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toRunnableConfig(config: WorkerExecutionConfig | undefined): RunnableConfig | undefined {
  if (!isRecord(config)) {
    return undefined;
  }
  return config as RunnableConfig;
}

function getReActResultShape(value: unknown): ReActResultShape {
  if (!isRecord(value)) {
    return {};
  }

  const messages = Array.isArray(value.messages)
    ? value.messages.filter((message): message is { content?: unknown } => isRecord(message))
    : undefined;

  const actions = Array.isArray(value.actions)
    ? value.actions.filter((action): action is ReActAction => isRecord(action))
    : undefined;

  return {
    messages,
    actions,
    iteration: value.iteration,
  };
}

function extractResponse(resultShape: ReActResultShape): string {
  const { messages } = resultShape;
  const lastMessage = messages?.[messages.length - 1];
  return typeof lastMessage?.content === 'string' ? lastMessage.content : 'No response';
}

function extractToolsUsed(resultShape: ReActResultShape): string[] {
  const { actions } = resultShape;
  const names = actions
    ?.map((action) => action.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0) || [];
  return [...new Set(names)];
}

function extractIteration(resultShape: ReActResultShape): number {
  const { iteration } = resultShape;
  return typeof iteration === 'number' ? iteration : 0;
}

/**
 * Check if an object is a ReAct agent (CompiledStateGraph)
 *
 * This function detects whether an object is a compiled LangGraph StateGraph
 * (such as those created by `createReActAgent()`).
 *
 * @param obj - Object to check
 * @returns True if the object appears to be a ReAct agent
 *
 * @example
 * ```typescript
 * const agent = createReActAgent({ model, tools });
 * console.log(isReActAgent(agent)); // true
 * console.log(isReActAgent({})); // false
 * ```
 */
export function isReActAgent(obj: unknown): obj is ReActAgentGraph {
  return Boolean(
    obj &&
    typeof obj === 'object' &&
    'invoke' in obj &&
    typeof obj.invoke === 'function' &&
    'stream' in obj &&
    typeof obj.stream === 'function' &&
    // Additional check to ensure it's not just any object with invoke/stream
    (obj.constructor?.name === 'CompiledGraph' || obj.constructor?.name === 'CompiledStateGraph')
  );
}

/**
 * Wrap a ReAct agent to work as a Multi-Agent worker
 *
 * This function creates an execution function that adapts a ReAct agent's
 * interface to work within the Multi-Agent pattern. It handles:
 * - Extracting the task from Multi-Agent state
 * - Converting to ReAct agent's expected input format
 * - Invoking the ReAct agent with proper config (for checkpointing/interrupts)
 * - Extracting the response from the agent's output
 * - Converting back to Multi-Agent state format
 *
 * @param workerId - Unique identifier for this worker
 * @param agent - ReAct agent (CompiledStateGraph) to wrap
 * @param verbose - Whether to log verbose output
 * @returns Execution function compatible with Multi-Agent pattern
 *
 * @example
 * ```typescript
 * const hrAgent = createReActAgent({ model, tools });
 * const executeFn = wrapReActAgent('hr', hrAgent);
 *
 * // Now executeFn can be used in Multi-Agent pattern
 * const result = await executeFn(state, config);
 * ```
 */
export function wrapReActAgent(
  workerId: string,
  agent: ReActAgentGraph,
  verbose = false
): (state: MultiAgentStateType, config?: WorkerExecutionConfig) => Promise<Partial<MultiAgentStateType>> {
  return async (
    state: MultiAgentStateType,
    config?: WorkerExecutionConfig
  ): Promise<Partial<MultiAgentStateType>> => {
    try {
      logger.debug('Wrapping ReAct agent execution', { workerId });
      const runnableConfig = toRunnableConfig(config);

      // Find current assignment for this worker
      const currentAssignment = state.activeAssignments.find(
        assignment =>
          assignment.workerId === workerId &&
          !state.completedTasks.some(task => task.assignmentId === assignment.id)
      );

      if (!currentAssignment) {
        logger.debug('No active assignment found', { workerId });
        return {};
      }

      // Extract task from the worker's current assignment
      // IMPORTANT: Use currentAssignment.task instead of state.messages to avoid
      // routing the wrong task in parallel or multi-step execution scenarios
      const task = currentAssignment.task;

      logger.debug('Extracted task from assignment', {
        workerId,
        assignmentId: currentAssignment.id,
        taskPreview: task.substring(0, 100) + (task.length > 100 ? '...' : '')
      });

      // Generate worker-specific thread_id for separate checkpoint namespace
      // This allows the worker's ReAct agent to have its own checkpoint that can be resumed independently
      // Format: {parent_thread_id}:worker:{workerId}
      const workerThreadId = runnableConfig?.configurable?.thread_id
        ? `${runnableConfig.configurable.thread_id}:worker:${workerId}`
        : undefined;

      const workerConfig: RunnableConfig | undefined = workerThreadId
        ? {
          ...runnableConfig,
          configurable: {
            ...(runnableConfig?.configurable ?? {}),
            thread_id: workerThreadId
          }
        }
        : runnableConfig;

      logger.debug('Invoking ReAct agent with worker-specific config', {
        workerId,
        parentThreadId: runnableConfig?.configurable?.thread_id,
        workerThreadId,
        hasConfig: !!workerConfig
      });

      // Invoke ReAct agent with worker-specific config for separate checkpoint namespace
      // This ensures that when the worker's ReAct agent calls interrupt(), the checkpoint
      // is saved in a separate namespace and can be resumed independently
      const result = await agent.invoke(
        {
          messages: [{ role: 'user', content: task }],
        },
        workerConfig  // Worker-specific config with unique thread_id
      );
      const resultShape = getReActResultShape(result);

      // Extract response from ReAct agent's messages
      const response = extractResponse(resultShape);

      logger.debug('Received response from ReAct agent', {
        workerId,
        responsePreview: response.substring(0, 100) + (response.length > 100 ? '...' : '')
      });

      // Extract tools used from ReAct agent's actions
      const uniqueTools = extractToolsUsed(resultShape);

      if (uniqueTools.length > 0) {
        logger.debug('Tools used by ReAct agent', { workerId, tools: uniqueTools });
      }

      // Create task result in Multi-Agent format
      const taskResult: TaskResult = {
        assignmentId: currentAssignment.id,
        workerId,
        result: response,
        completedAt: Date.now(),
        success: true,
        metadata: {
          agent_type: 'react',
          iterations: extractIteration(resultShape),
          tools_used: uniqueTools,
        },
      };

      // Return in Multi-Agent state format
      return {
        completedTasks: [taskResult],
      };
    } catch (error: unknown) {
      // Handle error with proper GraphInterrupt detection
      const errorMessage = handleNodeError(error, `react-agent:${workerId}`, verbose);

      logger.error('Error in ReAct agent execution', {
        workerId,
        error: errorMessage
      });

      // Find current assignment for error reporting
      const currentAssignment = state.activeAssignments.find(
        assignment => assignment.workerId === workerId
      );

      if (currentAssignment) {
        const errorResult: TaskResult = {
          assignmentId: currentAssignment.id,
          workerId,
          success: false,
          result: '',
          error: errorMessage,
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
        error: errorMessage,
      };
    }
  };
}
