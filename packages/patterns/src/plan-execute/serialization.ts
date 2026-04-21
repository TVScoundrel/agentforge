import type { MessageContent } from '@langchain/core/messages';

function hasTextContentPart(value: unknown): value is { text: string } {
  return typeof value === 'object'
    && value !== null
    && 'text' in value
    && typeof (value as { text?: unknown }).text === 'string';
}

function stringifyWithFallback(value: unknown, fallbackLabel: string): string {
  try {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      return `[${fallbackLabel}: JSON.stringify returned undefined]`;
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

  if (Array.isArray(content)) {
    const textParts: string[] = [];

    for (const part of content) {
      if (hasTextContentPart(part) && part.text.length > 0) {
        textParts.push(part.text);
      }
    }

    if (textParts.length > 0) {
      return textParts.join('\n');
    }
  }

  return stringifyWithFallback(content, 'Unserializable model content');
}

export function serializePlanExecuteResult(result: unknown): string {
  return stringifyWithFallback(result, 'Unserializable step result');
}
