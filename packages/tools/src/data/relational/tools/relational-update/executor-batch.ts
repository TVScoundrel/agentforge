import { benchmarkBatchExecution, executeBatchedTask } from '../../query/batch-executor.js';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type {
  RelationalUpdateInput,
  UpdateBatchMetadata,
  UpdateBatchOperation,
  UpdateBatchOptions,
  UpdateResult,
} from './types.js';
import { executeSingleUpdate } from './executor-single.js';
import {
  toErrorMessage,
  updateExecutorLogger,
  type UpdateChunkExecutionResult,
  type UpdateExecutionContext,
} from './executor-shared.js';

export async function executeUpdateInBatchMode(
  manager: ConnectionManager,
  input: RelationalUpdateInput & { operations: UpdateBatchOperation[] },
  context: UpdateExecutionContext | undefined,
  options: Required<UpdateBatchOptions>
): Promise<UpdateResult> {
  const batchResult = await executeBatchedTask<UpdateBatchOperation, UpdateChunkExecutionResult>(
    {
      operation: 'update',
      items: input.operations,
      executeBatch: async (operations, batchIndex) => {
        let rowCount = 0;
        let successfulItems = 0;
        let failedItems = 0;
        const failures: UpdateChunkExecutionResult['failures'] = [];

        for (const operation of operations) {
          try {
            const result = await executeSingleUpdate(
              manager,
              input,
              {
                data: operation.data,
                where: operation.where,
                allowFullTableUpdate: operation.allowFullTableUpdate,
                optimisticLock: operation.optimisticLock,
              },
              context
            );

            rowCount += result.rowCount;
            successfulItems += 1;
          } catch (error) {
            if (!options.continueOnError) {
              throw error;
            }

            failedItems += 1;
            failures.push({
              operation: 'update',
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
        updateExecutorLogger.debug('UPDATE batch progress', {
          vendor: input.vendor,
          table: input.table,
          ...progress,
        });
      },
    }
  );

  const rowCount = batchResult.results.reduce((total, result) => total + result.rowCount, 0);
  const operationFailures = batchResult.results.flatMap((result) => result.failures);

  let benchmark: UpdateBatchMetadata['benchmark'];
  if (options.benchmark) {
    updateExecutorLogger.warn('UPDATE batch benchmark enabled. Synthetic benchmark callbacks are side-effect free and do not execute SQL.', {
      vendor: input.vendor,
      table: input.table,
      operationCount: input.operations.length,
      batchSize: options.batchSize,
    });

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
