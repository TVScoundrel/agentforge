import type { RoutingDecision } from '../schemas.js';
import type { MultiAgentStateType } from '../state.js';
import type { RoutingStrategyImpl, SupervisorConfig } from '../types.js';

export const ruleBasedRouting: RoutingStrategyImpl = {
  name: 'rule-based',

  async route(state: MultiAgentStateType, config: SupervisorConfig): Promise<RoutingDecision> {
    if (!config.routingFn) {
      throw new Error('Rule-based routing requires a custom routing function');
    }

    return config.routingFn(state);
  },
};
