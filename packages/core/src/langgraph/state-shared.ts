import type {
  StateAnnotationDefinition,
  StateConfigMap,
  StateShape,
} from './state-types.js';

export function entriesOf<T extends Record<string, unknown>>(
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

export function keysOf<T extends Record<string, unknown>>(value: T): Array<Extract<keyof T, string>> {
  return Object.keys(value) as Array<Extract<keyof T, string>>;
}

export function hasOwnProperty<T extends object>(
  value: T,
  key: PropertyKey
): key is Extract<keyof T, string | number | symbol> {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function useLatestValue<TValue>(_left: TValue, right: TValue): TValue {
  return right;
}

export function setStateValue<TConfig extends StateConfigMap, TKey extends keyof TConfig>(
  target: Partial<StateShape<TConfig>>,
  key: TKey,
  value: StateShape<TConfig>[TKey]
): void {
  (target as Partial<Record<keyof TConfig, StateShape<TConfig>[keyof TConfig]>>)[key] = value;
}

export function setStateDefinitionValue<TConfig extends StateConfigMap, TKey extends keyof TConfig>(
  target: StateAnnotationDefinition<TConfig>,
  key: TKey,
  value: StateAnnotationDefinition<TConfig>[TKey]
): void {
  (target as Record<keyof TConfig, StateAnnotationDefinition<TConfig>[keyof TConfig]>)[key] = value;
}
