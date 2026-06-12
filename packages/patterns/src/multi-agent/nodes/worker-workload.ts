import type { MultiAgentStateType } from '../state.js';
import type { TaskAssignment, TaskResult, WorkerCapabilities } from '../schemas.js';
import { logger } from './shared.js';

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
    ...(typeof workloadFromWorker === 'number' ? { workloadFromWorker } : {}),
  });
  throw new Error(
    `Worker "${workerId}" does not have a valid numeric currentWorkload to decrement.`
  );
}

export function mergeWorkersWithDecrement(
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

export function decrementWorkerOnError(
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

export function createErrorTaskResult(
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
