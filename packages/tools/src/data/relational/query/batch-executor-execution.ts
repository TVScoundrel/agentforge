/**
 * Batched execution flow with retry, failure tracking, and progress callbacks.
 */

import { chunkBatchItems, resolveBatchExecutionOptions } from './batch-executor-options.js';
import { batchExecutionLogger, delayBatchRetry, toBatchErrorMessage } from './batch-executor-runtime.js';
import type {
  BatchExecutionOptions,
  BatchExecutionResult,
  BatchExecutionTask,
  BatchFailureDetail,
} from './batch-executor-types.js';

/**
 * Execute operation items in batches with retry and progress callbacks.
 */
export async function executeBatchedTask<TItem, TResult>(
  task: BatchExecutionTask<TItem, TResult>,
  options: BatchExecutionOptions = {}
): Promise<BatchExecutionResult<TResult>> {
  const startTime = Date.now();
  const resolved = resolveBatchExecutionOptions(options);
  const batches = chunkBatchItems(task.items, resolved.batchSize);
  const results: TResult[] = [];
  const failures: BatchFailureDetail[] = [];

  let processedItems = 0;
  let successfulItems = 0;
  let failedItems = 0;
  let retries = 0;

  batchExecutionLogger.debug('Starting batched execution', {
    operation: task.operation,
    totalItems: task.items.length,
    totalBatches: batches.length,
    batchSize: resolved.batchSize,
    continueOnError: resolved.continueOnError,
    maxRetries: resolved.maxRetries,
  });

  for (const [batchIndex, batchItems] of batches.entries()) {
    let attempts = 0;
    let lastError: unknown;

    while (attempts <= resolved.maxRetries) {
      try {
        attempts += 1;

        const result = await task.executeBatch(batchItems, batchIndex);
        const successCount = Math.min(
          Math.max(task.getBatchSuccessCount?.(result, batchItems) ?? batchItems.length, 0),
          batchItems.length
        );

        results.push(result);
        processedItems += batchItems.length;
        successfulItems += successCount;
        failedItems += batchItems.length - successCount;

        await resolved.onProgress?.({
          operation: task.operation,
          batchIndex,
          totalBatches: batches.length,
          batchSize: batchItems.length,
          processedItems,
          totalItems: task.items.length,
          successfulItems,
          failedItems,
          lastBatchSucceeded: true,
        });

        break;
      } catch (error) {
        lastError = error;

        if (attempts <= resolved.maxRetries) {
          retries += 1;

          batchExecutionLogger.warn('Batch execution failed, retrying', {
            operation: task.operation,
            batchIndex,
            attempts,
            maxRetries: resolved.maxRetries,
            error: toBatchErrorMessage(error),
          });

          if (resolved.retryDelayMs > 0) {
            await delayBatchRetry(resolved.retryDelayMs);
          }

          continue;
        }

        const failure: BatchFailureDetail = {
          operation: task.operation,
          batchIndex,
          batchSize: batchItems.length,
          attempts,
          error: toBatchErrorMessage(error),
        };

        failures.push(failure);
        processedItems += batchItems.length;
        failedItems += batchItems.length;

        await resolved.onProgress?.({
          operation: task.operation,
          batchIndex,
          totalBatches: batches.length,
          batchSize: batchItems.length,
          processedItems,
          totalItems: task.items.length,
          successfulItems,
          failedItems,
          lastBatchSucceeded: false,
        });

        if (!resolved.continueOnError) {
          throw new Error(
            `Batch ${batchIndex + 1}/${batches.length} failed for ${task.operation}: ${failure.error}`,
            { cause: lastError }
          );
        }

        batchExecutionLogger.warn('Batch execution failed and was recorded for partial success', {
          operation: task.operation,
          batchIndex,
          attempts,
          error: failure.error,
        });

        break;
      }
    }
  }

  const executionTime = Date.now() - startTime;
  const partialSuccess = successfulItems > 0 && failedItems > 0;

  batchExecutionLogger.debug('Batched execution completed', {
    operation: task.operation,
    totalItems: task.items.length,
    successfulItems,
    failedItems,
    retries,
    partialSuccess,
    executionTime,
  });

  return {
    results,
    totalItems: task.items.length,
    processedItems,
    successfulItems,
    failedItems,
    totalBatches: batches.length,
    retries,
    partialSuccess,
    executionTime,
    failures,
  };
}
