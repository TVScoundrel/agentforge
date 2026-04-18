import type { MessageContent } from '@langchain/core/messages';

function stringifyWithFallback(value: unknown, fallbackLabel: string): string {
  try {
    const serialized = JSON.stringify(value);
    return serialized ?? 'null';
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return `[${fallbackLabel}: ${reason}]`;
  }
}

export function toJsonSafeValue(value: unknown): unknown {
  try {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      return '[Unserializable step result: JSON.stringify returned undefined]';
    }

    return JSON.parse(serialized) as unknown;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return `[Unserializable step result: ${reason}]`;
  }
}

export function normalizeModelContent(content: MessageContent): string {
  if (typeof content === 'string') {
    return content;
  }

  return stringifyWithFallback(content, 'Unserializable model content');
}

export function serializePlanExecuteResult(result: unknown): string {
  return stringifyWithFallback(result, 'Unserializable step result');
}
