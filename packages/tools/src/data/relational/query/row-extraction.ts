export function extractRows<Row = unknown>(result: unknown): Row[] {
  if (Array.isArray(result)) {
    return result as Row[];
  }

  if (
    result &&
    typeof result === 'object' &&
    Array.isArray((result as { rows?: unknown[] }).rows)
  ) {
    return (result as { rows: Row[] }).rows;
  }

  return [];
}
