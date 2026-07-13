import type { NodeFunction } from './types.js';

type NodeResult<State> = State | Partial<State>;

/**
 * Create a stable wrapper for controller-backed middleware without repeating
 * the same "derive control input -> execute wrapped node" flow.
 */
export function createControlledNode<State, ControlValue>(
  node: NodeFunction<State>,
  resolveControlValue: (state: State) => ControlValue,
  executeWithController: (
    state: State,
    controlValue: ControlValue,
    executor: (state: State) => Promise<NodeResult<State>>
  ) => Promise<NodeResult<State>>
): NodeFunction<State> {
  return async (state: State): Promise<NodeResult<State>> => {
    const controlValue = resolveControlValue(state);
    return executeWithController(state, controlValue, (nextState: State) =>
      Promise.resolve(node(nextState))
    );
  };
}
