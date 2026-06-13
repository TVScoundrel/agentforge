import type { BaseChannel } from '@langchain/langgraph';
import type { ZodType, ZodTypeAny, ZodTypeDef, output as ZodOutput } from 'zod';

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

export type StateChannelConfigLike = {
  schema?: ZodTypeAny;
  reducer?: (left: never, right: never) => unknown;
  default?: () => unknown;
  description?: string;
};

export type StateConfigMap = Record<string, StateChannelConfigLike>;

type IsExact<TLeft, TRight> =
  [TLeft] extends [TRight] ? ([TRight] extends [TLeft] ? true : false) : false;

type HasReducer<TChannel extends StateChannelConfigLike> =
  TChannel extends { reducer: (left: unknown, right: unknown) => unknown } ? true : false;

type SchemaValue<TChannel extends StateChannelConfigLike> =
  TChannel extends { schema: infer TSchema extends ZodTypeAny } ? ZodOutput<TSchema> : never;

type DefaultValue<TChannel extends StateChannelConfigLike> =
  TChannel extends { default: () => infer TValue } ? TValue : never;

type ReducerValue<TChannel extends StateChannelConfigLike> =
  TChannel extends { reducer: (left: infer TValue, right: unknown) => infer TResult }
    ? IsExact<TValue, TResult> extends true
      ? TValue
      : never
    : never;

type ReducerUpdate<TChannel extends StateChannelConfigLike> =
  TChannel extends { reducer: (left: unknown, right: infer TUpdate) => unknown } ? TUpdate : never;

export type ChannelValue<TChannel extends StateChannelConfigLike> =
  HasReducer<TChannel> extends true
    ? ReducerValue<TChannel>
    : [SchemaValue<TChannel>] extends [never]
      ? [DefaultValue<TChannel>] extends [never]
        ? unknown
        : DefaultValue<TChannel>
      : SchemaValue<TChannel>;

export type ChannelUpdate<TChannel extends StateChannelConfigLike> =
  HasReducer<TChannel> extends true ? ReducerUpdate<TChannel> : ChannelValue<TChannel>;

type SchemaMatchesValue<TChannel extends StateChannelConfigLike> =
  [SchemaValue<TChannel>] extends [never]
    ? true
    : [ChannelValue<TChannel>] extends [SchemaValue<TChannel>]
      ? true
      : false;

type DefaultMatchesValue<TChannel extends StateChannelConfigLike> =
  [DefaultValue<TChannel>] extends [never]
    ? true
    : [DefaultValue<TChannel>] extends [ChannelValue<TChannel>]
      ? true
      : false;

type ValidStateChannel<TChannel extends StateChannelConfigLike> =
  HasReducer<TChannel> extends true
    ? [ChannelValue<TChannel>] extends [never]
      ? never
      : SchemaMatchesValue<TChannel> extends true
        ? DefaultMatchesValue<TChannel> extends true
          ? TChannel
          : never
        : never
    : TChannel;

export type ValidStateConfig<TConfig extends StateConfigMap> = {
  [K in keyof TConfig]: ValidStateChannel<TConfig[K]>;
};

export type StateShape<TConfig extends StateConfigMap> = {
  [K in keyof TConfig]: ChannelValue<TConfig[K]>;
};

export type StateUpdateShape<TConfig extends StateConfigMap> = {
  [K in keyof TConfig]?: ChannelUpdate<TConfig[K]>;
};

export type StateChannelDefinition<TChannel extends StateChannelConfigLike> = BaseChannel<
  ChannelValue<TChannel>,
  ChannelUpdate<TChannel>
>;

export type StateAnnotationDefinition<TConfig extends StateConfigMap> = {
  [K in keyof TConfig]: StateChannelDefinition<TConfig[K]>;
};

type DefaultedKeys<TConfig extends StateConfigMap> = {
  [K in keyof TConfig]-?: TConfig[K] extends { default: () => ChannelValue<TConfig[K]> } ? K : never;
}[keyof TConfig];

type InputStateKeys<TConfig extends StateConfigMap, TState> = Extract<keyof TConfig, keyof TState>;

export type ValidatedState<
  TConfig extends StateConfigMap,
  TState extends Partial<Record<keyof TConfig, unknown>>,
> = {
  [K in InputStateKeys<TConfig, TState> | DefaultedKeys<TConfig>]: ChannelValue<TConfig[K]>;
};
