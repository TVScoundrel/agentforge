import type { MultiAgentStateType } from '../../src/multi-agent/state.js';

export function createRoutingUserMessage(content: string) {
  return {
    id: `msg-${content.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user-input'}`,
    from: 'user',
    to: ['supervisor'],
    type: 'user_input' as const,
    content,
    timestamp: Date.now(),
  };
}

export function createMockRoutingState(): MultiAgentStateType {
  return {
    input: 'Test task requiring research and analysis',
    messages: [createRoutingUserMessage('Test task requiring research and analysis')],
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
