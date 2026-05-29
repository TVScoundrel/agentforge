import type { ReflectionStateType } from './state.js';

export function createFinisherNode() {
  return async (state: ReflectionStateType): Promise<Partial<ReflectionStateType>> => ({
    status: 'completed' as const,
    response: state.currentResponse,
  });
}
