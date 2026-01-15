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
 * - Invoking the ReAct agent
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
 * const result = await executeFn(state);
 * ```
 */
export function wrapReActAgent(
  workerId: string,
  agent: CompiledStateGraph<any, any>,
  verbose = false
): (state: MultiAgentStateType) => Promise<Partial<MultiAgentStateType>> {
  return async (state: MultiAgentStateType): Promise<Partial<MultiAgentStateType>> => {
    try {
      if (verbose) {
        console.log(`[ReActWrapper:${workerId}] Wrapping ReAct agent execution`);
      }

      // Extract task from Multi-Agent state
      const task = state.messages[state.messages.length - 1]?.content || state.input;

      if (verbose) {
        console.log(`[ReActWrapper:${workerId}] Task:`, task.substring(0, 100) + '...');
      }

      // Find current assignment for this worker
      const currentAssignment = state.activeAssignments.find(
        assignment =>
          assignment.workerId === workerId &&
          !state.completedTasks.some(task => task.assignmentId === assignment.id)
      );

      if (!currentAssignment) {
        if (verbose) {
          console.log(`[ReActWrapper:${workerId}] No active assignment found`);
        }
        return {
          currentAgent: 'supervisor',
          status: 'routing',
        };
      }

      // Invoke ReAct agent with LangGraph-style input
      const result: any = await agent.invoke({
        messages: [{ role: 'user', content: task }],
      });

      // Extract response from ReAct agent's messages
      const response = result.messages?.[result.messages.length - 1]?.content || 'No response';

      if (verbose) {
        console.log(`[ReActWrapper:${workerId}] Response:`, response.substring(0, 100) + '...');
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
        },
      };

      // Return in Multi-Agent state format
      return {
        completedTasks: [taskResult],
        currentAgent: 'supervisor',
        status: 'routing',
      };
    } catch (error) {
      console.error(`[ReActWrapper:${workerId}] Error:`, error);

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
          error: error instanceof Error ? error.message : 'Unknown error in ReAct agent',
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
        error: error instanceof Error ? error.message : `Unknown error in ReAct wrapper for ${workerId}`,
      };
    }
  };
}

