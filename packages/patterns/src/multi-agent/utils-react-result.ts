import type { ReActResultShape } from './utils-shared.js';
import { isRecord } from './utils-shared.js';

function safeSerializeContent(content: unknown): string | undefined {
  if (content === null || content === undefined) {
    return undefined;
  }

  if (typeof content === 'string') {
    return content.length > 0 ? content : undefined;
  }

  if (Array.isArray(content)) {
    const parts = content
      .map((part): string => {
        if (typeof part === 'string') {
          return part;
        }
        if (isRecord(part) && typeof part.text === 'string' && part.text.length > 0) {
          return part.text;
        }
        try {
          return JSON.stringify(part);
        } catch {
          return String(part);
        }
      })
      .filter((part) => part.length > 0);

    return parts.length > 0 ? parts.join('\n') : undefined;
  }

  try {
    const serialized = JSON.stringify(content);
    if (typeof serialized === 'string' && serialized.length > 0 && serialized !== 'null') {
      return serialized;
    }
  } catch {
    // Fallback handled below.
  }

  const fallback = String(content);
  return fallback.length > 0 ? fallback : undefined;
}

export function extractResponse(resultShape: ReActResultShape): string {
  const lastMessage = resultShape.messages?.[resultShape.messages.length - 1];
  const serialized = safeSerializeContent(lastMessage?.content);
  return serialized ?? 'No response';
}

export function extractToolsUsed(resultShape: ReActResultShape): string[] {
  const names =
    resultShape.actions
      ?.map((action) => action.name)
      .filter((name): name is string => typeof name === 'string' && name.length > 0) ?? [];

  return [...new Set(names)];
}

export function extractIteration(resultShape: ReActResultShape): number {
  return typeof resultShape.iteration === 'number' && Number.isFinite(resultShape.iteration)
    ? resultShape.iteration
    : 0;
}
