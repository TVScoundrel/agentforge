/**
 * Multi-Agent Coordination Pattern
 *
 * This module provides utilities for building multi-agent systems where
 * a supervisor coordinates multiple specialized worker agents.
 *
 * @module patterns/multi-agent
 */

// Export state and schemas
export {
  MultiAgentState,
  MultiAgentStateConfig,
  type MultiAgentStateType,
} from './state.js';

export {
  AgentRoleSchema,
  MessageTypeSchema,
  AgentMessageSchema,
  RoutingStrategySchema,
  RoutingDecisionSchema,
  WorkerCapabilitiesSchema,
  TaskAssignmentSchema,
  TaskResultSchema,
  MultiAgentStatusSchema,
  HandoffRequestSchema,
  type AgentRole,
  type MessageType,
  type AgentMessage,
  type RoutingStrategy,
  type RoutingDecision,
  type WorkerCapabilities,
  type TaskAssignment,
  type TaskResult,
  type MultiAgentStatus,
  type HandoffRequest,
} from './schemas.js';

// Export types
export {
  type SupervisorConfig,
  type WorkerConfig,
  type AggregatorConfig,
  type MultiAgentSystemConfig,
  type MultiAgentNode,
  type MultiAgentRoute,
  type MultiAgentRouter,
  type RoutingStrategyImpl,
} from './types.js';

// Export routing strategies
export {
  DEFAULT_SUPERVISOR_SYSTEM_PROMPT,
  llmBasedRouting,
  roundRobinRouting,
  skillBasedRouting,
  loadBalancedRouting,
  ruleBasedRouting,
  getRoutingStrategy,
} from './routing.js';

// Export node creators
export {
  DEFAULT_AGGREGATOR_SYSTEM_PROMPT,
  createSupervisorNode,
  createWorkerNode,
  createAggregatorNode,
} from './nodes.js';

// Export agent creation
export {
  createMultiAgentSystem,
  registerWorkers,
} from './agent.js';
