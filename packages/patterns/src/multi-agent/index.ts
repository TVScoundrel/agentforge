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

