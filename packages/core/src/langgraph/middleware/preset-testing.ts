import type { TestingPresetNode, TestingPresetOptions } from './preset-types.js';
import type { NodeFunction } from './types.js';

/**
 * Testing preset for unit and integration tests.
 */
export function testing<State>(
  node: NodeFunction<State>,
  options: TestingPresetOptions<State>
): TestingPresetNode<State> {
  const {
    mockResponse,
    simulateError,
    delay = 0,
    trackInvocations = false,
  } = options;

  const invocations: State[] = [];
  const wrappedNode = async (state: State) => {
    if (trackInvocations) {
      invocations.push(state);
    }

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (simulateError) {
      throw simulateError;
    }

    if (mockResponse) {
      return { ...state, ...mockResponse };
    }

    return await Promise.resolve(node(state));
  };

  const testingNode = wrappedNode as TestingPresetNode<State>;
  testingNode.invocations = invocations;
  return testingNode;
}
