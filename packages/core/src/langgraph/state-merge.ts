import { hasOwnProperty, keysOf, setStateValue } from './state-shared.js';
import type {
  ChannelUpdate,
  ChannelValue,
  StateConfigMap,
  StateShape,
  StateUpdateShape,
} from './state-types.js';

/**
 * Merge state updates using configured reducers
 */
export function mergeState<TConfig extends StateConfigMap>(
  currentState: Partial<StateShape<TConfig>>,
  update: StateUpdateShape<TConfig>,
  config: TConfig
): Partial<StateShape<TConfig>> {
  const merged = { ...currentState };

  for (const key of keysOf(update)) {
    const value = update[key];
    const channelConfig = config[key];
    const reducer = channelConfig?.reducer as
      | ((
          left: ChannelValue<typeof channelConfig>,
          right: ChannelUpdate<typeof channelConfig>
        ) => StateShape<TConfig>[typeof key])
      | undefined;

    if (reducer && hasOwnProperty(merged, key)) {
      setStateValue(
        merged,
        key,
        reducer(
          merged[key] as ChannelValue<typeof channelConfig>,
          value as ChannelUpdate<typeof channelConfig>
        )
      );
    } else {
      setStateValue(merged, key, value as StateShape<TConfig>[typeof key]);
    }
  }

  return merged;
}
