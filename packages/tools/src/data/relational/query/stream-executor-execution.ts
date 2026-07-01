import type { SelectQueryInput } from './query-builder.js';
import { createSelectReadableStream } from './stream-executor-chunks.js';
import { resolveSampleSize } from './stream-executor-options.js';
import { isCancelledError } from './stream-executor-runtime.js';
import type { SqlExecutor } from './types.js';
import {
  DEFAULT_CHUNK_SIZE,
  streamExecutorLogger,
  type StreamingSelectChunk,
  type StreamingSelectOptions,
  type StreamingSelectResult,
} from './stream-executor-types.js';

/**
 * Execute a SELECT query in streaming mode while tracking memory usage.
 */
export async function executeStreamingSelect(
  executor: SqlExecutor,
  input: SelectQueryInput,
  options: StreamingSelectOptions = {}
): Promise<StreamingSelectResult> {
  const startTime = Date.now();
  const collectedRows: unknown[] = [];
  const sampleSize = resolveSampleSize(options);

  let rowCount = 0;
  let chunkCount = 0;
  let cancelled = false;

  const startHeapUsed = process.memoryUsage().heapUsed;
  let peakHeapUsed = startHeapUsed;

  const stream = createSelectReadableStream(executor, input, options);
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

  streamExecutorLogger.debug('Streaming SELECT execution completed', {
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
