/** Stable type-export facade for multi-agent configuration and routing contracts. */
export type { SupervisorConfig } from './types/supervisor-contract.js';
export type { WorkerConfig, WorkerExecutionConfig } from './types/worker-contract.js';
export type { AggregatorConfig, MultiAgentSystemConfig } from './types/aggregator-system-contract.js';
export type {
  MultiAgentNode,
  MultiAgentRoute,
  MultiAgentRouter,
  RoutingStrategyImpl,
} from './types/routing-contract.js';
