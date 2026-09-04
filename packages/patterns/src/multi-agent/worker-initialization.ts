import type { WorkerCapabilities } from './schemas.js';
import type { MultiAgentStateType } from './state.js';
import { WorkerLifecycleError } from './worker-lifecycle.js';

type WorkerStatusInput = Pick<WorkerCapabilities, 'available' | 'currentWorkload'>;

export function initializeWorkerState(
  topologyCapabilities: Readonly<Record<string, WorkerCapabilities>>,
  invocationWorkers: Readonly<Record<string, WorkerCapabilities>>
): MultiAgentStateType['workers'] {
  for (const workerId of Object.keys(invocationWorkers)) {
    if (!topologyCapabilities[workerId]) {
      throw new WorkerLifecycleError(
        'unknown-worker',
        `Invocation state contains unknown Worker "${workerId}".`
      );
    }
  }

  return Object.fromEntries(
    Object.entries(topologyCapabilities).map(([workerId, capabilities]) => {
      const status: WorkerStatusInput = invocationWorkers[workerId] ?? capabilities;

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
  return async (state: MultiAgentStateType): Promise<Partial<MultiAgentStateType>> => ({
    workers: initializeWorkerState(topologyCapabilities, state.workers),
  });
}
