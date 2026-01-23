/**
 * Zod Schemas for Multi-Agent Coordination Pattern
 *
 * This module defines the validation schemas for the Multi-Agent pattern.
 * The pattern enables multiple specialized agents to collaborate on complex tasks
 * through a supervisor that routes work and coordinates execution.
 *
 * @module patterns/multi-agent/schemas
 */

import { z } from 'zod';

/**
 * Schema for agent roles in the system
 */
export const AgentRoleSchema = z.enum(['supervisor', 'worker']);

export type AgentRole = z.infer<typeof AgentRoleSchema>;

/**
 * Schema for message types in multi-agent communication
 */
export const MessageTypeSchema = z.enum([
  'user_input',      // Initial user message
  'task_assignment', // Supervisor assigns task to worker
  'task_result',     // Worker returns result to supervisor
  'handoff',         // Worker hands off to another worker
  'error',           // Error message
  'completion',      // Final completion message
]);

export type MessageType = z.infer<typeof MessageTypeSchema>;

/**
 * Schema for a message in the multi-agent system
 */
export const AgentMessageSchema = z.object({
  /**
   * Unique identifier for the message
   */
  id: z.string().describe('Unique message identifier'),

  /**
   * Type of message
   */
  type: MessageTypeSchema.describe('Type of message'),

  /**
   * Agent that sent the message
   */
  from: z.string().describe('Agent identifier that sent the message'),

  /**
   * Agent(s) that should receive the message
   */
  to: z.union([z.string(), z.array(z.string())]).describe('Target agent(s)'),

  /**
   * Message content
   */
  content: z.string().describe('Message content'),

  /**
   * Optional metadata
   */
  metadata: z.record(z.any()).optional().describe('Additional message metadata'),

  /**
   * Timestamp when message was created
   */
  timestamp: z.number().describe('Timestamp when message was created'),
});

export type AgentMessage = z.infer<typeof AgentMessageSchema>;

/**
 * Schema for routing strategies
 */
export const RoutingStrategySchema = z.enum([
  'llm-based',      // LLM decides which agent to route to
  'rule-based',     // Predefined rules determine routing
  'round-robin',    // Distribute tasks evenly across agents
  'skill-based',    // Route based on agent capabilities
  'load-balanced',  // Route based on agent workload
]);

export type RoutingStrategy = z.infer<typeof RoutingStrategySchema>;

/**
 * Schema for routing decision
 *
 * Supports both single-agent and parallel multi-agent routing:
 * - Single: Use `targetAgent` field
 * - Parallel: Use `targetAgents` array field
 *
 * If both are provided, `targetAgents` takes precedence.
 *
 * Note: Uses .nullable() instead of .optional() for OpenAI structured output compatibility
 */
export const RoutingDecisionSchema = z.object({
  /**
   * Target agent to route to (single agent routing)
   * @deprecated Use targetAgents for parallel routing support
   */
  targetAgent: z.string().nullable().default(null).describe('Agent to route the task to (single routing)'),

  /**
   * Target agents to route to (parallel routing)
   * When multiple agents are specified, they execute in parallel
   */
  targetAgents: z.array(z.string()).nullable().default(null).describe('Agents to route the task to (parallel routing)'),

  /**
   * Reasoning for the routing decision
   */
  reasoning: z.string().default('').describe('Explanation for routing decision'),

  /**
   * Confidence in the routing decision (0-1)
   */
  confidence: z.number().min(0).max(1).default(0.8).describe('Confidence score'),

  /**
   * Strategy used for routing
   */
  strategy: RoutingStrategySchema.default('llm-based').describe('Strategy used for this decision'),

  /**
   * Timestamp of the routing decision
   */
  timestamp: z.number().default(() => Date.now()).describe('Timestamp of the decision'),
}).refine(
  (data) => data.targetAgent || (data.targetAgents && data.targetAgents.length > 0),
  { message: 'Either targetAgent or targetAgents must be provided' }
);

export type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;

/**
 * Schema for worker agent capabilities
 */
export const WorkerCapabilitiesSchema = z.object({
  /**
   * Skills/capabilities the agent has
   */
  skills: z.array(z.string()).describe('List of agent skills'),

  /**
   * Tools available to the agent
   */
  tools: z.array(z.string()).describe('List of tool names available to agent'),

  /**
   * Whether the agent is currently available
   */
  available: z.boolean().default(true).describe('Whether agent is available'),

  /**
   * Current workload (number of active tasks)
   */
  currentWorkload: z.number().int().nonnegative().default(0).describe('Current number of active tasks'),
});

export type WorkerCapabilities = z.infer<typeof WorkerCapabilitiesSchema>;

/**
 * Schema for task assignment
 */
export const TaskAssignmentSchema = z.object({
  /**
   * Unique assignment identifier
   */
  id: z.string().describe('Unique assignment identifier'),

  /**
   * Worker ID assigned to the task
   */
  workerId: z.string().describe('Worker identifier assigned to task'),

  /**
   * Task description
   */
  task: z.string().describe('Description of the task'),

  /**
   * Task priority (1-10, higher is more urgent)
   */
  priority: z.number().int().min(1).max(10).default(5).describe('Task priority'),

  /**
   * Timestamp when task was assigned
   */
  assignedAt: z.number().describe('Timestamp when task was assigned'),

  /**
   * Optional deadline for task completion
   */
  deadline: z.number().optional().describe('Optional task deadline timestamp'),
});

export type TaskAssignment = z.infer<typeof TaskAssignmentSchema>;

/**
 * Schema for task result
 */
export const TaskResultSchema = z.object({
  /**
   * Assignment identifier
   */
  assignmentId: z.string().describe('Assignment identifier'),

  /**
   * Worker that completed the task
   */
  workerId: z.string().describe('Worker that completed the task'),

  /**
   * Whether the task succeeded
   */
  success: z.boolean().describe('Whether the task succeeded'),

  /**
   * Task result/output
   */
  result: z.string().describe('Task result or output'),

  /**
   * Optional error message if task failed
   */
  error: z.string().optional().describe('Error message if task failed'),

  /**
   * Timestamp when task was completed
   */
  completedAt: z.number().describe('Timestamp when task was completed'),

  /**
   * Optional metadata about execution
   */
  metadata: z.record(z.any()).optional().describe('Execution metadata'),
});

export type TaskResult = z.infer<typeof TaskResultSchema>;

/**
 * Schema for multi-agent execution status
 */
export const MultiAgentStatusSchema = z.enum([
  'initializing',  // System is initializing
  'routing',       // Supervisor is routing the task
  'executing',     // Worker is executing the task
  'coordinating',  // Multiple workers are coordinating
  'aggregating',   // Results are being aggregated
  'completed',     // Task is completed
  'failed',        // Task failed
]);

export type MultiAgentStatus = z.infer<typeof MultiAgentStatusSchema>;

/**
 * Schema for handoff request
 */
export const HandoffRequestSchema = z.object({
  /**
   * Agent requesting the handoff
   */
  from: z.string().describe('Agent requesting handoff'),

  /**
   * Target agent for handoff
   */
  to: z.string().describe('Target agent for handoff'),

  /**
   * Reason for handoff
   */
  reason: z.string().describe('Reason for requesting handoff'),

  /**
   * Context to pass to next agent
   */
  context: z.any().describe('Context to pass to next agent'),

  /**
   * Timestamp of handoff request
   */
  timestamp: z.string().datetime().describe('ISO timestamp of handoff request'),
});

export type HandoffRequest = z.infer<typeof HandoffRequestSchema>;

