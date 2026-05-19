import type { MultiAgentStateType } from '../state.js';

export function getAvailableWorkerIds(state: MultiAgentStateType): string[] {
  return Object.entries(state.workers)
    .filter(([_, caps]) => caps.available)
    .map(([id]) => id);
}

export function getTaskContent(state: MultiAgentStateType): string {
  const lastMessage = state.messages[state.messages.length - 1];
  return String(lastMessage?.content || state.input);
}
