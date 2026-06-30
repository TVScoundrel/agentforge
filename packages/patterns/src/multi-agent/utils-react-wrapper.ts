import type { RunnableConfig } from '@langchain/core/runnables';
import type { MultiAgentStateType } from './state.js';
import type { TaskResult } from './schemas.js';
import type { WorkerExecutionConfig } from './types.js';
import { createPatternLogger } from '../shared/deduplication.js';
import { handleNodeError } from '../shared/error-handling.js';
import {
  getReActResultShape,
  toRunnableConfig,
  type ReActAgentGraph,
} from './utils-shared.js';
import {
  extractIteration,
  extractResponse,
  extractToolsUsed,
} from './utils-react-result.js';

const logger = createPatternLogger('agentforge:patterns:multi-agent:utils');

function findCurrentAssignment(
  state: MultiAgentStateType,
  workerId: string
) {
  return state.activeAssignments.find(
    (assignment) =>
      assignment.workerId === workerId &&
      !state.completedTasks.some((task) => task.assignmentId === assignment.id)
  );
}

function buildWorkerConfig(
  workerId: string,
  runnableConfig: RunnableConfig | undefined
): RunnableConfig | undefined {
  const parentThreadId = runnableConfig?.configurable?.thread_id;
  const workerThreadId =
    parentThreadId !== undefined ? `${parentThreadId}:worker:${workerId}` : undefined;

  if (!workerThreadId) {
    return runnableConfig;
  }

  return {
    ...runnableConfig,
    configurable: {
      ...(runnableConfig?.configurable ?? {}),
      thread_id: workerThreadId,
    },
  };
}

function createSuccessfulTaskResult(
  assignmentId: string,
  workerId: string,
  response: string,
  toolsUsed: string[],
  iteration: number
): TaskResult {
  return {
    assignmentId,
    workerId,
    result: response,
    completedAt: Date.now(),
    success: true,
    metadata: {
      agent_type: 'react',
      iterations: iteration,
      tools_used: toolsUsed,
    },
  };
}

/**
 * Wrap a ReAct agent to work as a Multi-Agent worker.
 */
export function wrapReActAgent(
  workerId: string,
  agent: ReActAgentGraph,
  verbose = false
): (
  state: MultiAgentStateType,
  config?: WorkerExecutionConfig
) => Promise<Partial<MultiAgentStateType>> {
  return async (
    state: MultiAgentStateType,
    config?: WorkerExecutionConfig
  ): Promise<Partial<MultiAgentStateType>> => {
    try {
      logger.debug('Wrapping ReAct agent execution', { workerId });
      const runnableConfig = toRunnableConfig(config);
      const currentAssignment = findCurrentAssignment(state, workerId);

      if (!currentAssignment) {
        logger.debug('No active assignment found', { workerId });
        return {};
      }

      const task = currentAssignment.task;
      logger.debug('Extracted task from assignment', {
        workerId,
        assignmentId: currentAssignment.id,
        taskPreview: task.substring(0, 100) + (task.length > 100 ? '...' : ''),
      });

      const workerConfig = buildWorkerConfig(workerId, runnableConfig);
      const workerThreadId = workerConfig?.configurable?.thread_id;

      logger.debug('Invoking ReAct agent with worker-specific config', {
        workerId,
        ...(runnableConfig?.configurable?.thread_id !== undefined
          ? { parentThreadId: String(runnableConfig.configurable.thread_id) }
          : {}),
        ...(workerThreadId ? { workerThreadId: String(workerThreadId) } : {}),
        hasConfig: !!workerConfig,
      });

      const result = await agent.invoke(
        { messages: [{ role: 'user', content: task }] },
        workerConfig
      );
      const resultShape = getReActResultShape(result);
      const response = extractResponse(resultShape);

      logger.debug('Received response from ReAct agent', {
        workerId,
        responsePreview: response.substring(0, 100) + (response.length > 100 ? '...' : ''),
      });

      const uniqueTools = extractToolsUsed(resultShape);
      if (uniqueTools.length > 0) {
        logger.debug('Tools used by ReAct agent', { workerId, tools: uniqueTools });
      }

      return {
        completedTasks: [
          createSuccessfulTaskResult(
            currentAssignment.id,
            workerId,
            response,
            uniqueTools,
            extractIteration(resultShape)
          ),
        ],
      };
    } catch (error: unknown) {
      const errorMessage = handleNodeError(error, `react-agent:${workerId}`, verbose);

      logger.error('Error in ReAct agent execution', {
        workerId,
        error: errorMessage,
      });

      const currentAssignment = findCurrentAssignment(state, workerId);

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
