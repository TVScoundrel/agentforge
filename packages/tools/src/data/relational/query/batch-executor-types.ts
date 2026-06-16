/**
 * Shared types for relational batch execution helpers.
 */

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

export interface ResolvedBatchExecutionOptions {
  batchSize: number;
  continueOnError: boolean;
  maxRetries: number;
  retryDelayMs: number;
  onProgress?: (progress: BatchProgressUpdate) => Promise<void> | void;
}
