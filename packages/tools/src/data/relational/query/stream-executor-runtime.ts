export function extractRows(result: unknown): unknown[] {
  if (Array.isArray(result)) {
    return result;
  }

  return (result as { rows?: unknown[] }).rows ?? [];
}

export function isCancelledError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Stream cancelled by caller');
}
