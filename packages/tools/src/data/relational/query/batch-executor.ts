/**
 * Generic batch execution helpers for relational operations.
 * @module query/batch-executor
 */

import { createLogger } from '@agentforge/core';

const logger = createLogger('agentforge:tools:data:relational:batch');

export const DEFAULT_BATCH_SIZE = 100;
export const MAX_BATCH_SIZE = 5000;
const MAX_RETRY_ATTEMPTS = 5;
const MAX_RETRY_DELAY_MS = 60_000;

/**
 * Progress payload emitted after each processed batch.
 */
export interface BatchProgressUpdate {
  operation: string;
  batchIndex: number;
  totalBatches: number;
  batchSize: number;
  processedItems: number;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  lastBatchSucceeded: boolean;
}

/**
 * Recorded batch failure metadata.
 */
export interface BatchFailureDetail {
  operation: string;
  batchIndex: number;
  batchSize: number;
  attempts: number;
  error: string;
}

/**
 * Runtime options for batched execution.
 */
export interface BatchExecutionOptions {
  batchSize?: number;
  continueOnError?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  onProgress?: (progress: BatchProgressUpdate) => Promise<void> | void;
}

/**
 * Task descriptor for generic batched execution.
 */
export interface BatchExecutionTask<TItem, TResult> {
  operation: string;
  items: TItem[];
  executeBatch: (batchItems: TItem[], batchIndex: number) => Promise<TResult>;
  getBatchSuccessCount?: (result: TResult, batchItems: TItem[]) => number;
}

/**
 * Batched execution summary.
 */
export interface BatchExecutionResult<TResult> {
  results: TResult[];
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  totalBatches: number;
  retries: number;
  partialSuccess: boolean;
  executionTime: number;
  failures: BatchFailureDetail[];
}

/**
 * Synthetic benchmark output comparing individual and batched processing.
 */
export interface BatchBenchmarkResult {
  itemCount: number;
  batchSize: number;
  batchCount: number;
  individualExecutionTime: number;
  batchedExecutionTime: number;
  timeSavedMs: number;
  speedupRatio: number;
  speedupPercent: number;
}

interface ResolvedBatchExecutionOptions {
  batchSize: number;
  continueOnError: boolean;
  maxRetries: number;
  retryDelayMs: number;
  onProgress?: (progress: BatchProgressUpdate) => Promise<void> | void;
}

function normalizePositiveInt(
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

function resolveOptions(options: BatchExecutionOptions): ResolvedBatchExecutionOptions {
  return {
    batchSize: normalizePositiveInt(options.batchSize, 'batchSize', 1, MAX_BATCH_SIZE, DEFAULT_BATCH_SIZE),
    continueOnError: options.continueOnError ?? true,
    maxRetries: normalizePositiveInt(options.maxRetries, 'maxRetries', 0, MAX_RETRY_ATTEMPTS, 0),
    retryDelayMs: normalizePositiveInt(options.retryDelayMs, 'retryDelayMs', 0, MAX_RETRY_DELAY_MS, 0),
    onProgress: options.onProgress,
  };
}

function chunkItems<TItem>(items: TItem[], chunkSize: number): TItem[][] {
  if (items.length === 0) {
    return [];
  }

  const chunks: TItem[][] = [];

  for (let start = 0; start < items.length; start += chunkSize) {
    chunks.push(items.slice(start, start + chunkSize));
  }

  return chunks;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Execute operation items in batches with retry and progress callbacks.
 */
export async function executeBatchedTask<TItem, TResult>(
  task: BatchExecutionTask<TItem, TResult>,
  options: BatchExecutionOptions = {}
): Promise<BatchExecutionResult<TResult>> {
  const startTime = Date.now();
  const resolved = resolveOptions(options);
  const batches = chunkItems(task.items, resolved.batchSize);

  const results: TResult[] = [];
  const failures: BatchFailureDetail[] = [];

  let processedItems = 0;
  let successfulItems = 0;
  let failedItems = 0;
  let retries = 0;

  logger.debug('Starting batched execution', {
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

          logger.warn('Batch execution failed, retrying', {
            operation: task.operation,
            batchIndex,
            attempts,
            maxRetries: resolved.maxRetries,
            error: toErrorMessage(error),
          });

          if (resolved.retryDelayMs > 0) {
            await delay(resolved.retryDelayMs);
          }

          continue;
        }

        const failure: BatchFailureDetail = {
          operation: task.operation,
          batchIndex,
          batchSize: batchItems.length,
          attempts,
          error: toErrorMessage(error),
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

        logger.warn('Batch execution failed and was recorded for partial success', {
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

  logger.debug('Batched execution completed', {
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

/**
 * Benchmark individual vs batched execution.
 *
 * Note: callers should run this only for idempotent or isolated workloads.
 */
export async function benchmarkBatchExecution<TItem, TIndividualResult, TBatchResult>(params: {
  items: TItem[];
  batchSize?: number;
  runIndividual: (item: TItem, index: number) => Promise<TIndividualResult>;
  runBatch: (batchItems: TItem[], batchIndex: number) => Promise<TBatchResult>;
}): Promise<BatchBenchmarkResult> {
  const batchSize = normalizePositiveInt(
    params.batchSize,
    'batchSize',
    1,
    MAX_BATCH_SIZE,
    DEFAULT_BATCH_SIZE
  );
  const batches = chunkItems(params.items, batchSize);

  const individualStart = Date.now();
  for (const [index, item] of params.items.entries()) {
    await params.runIndividual(item, index);
  }
  const individualExecutionTime = Date.now() - individualStart;

  const batchStart = Date.now();
  for (const [batchIndex, batchItems] of batches.entries()) {
    await params.runBatch(batchItems, batchIndex);
  }
  const batchedExecutionTime = Date.now() - batchStart;

  const timeSavedMs = Math.max(individualExecutionTime - batchedExecutionTime, 0);
  const speedupRatio = batchedExecutionTime > 0
    ? individualExecutionTime / batchedExecutionTime
    : 0;
  const speedupPercent = individualExecutionTime > 0
    ? (timeSavedMs / individualExecutionTime) * 100
    : 0;

  logger.debug('Batch benchmark completed', {
    itemCount: params.items.length,
    batchCount: batches.length,
    batchSize,
    individualExecutionTime,
    batchedExecutionTime,
    timeSavedMs,
    speedupPercent,
  });

  return {
    itemCount: params.items.length,
    batchSize,
    batchCount: batches.length,
    individualExecutionTime,
    batchedExecutionTime,
    timeSavedMs,
    speedupRatio,
    speedupPercent,
  };
}
