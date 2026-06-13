import type { NodeFunction } from '../../types.js';

export interface TestState {
  value: number;
  result?: string;
}

export function createTestNode(): NodeFunction<TestState> {
  return async (state: TestState) => ({
    ...state,
    result: `processed-${state.value}`,
  });
}
