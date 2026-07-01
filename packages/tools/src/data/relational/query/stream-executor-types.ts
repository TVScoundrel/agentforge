import { createLogger } from '@agentforge/core';

/** Default number of rows fetched per streaming chunk. */
export const DEFAULT_CHUNK_SIZE = 100;
export const DEFAULT_SAMPLE_SIZE = 50;
export const MAX_CHUNK_SIZE = 5000;
export const MAX_SAMPLE_SIZE = 5000;

export const streamExecutorLogger = createLogger('agentforge:tools:data:relational:stream');

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
