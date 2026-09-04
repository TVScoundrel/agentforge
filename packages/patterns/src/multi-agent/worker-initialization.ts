import { createPatternLogger } from '../shared/deduplication.js';
import type { WorkerCapabilities } from './schemas.js';
import type { MultiAgentStateType } from './state.js';
import { WorkerLifecycleError } from './worker-lifecycle.js';

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

export function createWorkerInitializationNode(
  topologyCapabilities: Readonly<Record<string, WorkerCapabilities>>
) {
  return async (state: MultiAgentStateType): Promise<Partial<MultiAgentStateType>> => {
    logger.info('Worker initialization started', {
      workerCount: Object.keys(topologyCapabilities).length,
      statusOverrideCount: Object.keys(state.workers).length,
    });

    const workers = initializeWorkerState(topologyCapabilities, state.workers);

    logger.info('Worker initialization complete', {
      workerCount: Object.keys(workers).length,
      workerIds: Object.keys(workers),
    });

    return { workers };
  };
}
