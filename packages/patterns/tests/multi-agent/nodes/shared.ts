import type { MultiAgentStateType } from '../../../src/multi-agent/state.js';

export class GraphInterrupt extends Error {}

export function createMockState(): MultiAgentStateType {
  return {
    input: 'Test task',
    messages: [
      {
        from: 'user',
        to: ['supervisor'],
        type: 'user_input',
        content: 'Test task',
        timestamp: Date.now(),
      },
    ],
    workers: {
      worker1: {
        skills: ['skill1'],
        tools: ['tool1'],
        available: true,
        currentWorkload: 0,
      },
      worker2: {
        skills: ['skill2'],
        tools: ['tool2'],
        available: true,
        currentWorkload: 0,
      },
    },
    currentAgent: 'supervisor',
    routingHistory: [],
    activeAssignments: [],
    completedTasks: [],
    handoffs: [],
    status: 'routing',
    iteration: 0,
    maxIterations: 10,
    response: '',
  };
}
