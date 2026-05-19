import type { RoutingDecision } from '../schemas.js';
import type { MultiAgentStateType } from '../state.js';
import type { RoutingStrategyImpl, SupervisorConfig } from '../types.js';

type AvailableWorkerLoad = {
  id: string;
  workload: number;
};

function getAvailableWorkerLoads(state: MultiAgentStateType): AvailableWorkerLoad[] {
  return Object.entries(state.workers)
    .filter(([_, caps]) => caps.available)
    .map(([id, caps]) => ({ id, workload: caps.currentWorkload }))
    .sort((a, b) => a.workload - b.workload);
}

export const loadBalancedRouting: RoutingStrategyImpl = {
  name: 'load-balanced',

  async route(state: MultiAgentStateType, _config: SupervisorConfig): Promise<RoutingDecision> {
    const availableWorkers = getAvailableWorkerLoads(state);

    if (availableWorkers.length === 0) {
      throw new Error('No available workers for load-balanced routing');
    }

    const targetWorker = availableWorkers[0];
    const avgWorkload = availableWorkers.reduce((sum, worker) => sum + worker.workload, 0)
      / availableWorkers.length;
    const confidence = targetWorker.workload === 0
      ? 1.0
      : Math.max(0.5, 1.0 - (targetWorker.workload / (avgWorkload * 2)));

    return {
      targetAgent: targetWorker.id,
      targetAgents: null,
      reasoning: `Lowest workload: ${targetWorker.workload} tasks (avg: ${avgWorkload.toFixed(1)})`,
      confidence,
      strategy: 'load-balanced',
      timestamp: Date.now(),
    };
  },
};
