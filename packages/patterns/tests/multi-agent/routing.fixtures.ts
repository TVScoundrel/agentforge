import type { MultiAgentStateType } from '../../src/multi-agent/state.js';

export function createMockRoutingState(): MultiAgentStateType {
  return {
    input: 'Test task requiring research and analysis',
    messages: [{
      from: 'user',
      to: ['supervisor'],
      type: 'user_input',
      content: 'Test task requiring research and analysis',
      timestamp: Date.now(),
    }],
    workers: {
      researcher: {
        skills: ['research', 'analysis'],
        tools: ['search', 'scrape'],
        available: true,
        currentWorkload: 0,
      },
      writer: {
        skills: ['writing', 'editing'],
        tools: ['format'],
        available: true,
        currentWorkload: 2,
      },
      coder: {
        skills: ['coding', 'debugging'],
        tools: ['compiler', 'debugger'],
        available: true,
        currentWorkload: 1,
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
