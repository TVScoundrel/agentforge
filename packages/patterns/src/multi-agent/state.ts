/**
 * State Management for Multi-Agent Coordination Pattern
 *
 * This module defines the state structure for the Multi-Agent pattern.
 * The pattern enables multiple specialized agents to collaborate on complex tasks
 * through a supervisor that routes work and coordinates execution.
 *
 * @module patterns/multi-agent/state
 */

import { z } from 'zod';
import { createStateAnnotation, type StateChannelConfig } from '@agentforge/core';
import {
  AgentMessageSchema,
  RoutingDecisionSchema,
  WorkerCapabilitiesSchema,
  TaskAssignmentSchema,
  TaskResultSchema,
  MultiAgentStatusSchema,
  HandoffRequestSchema,
  type AgentMessage,
  type RoutingDecision,
  type WorkerCapabilities,
  type TaskAssignment,
  type TaskResult,
  type MultiAgentStatus,
  type HandoffRequest,
} from './schemas.js';

/**
 * Multi-Agent state configuration
 *
 * This configuration is used with createStateAnnotation() to create a
 * LangGraph Annotation.Root() with optional Zod validation.
 */
export const MultiAgentStateConfig = {
  /**
   * Original user input/query
   */
  input: {
    schema: z.string(),
    default: () => '',
    description: 'Original user input or query',
  } satisfies StateChannelConfig<string, string>,

  /**
   * All messages in the multi-agent conversation
   * Accumulates all messages between agents
   */
  messages: {
    schema: z.array(AgentMessageSchema),
    reducer: (left: AgentMessage[], right: AgentMessage[]) => [...left, ...right],
    default: () => [],
    description: 'All messages in the multi-agent conversation',
  } satisfies StateChannelConfig<AgentMessage[], AgentMessage[]>,

  /**
   * Available worker agents and their capabilities
   */
  workers: {
    schema: z.record(z.string(), WorkerCapabilitiesSchema),
    reducer: (left: Record<string, WorkerCapabilities>, right: Record<string, WorkerCapabilities>) => ({
      ...left,
      ...right,
    }),
    default: () => ({}),
    description: 'Available worker agents and their capabilities',
  } satisfies StateChannelConfig<Record<string, WorkerCapabilities>, Record<string, WorkerCapabilities>>,

  /**
   * Current active agent
   */
  currentAgent: {
    schema: z.string().optional(),
    description: 'Identifier of the currently active agent',
  } satisfies StateChannelConfig<string | undefined, string | undefined>,

  /**
   * Routing decisions made by the supervisor
   * Accumulates all routing decisions
   */
  routingHistory: {
    schema: z.array(RoutingDecisionSchema),
    reducer: (left: RoutingDecision[], right: RoutingDecision[]) => [...left, ...right],
    default: () => [],
    description: 'History of routing decisions',
  } satisfies StateChannelConfig<RoutingDecision[], RoutingDecision[]>,

  /**
   * Active task assignments
   */
  activeAssignments: {
    schema: z.array(TaskAssignmentSchema),
    reducer: (left: TaskAssignment[], right: TaskAssignment[]) => [...left, ...right],
    default: () => [],
    description: 'Currently active task assignments',
  } satisfies StateChannelConfig<TaskAssignment[], TaskAssignment[]>,

  /**
   * Completed task results
   * Accumulates all completed tasks
   */
  completedTasks: {
    schema: z.array(TaskResultSchema),
    reducer: (left: TaskResult[], right: TaskResult[]) => [...left, ...right],
    default: () => [],
    description: 'Completed task results',
  } satisfies StateChannelConfig<TaskResult[], TaskResult[]>,

  /**
   * Handoff requests between agents
   * Accumulates all handoff requests
   */
  handoffs: {
    schema: z.array(HandoffRequestSchema),
    reducer: (left: HandoffRequest[], right: HandoffRequest[]) => [...left, ...right],
    default: () => [],
    description: 'Handoff requests between agents',
  } satisfies StateChannelConfig<HandoffRequest[], HandoffRequest[]>,

  /**
   * Current execution status
   */
  status: {
    schema: MultiAgentStatusSchema,
    default: () => 'initializing' as MultiAgentStatus,
    description: 'Current multi-agent execution status',
  } satisfies StateChannelConfig<MultiAgentStatus, MultiAgentStatus>,

  /**
   * Iteration counter
   */
  iteration: {
    schema: z.number().int().nonnegative(),
    reducer: (left: number, right: number) => left + right,
    default: () => 0,
    description: 'Current iteration number',
  } satisfies StateChannelConfig<number, number>,

  /**
   * Maximum iterations allowed
   */
  maxIterations: {
    schema: z.number().int().positive(),
    default: () => 10,
    description: 'Maximum number of iterations allowed',
  } satisfies StateChannelConfig<number, number>,

  /**
   * Final aggregated response
   */
  response: {
    schema: z.string().optional(),
    description: 'Final aggregated response',
  } satisfies StateChannelConfig<string | undefined, string | undefined>,

  /**
   * Error message if execution failed
   */
  error: {
    schema: z.string().optional(),
    description: 'Error message if execution failed',
  } satisfies StateChannelConfig<string | undefined, string | undefined>,
};

/**
 * Create the Multi-Agent state annotation
 *
 * This uses LangGraph's Annotation.Root() under the hood, with optional Zod validation.
 */
export const MultiAgentState = createStateAnnotation(MultiAgentStateConfig);

/**
 * TypeScript type for Multi-Agent state
 *
 * Manually defined to work around TypeScript's inability to infer the .State property
 */
export type MultiAgentStateType = {
  input: string;
  messages: AgentMessage[];
  workers: Record<string, WorkerCapabilities>;
  currentAgent?: string;
  routingHistory: RoutingDecision[];
  activeAssignments: TaskAssignment[];
  completedTasks: TaskResult[];
  handoffs: HandoffRequest[];
  status: MultiAgentStatus;
  iteration: number;
  maxIterations: number;
  response?: string;
  error?: string;
};

/**
 * Export schemas for external use
 */
export {
  AgentMessageSchema,
  RoutingDecisionSchema,
  WorkerCapabilitiesSchema,
  TaskAssignmentSchema,
  TaskResultSchema,
  MultiAgentStatusSchema,
  HandoffRequestSchema,
  type AgentMessage,
  type RoutingDecision,
  type WorkerCapabilities,
  type TaskAssignment,
  type TaskResult,
  type MultiAgentStatus,
  type HandoffRequest,
};

