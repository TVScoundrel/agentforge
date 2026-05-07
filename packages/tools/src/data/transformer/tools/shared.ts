/**
 * Shared helpers for transformer tools.
 */

type UnknownRecord = Record<string, unknown>;
type RelationalOperand = string | number | bigint | boolean;

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

// Mirror the prior JavaScript relational-operator behavior for heterogeneous
// transformer inputs while keeping strict TypeScript call sites unknown-first.
export function compareRelationalValues(left: unknown, right: unknown): number {
  const leftOperand = left as RelationalOperand;
  const rightOperand = right as RelationalOperand;

  if (leftOperand < rightOperand) {
    return -1;
  }

  if (leftOperand > rightOperand) {
    return 1;
  }

  return 0;
}

export function pickObjectProperties(
  source: UnknownRecord,
  properties: readonly string[]
): UnknownRecord {
  const picked: UnknownRecord = {};

  for (const property of properties) {
    if (property in source) {
      Object.defineProperty(picked, property, {
        value: source[property],
        enumerable: true,
        configurable: true,
        writable: true,
      });
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
