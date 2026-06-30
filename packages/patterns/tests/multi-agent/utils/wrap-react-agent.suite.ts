import { describe, it, expect, vi } from 'vitest';
import { wrapReActAgent } from '../../../src/multi-agent/utils.js';
import { createHumanMessageResponse, createMockReActAgent, createWorkerState } from './shared.js';

describe('Multi-Agent Utils wrapReActAgent', () => {
  it('uses the correct assignment task in parallel execution', async () => {
    let capturedInput: unknown;
    const mockReActAgent = createMockReActAgent(async (input: unknown) => {
      capturedInput = input;
      return createHumanMessageResponse('Mock response');
    });

    const state = createWorkerState({
      messages: [
        {
          from: 'supervisor',
          to: ['worker1'],
          type: 'task_assignment',
          content: 'Task for worker2 (most recent message)',
          timestamp: Date.now(),
        },
      ],
      activeAssignments: [
        {
          id: 'assignment-1',
          workerId: 'worker1',
          task: 'Analyze customer feedback data',
          priority: 5,
          assignedAt: Date.now() - 1000,
        },
        {
          id: 'assignment-2',
          workerId: 'worker2',
          task: 'Task for worker2 (most recent message)',
          priority: 5,
          assignedAt: Date.now(),
        },
      ],
    });

    const wrappedAgent = wrapReActAgent('worker1', mockReActAgent);
    await wrappedAgent(state);

    expect(mockReActAgent.invoke).toHaveBeenCalled();
    expect(capturedInput).toMatchObject({
      messages: [{ role: 'user', content: 'Analyze customer feedback data' }],
    });
  });

  it('returns empty state when no assignment is found for worker', async () => {
    const mockReActAgent = createMockReActAgent(async () => createHumanMessageResponse('unused'));
    const state = createWorkerState({
      activeAssignments: [],
      workers: {
        worker1: {
          skills: ['skill1'],
          tools: [],
          available: true,
          currentWorkload: 0,
        },
      },
    });

    const wrappedAgent = wrapReActAgent('worker1', mockReActAgent);
    const result = await wrappedAgent(state);

    expect(mockReActAgent.invoke).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it('skips completed assignments', async () => {
    const mockReActAgent = createMockReActAgent(async () => createHumanMessageResponse('Response'));
    const assignmentId = 'assignment-1';
    const state = createWorkerState({
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
          assignmentId,
          workerId: 'worker1',
          success: true,
          result: 'Already done',
          completedAt: Date.now(),
        },
      ],
    });

    const wrappedAgent = wrapReActAgent('worker1', mockReActAgent);
    const result = await wrappedAgent(state);

    expect(mockReActAgent.invoke).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it('targets the active assignment when the error path follows completed work', async () => {
    const mockReActAgent = createMockReActAgent(async () => {
      throw new Error('forced failure');
    });
    const completedAssignmentId = 'assignment-1';
    const activeAssignmentId = 'assignment-2';
    const state = createWorkerState({
      activeAssignments: [
        {
          id: completedAssignmentId,
          workerId: 'worker1',
          task: 'Completed task',
          priority: 5,
          assignedAt: Date.now() - 1000,
        },
        {
          id: activeAssignmentId,
          workerId: 'worker1',
          task: 'Active task',
          priority: 5,
          assignedAt: Date.now(),
        },
      ],
      completedTasks: [
        {
          assignmentId: completedAssignmentId,
          workerId: 'worker1',
          success: true,
          result: 'Already done',
          completedAt: Date.now(),
        },
      ],
    });

    const wrappedAgent = wrapReActAgent('worker1', mockReActAgent);
    const result = await wrappedAgent(state);

    expect(result).toMatchObject({
      completedTasks: [
        {
          assignmentId: activeAssignmentId,
          workerId: 'worker1',
          success: false,
          error: 'forced failure',
        },
      ],
      currentAgent: 'supervisor',
      status: 'routing',
    });
  });

  it('serializes structured non-string response content', async () => {
    const mockReActAgent = createMockReActAgent(async () => ({
      messages: [
        {
          content: [
            { type: 'text', text: 'Structured response' },
            { type: 'meta', source: 'tool-a' },
          ],
        },
      ],
      actions: [],
      iteration: 1,
    }));

    const wrappedAgent = wrapReActAgent('worker1', mockReActAgent);
    const result = await wrappedAgent(createWorkerState());
    const taskResult = result.completedTasks?.[0];

    expect(taskResult?.success).toBe(true);
    expect(taskResult?.result).toContain('Structured response');
    expect(taskResult?.result).toContain('"source":"tool-a"');
  });

  it('extracts unique tool names and iteration metadata', async () => {
    const mockReActAgent = createMockReActAgent(async () => ({
      messages: [{ content: 'Done' }],
      actions: [{ name: 'search' }, { name: 'search' }, { name: 'summarize' }],
      iteration: 3,
    }));

    const wrappedAgent = wrapReActAgent('worker1', mockReActAgent);
    const result = await wrappedAgent(createWorkerState());
    const taskResult = result.completedTasks?.[0];

    expect(taskResult?.metadata).toEqual({
      agent_type: 'react',
      iterations: 3,
      tools_used: ['search', 'summarize'],
    });
  });

  it('emits more error console output when verbose is enabled', async () => {
    const mockReActAgent = createMockReActAgent(async () => {
      throw new Error('forced failure');
    });

    const state = createWorkerState({
      activeAssignments: [
        {
          id: 'assignment-1',
          workerId: 'worker1',
          task: 'Fail task',
          priority: 5,
          assignedAt: Date.now(),
        },
      ],
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const nonVerboseAgent = wrapReActAgent('worker1', mockReActAgent, false);
    await nonVerboseAgent(state);
    const nonVerboseCalls = consoleErrorSpy.mock.calls.length;

    consoleErrorSpy.mockClear();

    const verboseAgent = wrapReActAgent('worker1', mockReActAgent, true);
    await verboseAgent(state);
    const verboseCalls = consoleErrorSpy.mock.calls.length;

    consoleErrorSpy.mockRestore();

    expect(verboseCalls).toBeGreaterThan(nonVerboseCalls);
  });
});
