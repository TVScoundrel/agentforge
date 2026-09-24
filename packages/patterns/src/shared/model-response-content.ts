/** Return Model Response Content only when the model supplied original text. */
export function getModelResponseText(content: unknown): string | undefined {
  return typeof content === 'string' ? content : undefined;
}

/** Extract the textual values carried by structured Model Response Content parts. */
export function getModelResponseTextParts(content: unknown): string[] {
  if (!Array.isArray(content)) {
    return [];
  }

  return content.flatMap((part) => {
    const text = getModelResponseText(part);
    if (text !== undefined) {
      return [text];
    }

    if (
      typeof part === 'object' &&
      part !== null &&
      'text' in part &&
      typeof part.text === 'string'
    ) {
      return [part.text];
    }

    return [];
  });
}

/**
 * Preserve textual Model Response Content and serialize every other value with JSON semantics.
 */
export function stringifyModelResponseContent(content: unknown): string | undefined {
  return getModelResponseText(content) ?? JSON.stringify(content);
}

/** Serialize Model Response Content while retaining a textual representation of JSON failures. */
export function stringifyModelResponseContentSafely(content: unknown): string {
  try {
    return stringifyModelResponseContent(content) ?? 'undefined';
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return `[Unserializable model content: ${reason}]`;
  }
}
