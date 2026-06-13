import { entriesOf, hasOwnProperty, setStateValue } from './state-shared.js';
import type { StateConfigMap, StateShape, ValidatedState } from './state-types.js';

/**
 * Validate state against Zod schemas
 */
export function validateState<
  TConfig extends StateConfigMap,
  TState extends Partial<Record<keyof TConfig, unknown>>,
>(state: TState, config: TConfig): ValidatedState<TConfig, TState> {
  const validated = {} as Partial<StateShape<TConfig>>;

  for (const [key, channelConfig] of entriesOf(config)) {
    if (channelConfig.schema && hasOwnProperty(state, key)) {
      setStateValue(
        validated,
        key,
        channelConfig.schema.parse(state[key]) as StateShape<TConfig>[typeof key]
      );
    } else if (hasOwnProperty(state, key)) {
      setStateValue(validated, key, state[key] as StateShape<TConfig>[typeof key]);
    } else if (channelConfig.default) {
      setStateValue(validated, key, channelConfig.default() as StateShape<TConfig>[typeof key]);
    }
  }

  return validated as ValidatedState<TConfig, TState>;
}
