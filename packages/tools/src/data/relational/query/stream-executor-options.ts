import type { SelectQueryInput } from './query-builder.js';
import {
  DEFAULT_CHUNK_SIZE,
  DEFAULT_SAMPLE_SIZE,
  MAX_CHUNK_SIZE,
  MAX_SAMPLE_SIZE,
  type StreamingSelectOptions,
} from './stream-executor-types.js';

export function normalizeBoundedInt(
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

export function normalizePositiveInt(
  value: number | undefined,
  fieldName: string,
  fallback?: number
): number | undefined {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  return value;
}

export function resolveChunkSize(options: StreamingSelectOptions): number {
  return normalizeBoundedInt(options.chunkSize, 'chunkSize', 1, MAX_CHUNK_SIZE, DEFAULT_CHUNK_SIZE);
}

export function resolveSampleSize(options: StreamingSelectOptions): number {
  return normalizeBoundedInt(
    options.sampleSize,
    'sampleSize',
    0,
    MAX_SAMPLE_SIZE,
    DEFAULT_SAMPLE_SIZE
  );
}

export function resolveTotalRowsLimit(
  input: SelectQueryInput,
  options: StreamingSelectOptions
): number | undefined {
  const inputLimit = normalizePositiveInt(input.limit, 'limit');
  const maxRows = normalizePositiveInt(options.maxRows, 'maxRows');

  if (inputLimit === undefined) {
    return maxRows;
  }

  if (maxRows === undefined) {
    return inputLimit;
  }

  return Math.min(inputLimit, maxRows);
}
