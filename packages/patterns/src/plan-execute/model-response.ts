import type { MessageContent } from '@langchain/core/messages';

function hasTextContentPart(value: unknown): value is { text: string } {
  return typeof value === 'object'
    && value !== null
    && 'text' in value
    && typeof (value as { text?: unknown }).text === 'string';
}

function stringifyModelContent(value: unknown): string {
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? 'undefined' : serialized;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return `[Unserializable model content: ${reason}]`;
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

  return stringifyModelContent(content);
}

export function parseModelResponse<T>(content: MessageContent, context: string): T {
  const normalized = normalizeModelContent(content);

  try {
    return JSON.parse(normalized) as T;
  } catch (parseError) {
    throw new Error(`Failed to parse ${context} from LLM response: ${parseError}`);
  }
}
