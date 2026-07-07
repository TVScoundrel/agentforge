/**
 * Zod Schemas for Multi-Agent Coordination Pattern
 *
 * This module defines the validation schemas for the Multi-Agent pattern.
 * The pattern enables multiple specialized agents to collaborate on complex tasks
 * through a supervisor that routes work and coordinates execution.
 *
 * @module patterns/multi-agent/schemas
 */

export {
  AgentRoleSchema,
  AgentMessageSchema,
  MessageTypeSchema,
  type AgentMessage,
  type AgentRole,
  type MessageType,
} from './schemas-message.js';
export {
  RoutingDecisionSchema,
  RoutingStrategySchema,
  type RoutingDecision,
  type RoutingStrategy,
} from './schemas-routing.js';
export {
  TaskAssignmentSchema,
  TaskResultSchema,
  WorkerCapabilitiesSchema,
  type TaskAssignment,
  type TaskResult,
  type WorkerCapabilities,
} from './schemas-worker.js';
export {
  HandoffRequestSchema,
  MultiAgentStatusSchema,
  type HandoffRequest,
  type MultiAgentStatus,
} from './schemas-handoff.js';
