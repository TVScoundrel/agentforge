import { HumanMessage } from '@langchain/core/messages';
import { vi } from 'vitest';
import type { MultiAgentStateType } from '../../../src/multi-agent/state.js';

export interface MockReActAgent {
  invoke: ReturnType<typeof vi.fn>;
  stream?: ReturnType<typeof vi.fn>;
}

export function createMockReActAgent(
  invokeImpl: Parameters<typeof vi.fn>[0]
): MockReActAgent {
  return {
    invoke: vi.fn(invokeImpl),
    stream: vi.fn(),
  };
}

export function createWorkerState(
  overrides: Partial<MultiAgentStateType> = {}
): MultiAgentStateType {
  return {
    input: 'Test input',
    messages: [],
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
        task: 'Analyze customer feedback data',
        priority: 5,
        assignedAt: Date.now() - 1000,
      },
    ],
    completedTasks: [],
    handoffs: [],
    status: 'executing',
    iteration: 1,
    maxIterations: 10,
    response: '',
    ...overrides,
  };
}

export function createHumanMessageResponse(content: string): { messages: HumanMessage[]; response: string } {
  return {
    messages: [new HumanMessage(content)],
    response: content,
  };
}
