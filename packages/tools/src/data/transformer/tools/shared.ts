/**
 * Shared helpers for transformer tools.
 */

type UnknownRecord = Record<string, unknown>;

function isIndexable(value: unknown): value is object | ((...args: never[]) => unknown) {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

export function getNestedValue(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!isIndexable(current)) {
      return undefined;
    }

    return Reflect.get(current, key);
  }, value);
}

export function pickObjectProperties(
  source: UnknownRecord,
  properties: readonly string[]
): UnknownRecord {
  const picked: UnknownRecord = {};

  for (const property of properties) {
    if (property in source) {
      picked[property] = source[property];
    }
  }

  return picked;
}

export function omitObjectProperties(
  source: UnknownRecord,
  properties: readonly string[]
): UnknownRecord {
  const omitted: UnknownRecord = { ...source };

  for (const property of properties) {
    delete omitted[property];
  }

  return omitted;
}
