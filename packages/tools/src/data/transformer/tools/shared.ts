/**
 * Shared helpers for transformer tools.
 */

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

export function getNestedValue(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[key];
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
