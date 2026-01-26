/**
 * Utility functions for Multi-Agent Coordination Pattern
 *
 * This module provides helper functions for working with the Multi-Agent pattern,
 * including ReAct agent detection and wrapping.
 *
 * @module patterns/multi-agent/utils
 */

import type { CompiledStateGraph } from '@langchain/langgraph';
import type { MultiAgentStateType } from './state.js';
import type { TaskResult } from './schemas.js';
import { createLogger, LogLevel } from '@agentforge/core';
import { handleNodeError } from '../shared/error-handling.js';

// Create logger for multi-agent utils
// Log level can be controlled via LOG_LEVEL environment variable
const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || LogLevel.INFO;
const logger = createLogger('multi-agent', { level: logLevel });

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
export function isReActAgent(obj: any): obj is CompiledStateGraph<any, any> {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.invoke === 'function' &&
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
  agent: CompiledStateGraph<any, any>,
  verbose = false
): (state: MultiAgentStateType, config?: any) => Promise<Partial<MultiAgentStateType>> {
  return async (state: MultiAgentStateType, config?: any): Promise<Partial<MultiAgentStateType>> => {
    try {
      logger.debug('Wrapping ReAct agent execution', { workerId });

      // Extract task from Multi-Agent state
      const task = state.messages[state.messages.length - 1]?.content || state.input;

      logger.debug('Extracted task', {
        workerId,
        taskPreview: task.substring(0, 100) + (task.length > 100 ? '...' : '')
      });

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

      // Invoke ReAct agent with LangGraph-style input and config
      // The config contains thread_id for checkpointing, which is required for interrupts
      const result: any = await agent.invoke(
        {
          messages: [{ role: 'user', content: task }],
        },
        config  // Pass through the config for checkpointing and interrupt support
      );

      // Extract response from ReAct agent's messages
      const response = result.messages?.[result.messages.length - 1]?.content || 'No response';

      logger.debug('Received response from ReAct agent', {
        workerId,
        responsePreview: response.substring(0, 100) + (response.length > 100 ? '...' : '')
      });

      // Extract tools used from ReAct agent's actions
      const toolsUsed = result.actions?.map((action: any) => action.name).filter(Boolean) || [];
      const uniqueTools = [...new Set(toolsUsed)]; // Remove duplicates

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
          iterations: result.iteration || 0,
          tools_used: uniqueTools,
        },
      };

      // Return in Multi-Agent state format
      return {
        completedTasks: [taskResult],
      };
    } catch (error: any) {
      // Handle error with proper GraphInterrupt detection
      const errorMessage = handleNodeError(error, `react-agent:${workerId}`, false);

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

