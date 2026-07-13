import type { NodeFunction } from '../../types.js';

export interface TestState {
  value: number;
  result?: string;
}

export function createTrackedNode(): {
  getCallCount: () => number;
  node: NodeFunction<TestState>;
} {
  let callCount = 0;

  return {
    getCallCount: () => callCount,
    node: async (state: TestState) => {
      callCount++;
      return { ...state, result: `processed-${state.value}` };
    },
  };
}
