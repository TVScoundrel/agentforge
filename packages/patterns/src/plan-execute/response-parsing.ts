import {
  getModelResponseText,
  getModelResponseTextParts,
  stringifyModelResponseContentSafely,
} from '../shared/model-response-content.js';

export function parseJsonModelResponse<T>(content: unknown, context: string): T {
  const text = getModelResponseText(content);
  const textParts = Array.isArray(content)
    ? getModelResponseTextParts(content.filter((part) => typeof part !== 'string')).filter(
        (part) => part.length > 0
      )
    : [];
  const representedContent =
    text ??
    (textParts.length > 0 ? textParts.join('\n') : stringifyModelResponseContentSafely(content));

  try {
    return JSON.parse(representedContent) as T;
  } catch (parseError) {
    throw new Error(`Failed to parse ${context} from LLM response: ${parseError}`);
  }
}
