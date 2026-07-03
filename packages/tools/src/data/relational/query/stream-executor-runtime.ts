export function isCancelledError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Stream cancelled by caller');
}
