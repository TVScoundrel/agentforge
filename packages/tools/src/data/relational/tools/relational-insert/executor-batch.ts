import { benchmarkBatchExecution, executeBatchedTask } from '../../query/batch-executor.js';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type {
  InsertBatchMetadata,
  InsertBatchOptions,
  InsertResult,
  InsertRow,
  RelationalInsertInput,
} from './types.js';
import { executeInsertOnce } from './executor-single.js';
import { insertExecutorLogger, type InsertExecutionContext } from './executor-shared.js';

export async function executeInsertInBatchMode(
  manager: ConnectionManager,
  input: RelationalInsertInput & { data: InsertRow[] },
  context: InsertExecutionContext | undefined,
  options: Required<InsertBatchOptions>
): Promise<InsertResult> {
  const batchResult = await executeBatchedTask<InsertRow, InsertResult>(
    {
      operation: 'insert',
      items: input.data,
      executeBatch: async (rows) =>
        executeInsertOnce(manager, {
          ...input,
          data: rows,
          batch: undefined,
        }, context),
      getBatchSuccessCount: (result, rows) => Math.min(result.rowCount, rows.length),
    },
    {
      batchSize: options.batchSize,
      continueOnError: options.continueOnError,
      maxRetries: options.maxRetries,
      retryDelayMs: options.retryDelayMs,
      onProgress: (progress) => {
        insertExecutorLogger.debug('INSERT batch progress', {
          vendor: input.vendor,
          table: input.table,
          ...progress,
        });
      },
    }
  );

  const rowCount = batchResult.results.reduce((total, result) => total + result.rowCount, 0);
  const rows = batchResult.results.flatMap((result) => result.rows);
  const insertedIds = batchResult.results.flatMap((result) => result.insertedIds);

  let benchmark: InsertBatchMetadata['benchmark'];
  if (options.benchmark) {
    insertExecutorLogger.warn('INSERT batch benchmark enabled. Synthetic benchmark callbacks are side-effect free and do not execute SQL.', {
      vendor: input.vendor,
      table: input.table,
      totalRows: input.data.length,
      batchSize: options.batchSize,
    });

    benchmark = await benchmarkBatchExecution({
      items: input.data,
      batchSize: options.batchSize,
      runIndividual: async () => {
        // Synthetic benchmark callback for timing-only comparison.
      },
      runBatch: async () => {
        // Synthetic benchmark callback for timing-only comparison.
      },
    });
  }

  return {
    rowCount,
    rows,
    insertedIds,
    executionTime: batchResult.executionTime,
    batch: {
      enabled: true,
      batchSize: options.batchSize,
      totalItems: batchResult.totalItems,
      processedItems: batchResult.processedItems,
      successfulItems: batchResult.successfulItems,
      failedItems: batchResult.failedItems,
      totalBatches: batchResult.totalBatches,
      retries: batchResult.retries,
      partialSuccess: batchResult.partialSuccess,
      failures: batchResult.failures,
      benchmark,
    },
  };
}
