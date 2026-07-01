import { Readable } from 'node:stream';
import { buildSelectQuery, type SelectQueryInput } from './query-builder.js';
import {
  resolveChunkSize,
  resolveTotalRowsLimit,
} from './stream-executor-options.js';
import { extractRows } from './stream-executor-runtime.js';
import type { SqlExecutor } from './types.js';
import type {
  StreamingSelectChunk,
  StreamingSelectOptions,
} from './stream-executor-types.js';

/**
 * Yield SELECT rows chunk-by-chunk using LIMIT/OFFSET pagination.
 *
 * NOTE:
 * OFFSET-based pagination can degrade on very large offsets because many SQL
 * engines must scan/skip intermediate rows. For very large datasets, prefer
 * keyset/cursor pagination when available.
 */
export async function* streamSelectChunks(
  executor: SqlExecutor,
  input: SelectQueryInput,
  options: StreamingSelectOptions = {}
): AsyncGenerator<StreamingSelectChunk> {
  const chunkSize = resolveChunkSize(options);
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

    const result = await executor.execute(query);
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
  executor: SqlExecutor,
  input: SelectQueryInput,
  options: StreamingSelectOptions = {}
): Readable {
  return Readable.from(streamSelectChunks(executor, input, options), {
    objectMode: true,
    highWaterMark: 1,
  });
}
