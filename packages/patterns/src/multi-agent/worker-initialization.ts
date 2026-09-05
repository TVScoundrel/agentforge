import { createPatternLogger } from '../shared/deduplication.js';
import type { MultiAgentStateType } from './state.js';
import type { WorkerLifecycle } from './worker-lifecycle.js';

const logger = createPatternLogger('agentforge:patterns:multi-agent:worker-initialization');

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
