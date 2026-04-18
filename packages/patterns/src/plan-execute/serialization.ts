import type { MessageContent } from '@langchain/core/messages';

function stringifyWithFallback(value: unknown, fallbackLabel: string): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return `[${fallbackLabel}: ${reason}]`;
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
