/**
 * Shared option validation and chunking helpers for batch execution.
 */

import type {
  BatchExecutionOptions,
  ResolvedBatchExecutionOptions,
} from './batch-executor-types.js';

/** Default number of items processed per batch chunk. */
export const DEFAULT_BATCH_SIZE = 100;
/** Maximum allowed batch size to prevent memory exhaustion. */
export const MAX_BATCH_SIZE = 5000;
export const MAX_RETRY_ATTEMPTS = 5;
export const MAX_RETRY_DELAY_MS = 60_000;

function normalizePositiveInt(
  value: number | undefined,
  fieldName: string,
  min: number,
  max: number,
  fallback: number
): number {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }

  return value;
}

export function resolveBatchExecutionOptions(
  options: BatchExecutionOptions
): ResolvedBatchExecutionOptions {
  return {
    batchSize: normalizePositiveInt(options.batchSize, 'batchSize', 1, MAX_BATCH_SIZE, DEFAULT_BATCH_SIZE),
    continueOnError: options.continueOnError ?? true,
    maxRetries: normalizePositiveInt(options.maxRetries, 'maxRetries', 0, MAX_RETRY_ATTEMPTS, 0),
    retryDelayMs: normalizePositiveInt(options.retryDelayMs, 'retryDelayMs', 0, MAX_RETRY_DELAY_MS, 0),
    onProgress: options.onProgress,
  };
}

export function chunkBatchItems<TItem>(items: TItem[], chunkSize: number): TItem[][] {
  if (items.length === 0) {
    return [];
  }

  const chunks: TItem[][] = [];

  for (let start = 0; start < items.length; start += chunkSize) {
    chunks.push(items.slice(start, start + chunkSize));
  }

  return chunks;
}
