import type { ReActResultShape } from './utils-shared.js';
import {
  getModelResponseText,
  getModelResponseTextParts,
  stringifyModelResponseContent,
} from '../shared/model-response-content.js';

function getWrappedResponseContent(content: unknown): string | undefined {
  if (content === null || content === undefined) {
    return undefined;
  }

  const text = getModelResponseText(content);
  if (text !== undefined) {
    return text.length > 0 ? text : undefined;
  }

  if (Array.isArray(content)) {
    const parts = content
      .map((part): string => {
        const partText = getModelResponseTextParts([part])[0];
        if (partText !== undefined && partText.length > 0) {
          return partText;
        }
        try {
          return stringifyModelResponseContent(part) as string;
        } catch {
          return String(part);
        }
      })
      .filter((part) => part.length > 0);

    return parts.length > 0 ? parts.join('\n') : undefined;
  }

  try {
    const serialized = stringifyModelResponseContent(content);
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
  const serialized = getWrappedResponseContent(lastMessage?.content);
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
