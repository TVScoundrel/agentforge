/**
 * Streaming SELECT executor for large result sets.
 * @module query/stream-executor
 */

import { Readable } from 'node:stream';
import { createLogger } from '@agentforge/core';
import type { ConnectionManager } from '../connection/connection-manager.js';
import { buildSelectQuery, type SelectQueryInput } from './query-builder.js';

const logger = createLogger('agentforge:tools:data:relational:stream');

const DEFAULT_CHUNK_SIZE = 100;
const MAX_CHUNK_SIZE = 5000;
const DEFAULT_SAMPLE_SIZE = 50;

/**
 * Memory usage information captured during streaming execution.
 */
export interface StreamingMemoryUsage {
  startHeapUsed: number;
  peakHeapUsed: number;
  endHeapUsed: number;
  deltaHeapUsed: number;
}

/**
 * One streamed chunk payload.
 */
export interface StreamingSelectChunk {
  chunkIndex: number;
  offset: number;
  rows: unknown[];
}

/**
 * Streaming execution options.
 */
export interface StreamingSelectOptions {
  chunkSize?: number;
  maxRows?: number;
  sampleSize?: number;
  collectAllRows?: boolean;
  signal?: AbortSignal;
  onChunk?: (chunk: StreamingSelectChunk) => Promise<void> | void;
}

/**
 * Streaming execution result.
 */
export interface StreamingSelectResult {
  rows: unknown[];
  rowCount: number;
  chunkCount: number;
  executionTime: number;
  cancelled: boolean;
  memoryUsage: StreamingMemoryUsage;
}

/**
 * Optional benchmark result comparing regular vs streaming SELECT execution.
 */
export interface StreamingBenchmarkResult {
  nonStreamingExecutionTime: number;
  nonStreamingPeakHeapUsed: number;
  streamingExecutionTime: number;
  streamingPeakHeapUsed: number;
  memorySavedBytes: number;
  memorySavedPercent: number;
}

function normalizeBoundedInt(
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

function normalizePositiveInt(
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

function extractRows(result: unknown): unknown[] {
  if (Array.isArray(result)) {
    return result;
  }

  return (result as { rows?: unknown[] }).rows ?? [];
}

function isCancelledError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Stream cancelled by caller');
}

function resolveTotalRowsLimit(input: SelectQueryInput, options: StreamingSelectOptions): number | undefined {
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

/**
 * Yield SELECT rows chunk-by-chunk using LIMIT/OFFSET pagination.
 */
export async function* streamSelectChunks(
  manager: ConnectionManager,
  input: SelectQueryInput,
  options: StreamingSelectOptions = {}
): AsyncGenerator<StreamingSelectChunk> {
  const chunkSize = normalizeBoundedInt(options.chunkSize, 'chunkSize', 1, MAX_CHUNK_SIZE, DEFAULT_CHUNK_SIZE);
  const baseOffset = input.offset ?? 0;
  const totalRowsLimit = resolveTotalRowsLimit(input, options);

  let processedRows = 0;
  let chunkIndex = 0;

  while (true) {
    if (options.signal?.aborted) {
      throw new Error('Stream cancelled by caller.');
    }

    const remainingRows = totalRowsLimit === undefined ? chunkSize : totalRowsLimit - processedRows;
    if (remainingRows <= 0) {
      return;
    }

    const pageLimit = Math.min(chunkSize, remainingRows);
    const pageOffset = baseOffset + processedRows;

    const query = buildSelectQuery({
      ...input,
      limit: pageLimit,
      offset: pageOffset,
    });

    const result = await manager.execute(query);
    const rows = extractRows(result);

    if (rows.length === 0) {
      return;
    }

    yield {
      chunkIndex,
      offset: pageOffset,
      rows,
    };

    processedRows += rows.length;
    chunkIndex += 1;

    if (rows.length < pageLimit) {
      return;
    }
  }
}

/**
 * Create a Node.js Readable stream that emits SELECT chunks in object mode.
 */
export function createSelectReadableStream(
  manager: ConnectionManager,
  input: SelectQueryInput,
  options: StreamingSelectOptions = {}
): Readable {
  return Readable.from(streamSelectChunks(manager, input, options), {
    objectMode: true,
    highWaterMark: 1,
  });
}

/**
 * Execute a SELECT query in streaming mode while tracking memory usage.
 */
export async function executeStreamingSelect(
  manager: ConnectionManager,
  input: SelectQueryInput,
  options: StreamingSelectOptions = {}
): Promise<StreamingSelectResult> {
  const startTime = Date.now();
  const collectedRows: unknown[] = [];

  const sampleSize = normalizeBoundedInt(
    options.sampleSize,
    'sampleSize',
    0,
    5000,
    DEFAULT_SAMPLE_SIZE
  );

  let rowCount = 0;
  let chunkCount = 0;
  let cancelled = false;

  const startHeapUsed = process.memoryUsage().heapUsed;
  let peakHeapUsed = startHeapUsed;

  const stream = createSelectReadableStream(manager, input, options);
  const abortHandler = () => {
    stream.destroy(new Error('Stream cancelled by caller.'));
  };

  options.signal?.addEventListener('abort', abortHandler, { once: true });

  try {
    for await (const chunk of stream as AsyncIterable<StreamingSelectChunk>) {
      chunkCount += 1;
      rowCount += chunk.rows.length;

      if (options.collectAllRows) {
        collectedRows.push(...chunk.rows);
      } else if (sampleSize > 0 && collectedRows.length < sampleSize) {
        const remaining = sampleSize - collectedRows.length;
        collectedRows.push(...chunk.rows.slice(0, remaining));
      }

      if (options.onChunk) {
        await options.onChunk(chunk);
      }

      peakHeapUsed = Math.max(peakHeapUsed, process.memoryUsage().heapUsed);
    }
  } catch (error) {
    if (isCancelledError(error)) {
      cancelled = true;
    } else {
      throw error;
    }
  } finally {
    options.signal?.removeEventListener('abort', abortHandler);
  }

  const endHeapUsed = process.memoryUsage().heapUsed;
  peakHeapUsed = Math.max(peakHeapUsed, endHeapUsed);

  const executionTime = Date.now() - startTime;

  logger.debug('Streaming SELECT execution completed', {
    table: input.table,
    vendor: input.vendor,
    chunkCount,
    rowCount,
    executionTime,
    cancelled,
    chunkSize: options.chunkSize ?? DEFAULT_CHUNK_SIZE,
  });

  return {
    rows: collectedRows,
    rowCount,
    chunkCount,
    executionTime,
    cancelled,
    memoryUsage: {
      startHeapUsed,
      peakHeapUsed,
      endHeapUsed,
      deltaHeapUsed: endHeapUsed - startHeapUsed,
    },
  };
}

/**
 * Benchmark memory usage of regular SELECT execution vs streaming execution.
 */
export async function benchmarkStreamingSelectMemory(
  manager: ConnectionManager,
  input: SelectQueryInput,
  options: StreamingSelectOptions = {}
): Promise<StreamingBenchmarkResult> {
  const nonStreamingStartHeapUsed = process.memoryUsage().heapUsed;
  const nonStreamingStartTime = Date.now();

  const nonStreamingResult = await manager.execute(buildSelectQuery(input));
  const nonStreamingRows = extractRows(nonStreamingResult);

  const nonStreamingExecutionTime = Date.now() - nonStreamingStartTime;
  const nonStreamingPeakHeapUsed = Math.max(nonStreamingStartHeapUsed, process.memoryUsage().heapUsed);

  const streamingResult = await executeStreamingSelect(manager, input, {
    ...options,
    collectAllRows: false,
    sampleSize: 0,
  });

  const memorySavedBytes = Math.max(
    nonStreamingPeakHeapUsed - streamingResult.memoryUsage.peakHeapUsed,
    0
  );

  const memorySavedPercent = nonStreamingPeakHeapUsed > 0
    ? (memorySavedBytes / nonStreamingPeakHeapUsed) * 100
    : 0;

  logger.debug('Streaming benchmark completed', {
    table: input.table,
    vendor: input.vendor,
    nonStreamingRows: nonStreamingRows.length,
    nonStreamingExecutionTime,
    streamingExecutionTime: streamingResult.executionTime,
    memorySavedBytes,
    memorySavedPercent,
  });

  return {
    nonStreamingExecutionTime,
    nonStreamingPeakHeapUsed,
    streamingExecutionTime: streamingResult.executionTime,
    streamingPeakHeapUsed: streamingResult.memoryUsage.peakHeapUsed,
    memorySavedBytes,
    memorySavedPercent,
  };
}
