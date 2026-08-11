export { normalizeModelContent } from './model-response.js';

function stringifyWithFallback(value: unknown, fallbackLabel: string): string {
  try {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      return 'undefined';
    }

    return serialized;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return `[${fallbackLabel}: ${reason}]`;
  }
}

export function toJsonSafeValue(value: unknown): unknown {
  try {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      return undefined;
    }

    return JSON.parse(serialized) as unknown;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return `[Unserializable step result: ${reason}]`;
  }
}

export function serializePlanExecuteResult(result: unknown): string {
  return stringifyWithFallback(result, 'Unserializable step result');
}
