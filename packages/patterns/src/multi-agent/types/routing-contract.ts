import type { MultiAgentStateType } from '../state.js';
import type { RoutingDecision, RoutingStrategy } from '../schemas.js';
import type { SupervisorConfig } from './supervisor-contract.js';

export type MultiAgentNode = 'supervisor' | 'aggregator' | string;
export type MultiAgentRoute = 'continue' | 'aggregate' | 'end' | string | string[];
export type MultiAgentRouter = (state: MultiAgentStateType) => MultiAgentRoute;

export interface RoutingStrategyImpl {
  name: RoutingStrategy;
  route: (state: MultiAgentStateType, config: SupervisorConfig) => Promise<RoutingDecision>;
}
