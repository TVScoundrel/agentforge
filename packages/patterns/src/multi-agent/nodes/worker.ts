import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { MultiAgentStateType } from '../state.js';
import type { WorkerConfig, WorkerExecutionConfig } from '../types.js';
import { isReActAgent, wrapReActAgent } from '../utils.js';
import { handleNodeError } from '../../shared/error-handling.js';
import {
  findCurrentAssignment,
  logger,
} from './shared.js';
import { invokeWorkerModel } from './worker-model.js';
import {
  createErrorTaskResult,
  decrementWorkerOnError,
  mergeWorkersWithDecrement,
} from './worker-workload.js';

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
  const { id, executeFn, agent } = config;
  const model = config.model as BaseChatModel | undefined;

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
