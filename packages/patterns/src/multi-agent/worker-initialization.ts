import { createPatternLogger } from '../shared/deduplication.js';
import type { WorkerCapabilities } from './schemas.js';
import type { MultiAgentStateType } from './state.js';
import { WorkerLifecycleError, type WorkerLifecycle } from './worker-lifecycle.js';

const logger = createPatternLogger('agentforge:patterns:multi-agent:worker-initialization');

type WorkerStatusInput = Pick<WorkerCapabilities, 'available' | 'currentWorkload'>;

export function initializeWorkerState(
  topologyCapabilities: Readonly<Record<string, WorkerCapabilities>>,
  invocationWorkers: Readonly<Record<string, WorkerCapabilities>>
): MultiAgentStateType['workers'] {
  for (const workerId of Object.keys(invocationWorkers)) {
    if (!Object.hasOwn(topologyCapabilities, workerId)) {
      throw new WorkerLifecycleError(
        'unknown-worker',
        `Invocation state contains unknown Worker "${workerId}".`
      );
    }
  }

  return Object.fromEntries(
    Object.entries(topologyCapabilities).map(([workerId, capabilities]) => {
      const status: WorkerStatusInput = Object.hasOwn(invocationWorkers, workerId)
        ? invocationWorkers[workerId]!
        : capabilities;

      return [
        workerId,
        {
          skills: [...capabilities.skills],
          tools: [...capabilities.tools],
          available: status.available,
          currentWorkload: status.currentWorkload,
        },
      ];
    })
  );
}

export function createWorkerInitializationNode(lifecycle: WorkerLifecycle) {
  return async (state: MultiAgentStateType): Promise<Partial<MultiAgentStateType>> => {
    const topologyWorkerIds = lifecycle.topology.map((worker) => worker.id);

    logger.info('Worker initialization started', {
      workerCount: topologyWorkerIds.length,
      statusOverrideCount: Object.keys(state.workers).length,
    });

    let workers: MultiAgentStateType['workers'];
    try {
      workers = lifecycle.captureSnapshot(state.workers);
    } catch (error) {
      logger.error('Worker initialization failed', {
        error: error instanceof Error ? error.message : String(error),
        invocationWorkerIds: Object.keys(state.workers),
        topologyWorkerIds,
      });
      throw error;
    }

    logger.info('Worker initialization complete', {
      workerCount: Object.keys(workers).length,
      workerIds: Object.keys(workers),
    });

    return { workers };
  };
}
