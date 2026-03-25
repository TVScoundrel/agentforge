import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { MultiAgentStateType } from '../state.js';
import type { WorkerConfig, WorkerExecutionConfig } from '../types.js';
import type {
  AgentMessage,
  TaskAssignment,
  TaskResult,
  WorkerCapabilities,
} from '../schemas.js';
import { isReActAgent, wrapReActAgent } from '../utils.js';
import { handleNodeError } from '../../shared/error-handling.js';
import {
  convertWorkerToolsForLangChain,
  createGeneratedId,
  createPromptMessages,
  findCurrentAssignment,
  logger,
  serializeModelContent,
} from './shared.js';

interface InvokableWorkerModel {
  invoke(messages: unknown): Promise<{ content: unknown }>;
}

function buildDefaultSystemPrompt(config: WorkerConfig): string {
  return `You are a specialized worker agent with the following capabilities:
Skills: ${config.capabilities.skills.join(', ')}
Tools: ${config.capabilities.tools.join(', ')}

Execute the assigned task using your skills and tools. Provide a clear, actionable result.`;
}

async function invokeWorkerModel(
  model: BaseChatModel,
  config: WorkerConfig,
  assignment: TaskAssignment
): Promise<TaskResultAndMessage> {
  const messages = createPromptMessages(
    config.systemPrompt || buildDefaultSystemPrompt(config),
    assignment.task
  );

  let modelToUse: InvokableWorkerModel = model;
  if (config.tools && config.tools.length > 0 && model.bindTools) {
    logger.debug('Binding tools to model', {
      workerId: config.id,
      toolCount: config.tools.length,
      toolNames: config.tools.map((tool) => tool.metadata.name),
    });
    modelToUse = model.bindTools(
      convertWorkerToolsForLangChain(config.tools)
    ) as unknown as InvokableWorkerModel;
  }

  logger.debug('Invoking LLM', { workerId: config.id });
  const response = await modelToUse.invoke(messages);
  const result = serializeModelContent(response.content);

  logger.info('Worker task completed', {
    workerId: config.id,
    assignmentId: assignment.id,
    resultLength: result.length,
  });
  logger.debug('Worker result details', {
    workerId: config.id,
    assignmentId: assignment.id,
    resultLength: result.length,
  });

  const taskResult: TaskResult = {
    assignmentId: assignment.id,
    workerId: config.id,
    success: true,
    result,
    completedAt: Date.now(),
    metadata: {
      skills_used: config.capabilities.skills,
    },
  };

  const message: AgentMessage = {
    id: createGeneratedId('msg'),
    from: config.id,
    to: ['supervisor'],
    type: 'task_result',
    content: result,
    timestamp: Date.now(),
    metadata: {
      assignmentId: assignment.id,
      success: true,
    },
  };

  return {
    completedTasks: [taskResult],
    messages: [message],
  };
}

type TaskResultAndMessage = Pick<MultiAgentStateType, 'completedTasks' | 'messages'>;

function getStateWorkerOrThrow(
  state: MultiAgentStateType,
  workerId: string
): MultiAgentStateType['workers'][string] {
  const currentWorker = state.workers[workerId];
  if (!currentWorker) {
    logger.error('Attempted to decrement workload for unknown worker', {
      workerId,
      availableWorkers: Object.keys(state.workers),
    });
    throw new Error(`Worker "${workerId}" not found when decrementing workload.`);
  }

  return currentWorker;
}

function resolvePreviousWorkload(
  workerId: string,
  currentWorker: WorkerCapabilities,
  workerFromExecution?: WorkerCapabilities
): number {
  const workloadFromWorker = workerFromExecution?.currentWorkload;
  if (typeof workloadFromWorker === 'number' && Number.isFinite(workloadFromWorker)) {
    return workloadFromWorker;
  }

  if (
    typeof currentWorker.currentWorkload === 'number' &&
    Number.isFinite(currentWorker.currentWorkload)
  ) {
    return currentWorker.currentWorkload;
  }

  logger.error('Worker workload is not a valid number; cannot decrement', {
    workerId,
    workloadFromState: currentWorker.currentWorkload,
    ...(typeof workloadFromWorker === 'number'
      ? { workloadFromWorker }
      : {}),
  });
  throw new Error(
    `Worker "${workerId}" does not have a valid numeric currentWorkload to decrement.`
  );
}

function mergeWorkersWithDecrement(
  state: MultiAgentStateType,
  workerId: string,
  executionResult: Partial<MultiAgentStateType>
): MultiAgentStateType['workers'] {
  const currentWorker = getStateWorkerOrThrow(state, workerId);
  const executionResultWorkers = executionResult.workers || {};
  const baseWorkers = {
    ...state.workers,
    ...executionResultWorkers,
  };
  const workerFromExecution = executionResultWorkers[workerId];
  const previousWorkload = resolvePreviousWorkload(
    workerId,
    currentWorker,
    workerFromExecution
  );
  const hasWorkerOverride =
    typeof workerFromExecution === 'object' && workerFromExecution !== null;
  const updatedWorker = hasWorkerOverride
    ? {
        ...currentWorker,
        ...workerFromExecution,
        currentWorkload: Math.max(0, previousWorkload - 1),
      }
    : {
        ...currentWorker,
        currentWorkload: Math.max(0, previousWorkload - 1),
      };

  const updatedWorkers = {
    ...baseWorkers,
    [workerId]: updatedWorker,
  };

  logger.debug('Worker workload decremented', {
    workerId,
    previousWorkload,
    newWorkload: updatedWorkers[workerId].currentWorkload,
    hadExecutionResultWorkers: !!executionResult.workers,
  });

  return updatedWorkers;
}

function decrementWorkerOnError(
  state: MultiAgentStateType,
  workerId: string
): MultiAgentStateType['workers'] {
  const currentWorker = getStateWorkerOrThrow(state, workerId);
  const previousWorkload = resolvePreviousWorkload(workerId, currentWorker);
  const updatedWorkers = {
    ...state.workers,
    [workerId]: {
      ...currentWorker,
      currentWorkload: Math.max(0, previousWorkload - 1),
    },
  };

  logger.debug('Worker workload decremented (error path)', {
    workerId,
    previousWorkload,
    newWorkload: updatedWorkers[workerId].currentWorkload,
  });

  return updatedWorkers;
}

function createErrorTaskResult(
  assignment: TaskAssignment,
  workerId: string,
  errorMessage: string
): TaskResult {
  logger.warn('Creating error result for assignment', {
    workerId,
    assignmentId: assignment.id,
  });

  return {
    assignmentId: assignment.id,
    workerId,
    success: false,
    result: '',
    error: errorMessage,
    completedAt: Date.now(),
  };
}

/**
 * Creates a worker node for the multi-agent workflow.
 *
 * Worker workload is framework-managed. The node decrements
 * `state.workers[workerId].currentWorkload` after either a successful execution
 * result or an error result, so custom `executeFn` implementations should not
 * adjust workloads themselves. Custom execution results are merged into the
 * returned partial state first, then the decremented worker snapshot is applied
 * on top to keep handoff and worker state updates while preserving workload
 * ownership inside the framework.
 */
export function createWorkerNode(config: WorkerConfig) {
  const { id, model, executeFn, agent } = config;

  return async (
    state: MultiAgentStateType,
    runConfig?: WorkerExecutionConfig
  ): Promise<Partial<MultiAgentStateType>> => {
    try {
      logger.info('Worker node executing', {
        workerId: id,
        iteration: state.iteration,
        activeAssignments: state.activeAssignments.length,
      });

      const currentAssignment = findCurrentAssignment(state, id);

      if (!currentAssignment) {
        logger.debug('No active assignment found for worker', {
          workerId: id,
          totalActiveAssignments: state.activeAssignments.length,
          completedTasks: state.completedTasks.length,
        });
        return {};
      }

      logger.info('Worker processing assignment', {
        workerId: id,
        assignmentId: currentAssignment.id,
        taskLength: currentAssignment.task.length,
      });
      logger.debug('Worker assignment details', {
        workerId: id,
        assignmentId: currentAssignment.id,
        taskLength: currentAssignment.task.length,
      });

      let executionResult: Partial<MultiAgentStateType>;

      if (executeFn) {
        logger.debug('Using custom execution function', { workerId: id });
        executionResult = await executeFn(state, runConfig);
      } else if (agent && isReActAgent(agent)) {
        logger.debug('Using ReAct agent', { workerId: id });
        const wrappedFn = wrapReActAgent(id, agent, config.verbose ?? false);
        executionResult = await wrappedFn(state, runConfig);
      } else if (model) {
        logger.debug('Using default LLM execution', {
          workerId: id,
          hasTools: (config.tools ?? []).length > 0,
          toolCount: (config.tools ?? []).length,
        });
        executionResult = await invokeWorkerModel(model, config, currentAssignment);
      } else {
        logger.error('Worker missing required configuration', { workerId: id });
        throw new Error(
          `Worker ${id} requires either a model, an agent, or a custom execution function. ` +
            `Provide one of: config.model, config.agent, or config.executeFn`
        );
      }

      const updatedWorkers = mergeWorkersWithDecrement(state, id, executionResult);

      return {
        ...executionResult,
        workers: updatedWorkers,
      };
    } catch (error) {
      const errorMessage = handleNodeError(error, `worker:${id}`, false);

      logger.error('Worker node error', {
        workerId: id,
        error: errorMessage,
      });

      let updatedWorkers: MultiAgentStateType['workers'];
      try {
        updatedWorkers = decrementWorkerOnError(state, id);
      } catch (workloadError) {
        const workloadErrorMessage =
          workloadError instanceof Error ? workloadError.message : String(workloadError);
        logger.error('Worker error handling failed', {
          workerId: id,
          error: workloadErrorMessage,
        });
        return {
          status: 'failed',
          error: `${errorMessage}. ${workloadErrorMessage}`,
        };
      }
      const currentAssignment = state.activeAssignments.find(
        (assignment) => assignment.workerId === id
      );

      if (currentAssignment) {
        return {
          completedTasks: [createErrorTaskResult(currentAssignment, id, errorMessage)],
          currentAgent: 'supervisor',
          status: 'routing',
          workers: updatedWorkers,
        };
      }

      logger.error('No assignment found for error handling', { workerId: id });

      return {
        status: 'failed',
        error: errorMessage,
        workers: updatedWorkers,
      };
    }
  };
}
