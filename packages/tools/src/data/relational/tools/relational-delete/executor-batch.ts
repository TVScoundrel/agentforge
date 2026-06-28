import {
  benchmarkBatchExecution,
  executeBatchedTask,
} from '../../query/batch-executor.js';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type {
  DeleteBatchMetadata,
  DeleteBatchOperation,
  DeleteBatchOptions,
  DeleteResult,
  RelationalDeleteInput,
} from './types.js';
import { executeSingleDelete } from './executor-single.js';
import {
  deleteExecutorLogger,
  toErrorMessage,
  type DeleteChunkExecutionResult,
  type DeleteExecutionContext,
} from './executor-shared.js';

export async function executeDeleteInBatchMode(
  manager: ConnectionManager,
  input: RelationalDeleteInput & { operations: DeleteBatchOperation[] },
  context: DeleteExecutionContext | undefined,
  options: Required<DeleteBatchOptions>
): Promise<DeleteResult> {
  const batchResult = await executeBatchedTask<DeleteBatchOperation, DeleteChunkExecutionResult>(
    {
      operation: 'delete',
      items: input.operations,
      executeBatch: async (operations, batchIndex) => {
        let rowCount = 0;
        let successfulItems = 0;
        let failedItems = 0;
        let softDeletedCount = 0;
        const failures: DeleteBatchMetadata['failures'] = [];

        for (const operation of operations) {
          try {
            const result = await executeSingleDelete(
              manager,
              input,
              {
                where: operation.where,
                allowFullTableDelete: operation.allowFullTableDelete,
                cascade: operation.cascade,
                softDelete: operation.softDelete,
              },
              context
            );

            rowCount += result.rowCount;
            successfulItems += 1;
            if (result.softDeleted) {
              softDeletedCount += 1;
            }
          } catch (error) {
            if (!options.continueOnError) {
              throw error;
            }

            failedItems += 1;
            failures.push({
              operation: 'delete',
              batchIndex,
              batchSize: operations.length,
              attempts: 1,
              error: toErrorMessage(error),
            });
          }
        }

        return {
          rowCount,
          successfulItems,
          failedItems,
          softDeletedCount,
          failures,
        };
      },
      getBatchSuccessCount: (result) => result.successfulItems,
    },
    {
      batchSize: options.batchSize,
      continueOnError: options.continueOnError,
      maxRetries: options.maxRetries,
      retryDelayMs: options.retryDelayMs,
      onProgress: (progress) => {
        deleteExecutorLogger.debug('DELETE batch progress', {
          vendor: input.vendor,
          table: input.table,
          ...progress,
        });
      },
    }
  );

  const rowCount = batchResult.results.reduce((total, result) => total + result.rowCount, 0);
  const softDeleted = batchResult.results.some((result) => result.softDeletedCount > 0);
  const operationFailures = batchResult.results.flatMap((result) => result.failures);

  let benchmark: DeleteBatchMetadata['benchmark'];
  if (options.benchmark) {
    deleteExecutorLogger.warn(
      'DELETE batch benchmark enabled. Synthetic benchmark callbacks are side-effect free and do not execute SQL.',
      {
        vendor: input.vendor,
        table: input.table,
        operationCount: input.operations.length,
        batchSize: options.batchSize,
      },
    );

    benchmark = await benchmarkBatchExecution({
      items: input.operations,
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
    executionTime: batchResult.executionTime,
    softDeleted,
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
      failures: [...batchResult.failures, ...operationFailures],
      benchmark,
    },
  };
}
