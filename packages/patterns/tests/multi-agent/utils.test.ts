/**
 * Tests for Multi-Agent Utils
 */

import { describe, it, expect, vi } from 'vitest';
import { wrapReActAgent } from '../../src/multi-agent/utils.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import { HumanMessage } from '@langchain/core/messages';

describe('Multi-Agent Utils', () => {
  describe('wrapReActAgent', () => {
    it('should use the correct assignment task in parallel execution', async () => {
      // Create a mock ReAct agent that captures the input it receives
      let capturedInput: any = null;
      const mockReActAgent = {
        invoke: vi.fn(async (input: any) => {
          capturedInput = input;
          return {
            messages: [new HumanMessage('Mock response')],
            response: 'Mock response',
          };
        }),
      } as any;

      // Create state with TWO parallel assignments for different workers
      const state: MultiAgentStateType = {
        input: 'Initial input',
        messages: [
          {
            from: 'supervisor',
            to: ['worker1'],
            type: 'task_assignment',
            content: 'Task for worker2 (most recent message)', // This is the WRONG task for worker1
            timestamp: Date.now(),
          },
        ],
        workers: {
          worker1: {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 1,
          },
          worker2: {
            skills: ['skill2'],
            tools: [],
            available: true,
            currentWorkload: 1,
          },
        },
        currentAgent: 'worker1',
        routingHistory: [],
        activeAssignments: [
          {
            id: 'assignment-1',
            workerId: 'worker1',
            task: 'Analyze customer feedback data', // This is the CORRECT task for worker1
            priority: 5,
            assignedAt: Date.now() - 1000,
          },
          {
            id: 'assignment-2',
            workerId: 'worker2',
            task: 'Task for worker2 (most recent message)', // This is for worker2
            priority: 5,
            assignedAt: Date.now(),
          },
        ],
        completedTasks: [],
        handoffs: [],
        status: 'executing',
        iteration: 1,
        maxIterations: 10,
        response: '',
      };

      // Wrap the ReAct agent for worker1
      const wrappedAgent = wrapReActAgent('worker1', mockReActAgent);

      // Execute the wrapped agent
      await wrappedAgent(state);

      // Verify the agent was called
      expect(mockReActAgent.invoke).toHaveBeenCalled();

      // CRITICAL ASSERTION: Verify the agent received the CORRECT task from worker1's assignment
      // NOT the most recent message which belongs to worker2
      expect(capturedInput).toBeDefined();
      expect(capturedInput.messages).toBeDefined();
      expect(capturedInput.messages.length).toBeGreaterThan(0);
      
      // The last message should contain worker1's task
      const lastMessage = capturedInput.messages[capturedInput.messages.length - 1];
      expect(lastMessage.content).toBe('Analyze customer feedback data');
      
      // It should NOT contain worker2's task
      expect(lastMessage.content).not.toBe('Task for worker2 (most recent message)');
    });

    it('should return empty state when no assignment found for worker', async () => {
      const mockReActAgent = {
        invoke: vi.fn(),
      } as any;

      const state: MultiAgentStateType = {
        input: 'Test input',
        messages: [],
        workers: {
          worker1: {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        },
        currentAgent: 'worker1',
        routingHistory: [],
        activeAssignments: [], // No assignments
        completedTasks: [],
        handoffs: [],
        status: 'executing',
        iteration: 1,
        maxIterations: 10,
        response: '',
      };

      const wrappedAgent = wrapReActAgent('worker1', mockReActAgent);
      const result = await wrappedAgent(state);

      // Should return empty state without calling the agent
      expect(mockReActAgent.invoke).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('should skip completed assignments', async () => {
      const mockReActAgent = {
        invoke: vi.fn(async () => ({
          messages: [new HumanMessage('Response')],
          response: 'Response',
        })),
      } as any;

      const assignmentId = 'assignment-1';
      const state: MultiAgentStateType = {
        input: 'Test input',
        messages: [],
        workers: {
          worker1: {
            skills: ['skill1'],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        },
        currentAgent: 'worker1',
        routingHistory: [],
        activeAssignments: [
          {
            id: assignmentId,
            workerId: 'worker1',
            task: 'Test task',
            priority: 5,
            assignedAt: Date.now(),
          },
        ],
        completedTasks: [
          {
            assignmentId, // This assignment is already completed
            workerId: 'worker1',
            success: true,
            result: 'Already done',
            completedAt: Date.now(),
          },
        ],
        handoffs: [],
        status: 'executing',
        iteration: 1,
        maxIterations: 10,
        response: '',
      };

      const wrappedAgent = wrapReActAgent('worker1', mockReActAgent);
      const result = await wrappedAgent(state);

      // Should not call agent for completed assignment
      expect(mockReActAgent.invoke).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });
  });
});

