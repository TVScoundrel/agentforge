import { describe, expect, it } from 'vitest';
import {
  AgentMessageSchema,
  AgentRoleSchema,
  HandoffRequestSchema,
  MessageTypeSchema,
  MultiAgentStatusSchema,
  RoutingDecisionSchema,
  RoutingStrategySchema,
  TaskAssignmentSchema,
  TaskResultSchema,
  WorkerCapabilitiesSchema,
} from '../../src/multi-agent/schemas.js';

describe('Multi-Agent Schemas', () => {
  it('validates the agent role enum', () => {
    expect(AgentRoleSchema.safeParse('supervisor').success).toBe(true);
    expect(AgentRoleSchema.safeParse('worker').success).toBe(true);
    expect(AgentRoleSchema.safeParse('invalid').success).toBe(false);
  });

  it('validates the message type enum', () => {
    expect(MessageTypeSchema.safeParse('user_input').success).toBe(true);
    expect(MessageTypeSchema.safeParse('task_assignment').success).toBe(true);
    expect(MessageTypeSchema.safeParse('task_result').success).toBe(true);
    expect(MessageTypeSchema.safeParse('handoff').success).toBe(true);
    expect(MessageTypeSchema.safeParse('error').success).toBe(true);
    expect(MessageTypeSchema.safeParse('completion').success).toBe(true);
    expect(MessageTypeSchema.safeParse('invalid').success).toBe(false);
  });

  it('validates an agent message', () => {
    const validMessage = {
      id: 'msg-1',
      type: 'task_assignment',
      from: 'supervisor',
      to: 'worker-1',
      content: 'Please analyze this data',
      timestamp: Date.now(),
    };

    expect(AgentMessageSchema.safeParse(validMessage).success).toBe(true);
  });

  it('validates an agent message with multiple recipients', () => {
    const validMessage = {
      id: 'msg-2',
      type: 'task_assignment',
      from: 'supervisor',
      to: ['worker-1', 'worker-2'],
      content: 'Parallel task',
      timestamp: Date.now(),
    };

    expect(AgentMessageSchema.safeParse(validMessage).success).toBe(true);
  });

  it('validates an agent message with metadata', () => {
    const validMessage = {
      id: 'msg-3',
      type: 'task_result',
      from: 'worker-1',
      to: 'supervisor',
      content: 'Task completed',
      metadata: { duration: 1500, tokensUsed: 250 },
      timestamp: Date.now(),
    };

    expect(AgentMessageSchema.safeParse(validMessage).success).toBe(true);
  });

  it('rejects non-JSON-safe metadata while preserving unknown-first handoff context', () => {
    const nullPrototypeMetadata = Object.assign(Object.create(null), {
      duration: 1500,
      tokensUsed: 250,
    });

    const invalidMessage = {
      id: 'msg-4',
      type: 'task_result',
      from: 'worker-1',
      to: 'supervisor',
      content: 'Task completed',
      metadata: { callback: () => 'not-json-safe' },
      timestamp: Date.now(),
    };

    const validNullPrototypeMessage = {
      id: 'msg-4b',
      type: 'task_result',
      from: 'worker-1',
      to: 'supervisor',
      content: 'Task completed',
      metadata: nullPrototypeMetadata,
      timestamp: Date.now(),
    };

    const invalidTaskResult = {
      assignmentId: 'assignment-3',
      workerId: 'worker-1',
      success: true,
      result: 'Completed',
      completedAt: Date.now(),
      metadata: {
        score: Number.POSITIVE_INFINITY,
      },
    };

    const flexibleHandoff = {
      from: 'worker-1',
      to: 'worker-2',
      reason: 'Pass through rich runtime context',
      context: { symbolToken: Symbol('handoff') },
      timestamp: new Date().toISOString(),
    };

    expect(AgentMessageSchema.safeParse(invalidMessage).success).toBe(false);
    expect(AgentMessageSchema.safeParse(validNullPrototypeMessage).success).toBe(true);
    expect(TaskResultSchema.safeParse(invalidTaskResult).success).toBe(false);
    expect(HandoffRequestSchema.safeParse(flexibleHandoff).success).toBe(true);
  });

  it('validates the routing strategy enum', () => {
    expect(RoutingStrategySchema.safeParse('llm-based').success).toBe(true);
    expect(RoutingStrategySchema.safeParse('rule-based').success).toBe(true);
    expect(RoutingStrategySchema.safeParse('round-robin').success).toBe(true);
    expect(RoutingStrategySchema.safeParse('skill-based').success).toBe(true);
    expect(RoutingStrategySchema.safeParse('load-balanced').success).toBe(true);
    expect(RoutingStrategySchema.safeParse('invalid').success).toBe(false);
  });

  it('validates a routing decision', () => {
    const validDecision = {
      targetAgent: 'worker-1',
      reasoning: 'This worker has the required skills',
      confidence: 0.95,
      strategy: 'skill-based',
    };

    expect(RoutingDecisionSchema.safeParse(validDecision).success).toBe(true);
  });

  it('validates a routing decision without optional fields', () => {
    const validDecision = {
      targetAgent: 'worker-2',
      strategy: 'round-robin',
    };

    expect(RoutingDecisionSchema.safeParse(validDecision).success).toBe(true);
  });

  it('rejects a routing decision with invalid confidence', () => {
    const invalidDecision = {
      targetAgent: 'worker-1',
      confidence: 1.5,
      strategy: 'llm-based',
    };

    expect(RoutingDecisionSchema.safeParse(invalidDecision).success).toBe(false);
  });

  it('validates worker capabilities', () => {
    const validWorker = {
      skills: ['web-search', 'data-extraction', 'summarization'],
      tools: ['search', 'scrape', 'summarize'],
      available: true,
      currentWorkload: 2,
    };

    const result = WorkerCapabilitiesSchema.safeParse(validWorker);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentWorkload).toBe(2);
    }
  });

  it('validates worker capabilities with defaults', () => {
    const validWorker = {
      skills: ['writing'],
      tools: [],
    };

    const result = WorkerCapabilitiesSchema.safeParse(validWorker);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.available).toBe(true);
      expect(result.data.currentWorkload).toBe(0);
    }
  });

  it('validates a task assignment', () => {
    const validAssignment = {
      id: 'assignment-1',
      workerId: 'worker-1',
      task: 'Research quantum computing',
      priority: 8,
      assignedAt: Date.now(),
      deadline: Date.now() + 3600000,
    };

    expect(TaskAssignmentSchema.safeParse(validAssignment).success).toBe(true);
  });

  it('validates a task assignment with default priority', () => {
    const validAssignment = {
      id: 'assignment-2',
      workerId: 'worker-2',
      task: 'Write summary',
      assignedAt: Date.now(),
    };

    const result = TaskAssignmentSchema.safeParse(validAssignment);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe(5);
    }
  });

  it('validates a task result', () => {
    const validResult = {
      assignmentId: 'assignment-1',
      workerId: 'worker-1',
      success: true,
      result: 'Quantum computing is...',
      completedAt: Date.now(),
      metadata: { duration: 2500, retries: 0 },
    };

    expect(TaskResultSchema.safeParse(validResult).success).toBe(true);
  });

  it('validates a task result with an error', () => {
    const validResult = {
      assignmentId: 'assignment-2',
      workerId: 'worker-2',
      success: false,
      result: '',
      error: 'Tool execution failed',
      completedAt: Date.now(),
    };

    expect(TaskResultSchema.safeParse(validResult).success).toBe(true);
  });

  it('validates the multi-agent status enum', () => {
    expect(MultiAgentStatusSchema.safeParse('initializing').success).toBe(true);
    expect(MultiAgentStatusSchema.safeParse('routing').success).toBe(true);
    expect(MultiAgentStatusSchema.safeParse('executing').success).toBe(true);
    expect(MultiAgentStatusSchema.safeParse('coordinating').success).toBe(true);
    expect(MultiAgentStatusSchema.safeParse('aggregating').success).toBe(true);
    expect(MultiAgentStatusSchema.safeParse('completed').success).toBe(true);
    expect(MultiAgentStatusSchema.safeParse('failed').success).toBe(true);
    expect(MultiAgentStatusSchema.safeParse('invalid').success).toBe(false);
  });

  it('validates a handoff request', () => {
    const validHandoff = {
      from: 'worker-1',
      to: 'worker-2',
      reason: 'Requires specialized writing skills',
      context: { researchData: 'Some findings...', format: 'blog-post' },
      timestamp: new Date().toISOString(),
    };

    expect(HandoffRequestSchema.safeParse(validHandoff).success).toBe(true);
  });
});
