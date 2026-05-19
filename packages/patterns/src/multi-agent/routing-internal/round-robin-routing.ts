import type { RoutingDecision } from '../schemas.js';
import type { MultiAgentStateType } from '../state.js';
import type { RoutingStrategyImpl, SupervisorConfig } from '../types.js';
import { getAvailableWorkerIds } from './worker-selection.js';

function createRoundRobinDecision(
  targetAgent: string,
  position: number,
  workerCount: number
): RoutingDecision {
  return {
    targetAgent,
    targetAgents: null,
    reasoning: `Round-robin selection: worker ${position} of ${workerCount}`,
    confidence: 1.0,
    strategy: 'round-robin',
    timestamp: Date.now(),
  };
}

export const roundRobinRouting: RoutingStrategyImpl = {
  name: 'round-robin',

  async route(state: MultiAgentStateType, _config: SupervisorConfig): Promise<RoutingDecision> {
    const availableWorkers = getAvailableWorkerIds(state);

    if (availableWorkers.length === 0) {
      throw new Error('No available workers for round-robin routing');
    }

    const lastRoutingIndex = state.routingHistory.length % availableWorkers.length;
    return createRoundRobinDecision(
      availableWorkers[lastRoutingIndex],
      lastRoutingIndex + 1,
      availableWorkers.length
    );
  },
};
