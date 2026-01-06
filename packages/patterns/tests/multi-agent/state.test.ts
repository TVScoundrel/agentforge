import { describe, it, expect } from 'vitest';
import {
  MultiAgentState,
  MultiAgentStateConfig,
  type MultiAgentStateType,
} from '../../src/multi-agent/state.js';
import {
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
} from '../../src/multi-agent/schemas.js';

describe('Multi-Agent State', () => {
  describe('State Annotation', () => {
    it('should create state annotation', () => {
      expect(MultiAgentState).toBeDefined();
      expect(MultiAgentState.spec).toBeDefined();
    });

    it('should have all required channels', () => {
      const spec = MultiAgentState.spec;
      expect(spec.input).toBeDefined();
      expect(spec.messages).toBeDefined();
      expect(spec.workers).toBeDefined();
      expect(spec.currentAgent).toBeDefined();
      expect(spec.routingHistory).toBeDefined();
      expect(spec.activeAssignments).toBeDefined();
      expect(spec.completedTasks).toBeDefined();
      expect(spec.handoffs).toBeDefined();
      expect(spec.status).toBeDefined();
      expect(spec.iteration).toBeDefined();
      expect(spec.maxIterations).toBeDefined();
      expect(spec.response).toBeDefined();
      expect(spec.error).toBeDefined();
    });
  });

  describe('Schemas', () => {
    it('should validate AgentRole enum', () => {
      expect(AgentRoleSchema.safeParse('supervisor').success).toBe(true);
      expect(AgentRoleSchema.safeParse('worker').success).toBe(true);
      expect(AgentRoleSchema.safeParse('invalid').success).toBe(false);
    });

    it('should validate MessageType enum', () => {
      expect(MessageTypeSchema.safeParse('user_input').success).toBe(true);
      expect(MessageTypeSchema.safeParse('task_assignment').success).toBe(true);
      expect(MessageTypeSchema.safeParse('task_result').success).toBe(true);
      expect(MessageTypeSchema.safeParse('handoff').success).toBe(true);
      expect(MessageTypeSchema.safeParse('error').success).toBe(true);
      expect(MessageTypeSchema.safeParse('completion').success).toBe(true);
      expect(MessageTypeSchema.safeParse('invalid').success).toBe(false);
    });

    it('should validate AgentMessage schema', () => {
      const validMessage = {
        id: 'msg-1',
        type: 'task_assignment',
        from: 'supervisor',
        to: 'worker-1',
        content: 'Please analyze this data',
        timestamp: new Date().toISOString(),
      };

      const result = AgentMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it('should validate AgentMessage with multiple recipients', () => {
      const validMessage = {
        id: 'msg-2',
        type: 'task_assignment',
        from: 'supervisor',
        to: ['worker-1', 'worker-2'],
        content: 'Parallel task',
        timestamp: new Date().toISOString(),
      };

      const result = AgentMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it('should validate AgentMessage with metadata', () => {
      const validMessage = {
        id: 'msg-3',
        type: 'task_result',
        from: 'worker-1',
        to: 'supervisor',
        content: 'Task completed',
        metadata: { duration: 1500, tokensUsed: 250 },
        timestamp: new Date().toISOString(),
      };

      const result = AgentMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it('should validate RoutingStrategy enum', () => {
      expect(RoutingStrategySchema.safeParse('llm-based').success).toBe(true);
      expect(RoutingStrategySchema.safeParse('rule-based').success).toBe(true);
      expect(RoutingStrategySchema.safeParse('round-robin').success).toBe(true);
      expect(RoutingStrategySchema.safeParse('skill-based').success).toBe(true);
      expect(RoutingStrategySchema.safeParse('load-balanced').success).toBe(true);
      expect(RoutingStrategySchema.safeParse('invalid').success).toBe(false);
    });

    it('should validate RoutingDecision schema', () => {
      const validDecision = {
        targetAgent: 'worker-1',
        reasoning: 'This worker has the required skills',
        confidence: 0.95,
        strategy: 'skill-based',
      };

      const result = RoutingDecisionSchema.safeParse(validDecision);
      expect(result.success).toBe(true);
    });

    it('should validate RoutingDecision without optional fields', () => {
      const validDecision = {
        targetAgent: 'worker-2',
        strategy: 'round-robin',
      };

      const result = RoutingDecisionSchema.safeParse(validDecision);
      expect(result.success).toBe(true);
    });

    it('should reject RoutingDecision with invalid confidence', () => {
      const invalidDecision = {
        targetAgent: 'worker-1',
        confidence: 1.5, // Invalid: > 1
        strategy: 'llm-based',
      };

      const result = RoutingDecisionSchema.safeParse(invalidDecision);
      expect(result.success).toBe(false);
    });

    it('should validate WorkerCapabilities schema', () => {
      const validWorker = {
        agentId: 'worker-1',
        name: 'Research Agent',
        description: 'Specializes in web research and data gathering',
        skills: ['web-search', 'data-extraction', 'summarization'],
        tools: ['search', 'scrape', 'summarize'],
        available: true,
        workload: 2,
      };

      const result = WorkerCapabilitiesSchema.safeParse(validWorker);
      expect(result.success).toBe(true);
    });

    it('should validate WorkerCapabilities with defaults', () => {
      const validWorker = {
        agentId: 'worker-2',
        name: 'Writer Agent',
        description: 'Writes content',
        skills: ['writing'],
        tools: [],
      };

      const result = WorkerCapabilitiesSchema.safeParse(validWorker);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toBe(true);
        expect(result.data.workload).toBe(0);
      }
    });

    it('should validate TaskAssignment schema', () => {
      const validAssignment = {
        taskId: 'task-1',
        assignedTo: 'worker-1',
        description: 'Research quantum computing',
        input: { topic: 'quantum computing', depth: 'detailed' },
        priority: 8,
        assignedAt: new Date().toISOString(),
        deadline: new Date(Date.now() + 3600000).toISOString(),
      };

      const result = TaskAssignmentSchema.safeParse(validAssignment);
      expect(result.success).toBe(true);
    });

    it('should validate TaskAssignment with default priority', () => {
      const validAssignment = {
        taskId: 'task-2',
        assignedTo: 'worker-2',
        description: 'Write summary',
        input: 'Some data',
        assignedAt: new Date().toISOString(),
      };

      const result = TaskAssignmentSchema.safeParse(validAssignment);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe(5);
      }
    });

    it('should validate TaskResult schema', () => {
      const validResult = {
        taskId: 'task-1',
        completedBy: 'worker-1',
        success: true,
        result: { summary: 'Quantum computing is...', sources: 5 },
        completedAt: new Date().toISOString(),
        metadata: { duration: 2500, retries: 0 },
      };

      const result = TaskResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should validate TaskResult with error', () => {
      const validResult = {
        taskId: 'task-2',
        completedBy: 'worker-2',
        success: false,
        result: null,
        error: 'Tool execution failed',
        completedAt: new Date().toISOString(),
      };

      const result = TaskResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should validate MultiAgentStatus enum', () => {
      expect(MultiAgentStatusSchema.safeParse('initializing').success).toBe(true);
      expect(MultiAgentStatusSchema.safeParse('routing').success).toBe(true);
      expect(MultiAgentStatusSchema.safeParse('executing').success).toBe(true);
      expect(MultiAgentStatusSchema.safeParse('coordinating').success).toBe(true);
      expect(MultiAgentStatusSchema.safeParse('aggregating').success).toBe(true);
      expect(MultiAgentStatusSchema.safeParse('completed').success).toBe(true);
      expect(MultiAgentStatusSchema.safeParse('failed').success).toBe(true);
      expect(MultiAgentStatusSchema.safeParse('invalid').success).toBe(false);
    });

    it('should validate HandoffRequest schema', () => {
      const validHandoff = {
        from: 'worker-1',
        to: 'worker-2',
        reason: 'Requires specialized writing skills',
        context: { researchData: 'Some findings...', format: 'blog-post' },
        timestamp: new Date().toISOString(),
      };

      const result = HandoffRequestSchema.safeParse(validHandoff);
      expect(result.success).toBe(true);
    });
  });

  describe('State Configuration', () => {
    it('should have correct default values', () => {
      expect(MultiAgentStateConfig.input.default?.()).toBe('');
      expect(MultiAgentStateConfig.messages.default?.()).toEqual([]);
      expect(MultiAgentStateConfig.workers.default?.()).toEqual({});
      expect(MultiAgentStateConfig.routingHistory.default?.()).toEqual([]);
      expect(MultiAgentStateConfig.activeAssignments.default?.()).toEqual([]);
      expect(MultiAgentStateConfig.completedTasks.default?.()).toEqual([]);
      expect(MultiAgentStateConfig.handoffs.default?.()).toEqual([]);
      expect(MultiAgentStateConfig.status.default?.()).toBe('initializing');
      expect(MultiAgentStateConfig.iteration.default?.()).toBe(0);
      expect(MultiAgentStateConfig.maxIterations.default?.()).toBe(10);
    });

    it('should have correct reducers for arrays', () => {
      const messagesReducer = MultiAgentStateConfig.messages.reducer;
      expect(messagesReducer).toBeDefined();
      if (messagesReducer) {
        const left = [{ id: '1', type: 'user_input', from: 'user', to: 'supervisor', content: 'test', timestamp: new Date().toISOString() }];
        const right = [{ id: '2', type: 'task_assignment', from: 'supervisor', to: 'worker-1', content: 'task', timestamp: new Date().toISOString() }];
        const result = messagesReducer(left as any, right as any);
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('1');
        expect(result[1].id).toBe('2');
      }

      const iterationReducer = MultiAgentStateConfig.iteration.reducer;
      expect(iterationReducer).toBeDefined();
      if (iterationReducer) {
        expect(iterationReducer(1, 1)).toBe(2);
        expect(iterationReducer(5, 3)).toBe(8);
      }
    });

    it('should have correct reducer for workers record', () => {
      const workersReducer = MultiAgentStateConfig.workers.reducer;
      expect(workersReducer).toBeDefined();
      if (workersReducer) {
        const left = {
          'worker-1': {
            agentId: 'worker-1',
            name: 'Worker 1',
            description: 'Test',
            skills: [],
            tools: [],
            available: true,
            workload: 0,
          },
        };
        const right = {
          'worker-2': {
            agentId: 'worker-2',
            name: 'Worker 2',
            description: 'Test',
            skills: [],
            tools: [],
            available: true,
            workload: 0,
          },
        };
        const result = workersReducer(left as any, right as any);
        expect(Object.keys(result)).toHaveLength(2);
        expect(result['worker-1']).toBeDefined();
        expect(result['worker-2']).toBeDefined();
      }
    });
  });
});

