/**
 * LangGraph State Utilities
 *
 * Type-safe helpers for working with LangGraph state management.
 * These utilities wrap LangGraph's Annotation API to provide better TypeScript ergonomics.
 *
 * @module langgraph/state
 */

import { Annotation, type AnnotationRoot, type BaseChannel } from '@langchain/langgraph';
import type { ZodType, ZodTypeDef } from 'zod';

/**
 * State channel configuration with optional Zod schema validation
 */
export interface StateChannelConfig<T = unknown, U = T> {
  /**
   * Optional Zod schema for runtime validation
   */
  schema?: ZodType<T, ZodTypeDef, unknown>;

  /**
   * Optional reducer function for aggregating updates
   */
  reducer?: (left: T, right: U) => T;

  /**
   * Optional default value factory
   */
  default?: () => T;

  /**
   * Description of this state channel (for documentation)
   */
  description?: string;
}

type StateChannelConfigLike = {
  schema?: ZodType<unknown, ZodTypeDef, unknown>;
  reducer?: (left: never, right: never) => unknown;
  default?: () => unknown;
  description?: string;
};

type StateConfigMap = Record<string, StateChannelConfigLike>;

type ChannelValue<TChannel extends StateChannelConfigLike> =
  TChannel extends StateChannelConfig<infer TValue, unknown> ? TValue : never;

type DeclaredChannelUpdate<TChannel extends StateChannelConfigLike> =
  TChannel extends StateChannelConfig<unknown, infer TUpdate> ? TUpdate : never;

type ChannelUpdate<TChannel extends StateChannelConfigLike> =
  TChannel extends { reducer: (left: never, right: never) => unknown }
    ? DeclaredChannelUpdate<TChannel>
    : ChannelValue<TChannel>;

type StateShape<TConfig extends StateConfigMap> = {
  [K in keyof TConfig]: ChannelValue<TConfig[K]>;
};

type StateUpdateShape<TConfig extends StateConfigMap> = {
  [K in keyof TConfig]?: ChannelUpdate<TConfig[K]>;
};

type StateChannelDefinition<TChannel extends StateChannelConfigLike> = BaseChannel<
  ChannelValue<TChannel>,
  ChannelUpdate<TChannel>
>;

type StateAnnotationDefinition<TConfig extends StateConfigMap> = {
  [K in keyof TConfig]: StateChannelDefinition<TConfig[K]>;
};

type DefaultedKeys<TConfig extends StateConfigMap> = {
  [K in keyof TConfig]-?: TConfig[K] extends { default: () => ChannelValue<TConfig[K]> } ? K : never;
}[keyof TConfig];

type InputStateKeys<TConfig extends StateConfigMap, TState> = Extract<keyof TConfig, keyof TState>;

type ValidatedState<
  TConfig extends StateConfigMap,
  TState extends Partial<Record<keyof TConfig, unknown>>,
> = {
  [K in InputStateKeys<TConfig, TState> | DefaultedKeys<TConfig>]: ChannelValue<TConfig[K]>;
};

function entriesOf<T extends Record<string, unknown>>(
  value: T
): Array<
  {
    [K in Extract<keyof T, string>]-?: [K, T[K]];
  }[Extract<keyof T, string>]
> {
  return Object.entries(value) as Array<
    {
      [K in Extract<keyof T, string>]-?: [K, T[K]];
    }[Extract<keyof T, string>]
  >;
}

function keysOf<T extends Record<string, unknown>>(value: T): Array<Extract<keyof T, string>> {
  return Object.keys(value) as Array<Extract<keyof T, string>>;
}

function hasOwnProperty<T extends object>(
  value: T,
  key: PropertyKey
): key is Extract<keyof T, string | number | symbol> {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function useLatestValue<TValue>(_left: TValue, right: TValue): TValue {
  return right;
}

function setStateValue<TConfig extends StateConfigMap, TKey extends keyof TConfig>(
  target: Partial<StateShape<TConfig>>,
  key: TKey,
  value: StateShape<TConfig>[TKey]
): void {
  (target as Partial<Record<keyof TConfig, StateShape<TConfig>[keyof TConfig]>>)[key] = value;
}

function setStateDefinitionValue<TConfig extends StateConfigMap, TKey extends keyof TConfig>(
  target: StateAnnotationDefinition<TConfig>,
  key: TKey,
  value: StateAnnotationDefinition<TConfig>[TKey]
): void {
  (target as Record<keyof TConfig, StateAnnotationDefinition<TConfig>[keyof TConfig]>)[key] = value;
}

function createChannel<TChannel extends StateChannelConfigLike>(
  channelConfig: TChannel
): StateChannelDefinition<TChannel> {
  if (channelConfig.reducer) {
    return Annotation<ChannelValue<TChannel>, ChannelUpdate<TChannel>>({
      reducer: channelConfig.reducer as (
        left: ChannelValue<TChannel>,
        right: ChannelUpdate<TChannel>
      ) => ChannelValue<TChannel>,
      default: channelConfig.default as (() => ChannelValue<TChannel>) | undefined,
    }) as StateChannelDefinition<TChannel>;
  }

  if (channelConfig.default) {
    return Annotation<ChannelValue<TChannel>, ChannelValue<TChannel>>({
      reducer: useLatestValue,
      default: channelConfig.default as () => ChannelValue<TChannel>,
    }) as StateChannelDefinition<TChannel>;
  }

  return Annotation<ChannelValue<TChannel>>() as StateChannelDefinition<TChannel>;
}

/**
 * Create a type-safe state annotation with optional Zod validation
 *
 * This is a thin wrapper around LangGraph's Annotation.Root that adds:
 * - Zod schema validation support
 * - Better TypeScript inference
 * - Documentation/description support
 *
 * @example
 * ```typescript
 * import { createStateAnnotation } from '@agentforge/core';
 * import { z } from 'zod';
 *
 * const AgentState = createStateAnnotation({
 *   messages: {
 *     schema: z.array(z.string()),
 *     reducer: (left, right) => [...left, ...right],
 *     default: () => [],
 *     description: 'Chat messages'
 *   },
 *   context: {
 *     schema: z.record(z.any()),
 *     default: () => ({}),
 *     description: 'Agent context'
 *   }
 * });
 *
 * type State = typeof AgentState.State;
 * ```
 */
export function createStateAnnotation<
  TConfig extends StateConfigMap
>(
  config: TConfig
): AnnotationRoot<StateAnnotationDefinition<TConfig>> {
  const stateDefinition = {} as StateAnnotationDefinition<TConfig>;

  for (const [key, channelConfig] of entriesOf(config)) {
    setStateDefinitionValue(
      stateDefinition,
      key,
      createChannel(channelConfig) as StateAnnotationDefinition<TConfig>[typeof key]
    );
  }

  return Annotation.Root(stateDefinition);
}

/**
 * Validate state against Zod schemas
 *
 * @param state - The state object to validate
 * @param config - The state channel configuration with schemas
 * @returns Validated state
 * @throws {z.ZodError} If validation fails
 *
 * @example
 * ```typescript
 * const config = {
 *   messages: { schema: z.array(z.string()) },
 *   count: { schema: z.number() }
 * };
 *
 * const validatedState = validateState(
 *   { messages: ['hello'], count: 42 },
 *   config
 * );
 * ```
 */
export function validateState<
  TConfig extends StateConfigMap,
  TState extends Partial<Record<keyof TConfig, unknown>>,
>(state: TState, config: TConfig): ValidatedState<TConfig, TState> {
  const validated = {} as Partial<StateShape<TConfig>>;

  for (const [key, channelConfig] of entriesOf(config)) {
    if (channelConfig.schema && hasOwnProperty(state, key)) {
      // Validate with Zod schema
      setStateValue(
        validated,
        key,
        channelConfig.schema.parse(state[key]) as StateShape<TConfig>[typeof key]
      );
    } else if (hasOwnProperty(state, key)) {
      // No schema, pass through
      setStateValue(validated, key, state[key] as StateShape<TConfig>[typeof key]);
    } else if (channelConfig.default) {
      // Use default if key missing
      setStateValue(validated, key, channelConfig.default() as StateShape<TConfig>[typeof key]);
    }
  }

  return validated as ValidatedState<TConfig, TState>;
}

/**
 * Merge state updates using configured reducers
 *
 * @param currentState - Current state
 * @param update - State update
 * @param config - State channel configuration
 * @returns Merged state
 *
 * @example
 * ```typescript
 * const config = {
 *   messages: {
 *     reducer: (left, right) => [...left, ...right]
 *   }
 * };
 *
 * const merged = mergeState(
 *   { messages: ['a', 'b'] },
 *   { messages: ['c'] },
 *   config
 * );
 * // Result: { messages: ['a', 'b', 'c'] }
 * ```
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
      // Apply reducer
      setStateValue(
        merged,
        key,
        reducer(
          merged[key] as ChannelValue<typeof channelConfig>,
          value as ChannelUpdate<typeof channelConfig>
        )
      );
    } else {
      // Simple replacement
      setStateValue(merged, key, value as StateShape<TConfig>[typeof key]);
    }
  }

  return merged;
}
