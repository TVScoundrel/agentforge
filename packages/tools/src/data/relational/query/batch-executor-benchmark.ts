/**
 * Benchmark helpers for relational batch execution.
 */

import {
  chunkBatchItems,
  DEFAULT_BATCH_SIZE,
  MAX_BATCH_SIZE,
  resolveBatchExecutionOptions,
} from './batch-executor-options.js';
import { batchExecutionLogger } from './batch-executor-runtime.js';
import type {
  BatchBenchmarkResult,
  BatchExecutionOptions,
} from './batch-executor-types.js';

interface BatchBenchmarkParams<TItem, TIndividualResult, TBatchResult> {
  items: TItem[];
  batchSize?: number;
  runIndividual: (item: TItem, index: number) => Promise<TIndividualResult>;
  runBatch: (batchItems: TItem[], batchIndex: number) => Promise<TBatchResult>;
}

function resolveBenchmarkBatchSize(options: BatchExecutionOptions): number {
  return resolveBatchExecutionOptions({
    ...options,
    continueOnError: true,
    maxRetries: 0,
    retryDelayMs: 0,
    batchSize: options.batchSize ?? DEFAULT_BATCH_SIZE,
  }).batchSize;
}

/**
 * Benchmark individual vs batched execution.
 *
 * Note: callers should run this only for idempotent or isolated workloads.
 */
export async function benchmarkBatchExecution<TItem, TIndividualResult, TBatchResult>(
  params: BatchBenchmarkParams<TItem, TIndividualResult, TBatchResult>
): Promise<BatchBenchmarkResult> {
  const batchSize = resolveBenchmarkBatchSize({
    batchSize: params.batchSize ?? DEFAULT_BATCH_SIZE,
  });
  const batches = chunkBatchItems(params.items, Math.min(batchSize, MAX_BATCH_SIZE));

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

  batchExecutionLogger.debug('Batch benchmark completed', {
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
