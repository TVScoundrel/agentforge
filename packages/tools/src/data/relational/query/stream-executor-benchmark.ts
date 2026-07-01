import { buildSelectQuery, type SelectQueryInput } from './query-builder.js';
import { executeStreamingSelect } from './stream-executor-execution.js';
import { extractRows } from './stream-executor-runtime.js';
import type { SqlExecutor } from './types.js';
import {
  streamExecutorLogger,
  type StreamingBenchmarkResult,
  type StreamingSelectOptions,
} from './stream-executor-types.js';

/**
 * Benchmark memory usage of regular SELECT execution vs streaming execution.
 *
 * NOTE:
 * This benchmark intentionally executes the SELECT query twice (one regular,
 * one streaming). Use only with side-effect-free queries.
 */
export async function benchmarkStreamingSelectMemory(
  executor: SqlExecutor,
  input: SelectQueryInput,
  options: StreamingSelectOptions = {}
): Promise<StreamingBenchmarkResult> {
  streamExecutorLogger.warn(
    'Running streaming benchmark will execute the SELECT query twice (regular + streaming).',
    {
      table: input.table,
      vendor: input.vendor,
    }
  );

  const nonStreamingStartHeapUsed = process.memoryUsage().heapUsed;
  const nonStreamingStartTime = Date.now();

  const nonStreamingResult = await executor.execute(buildSelectQuery(input));
  const nonStreamingRows = extractRows(nonStreamingResult);

  const nonStreamingExecutionTime = Date.now() - nonStreamingStartTime;
  const nonStreamingPeakHeapUsed = Math.max(nonStreamingStartHeapUsed, process.memoryUsage().heapUsed);

  const streamingResult = await executeStreamingSelect(executor, input, {
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

  streamExecutorLogger.debug('Streaming benchmark completed', {
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
