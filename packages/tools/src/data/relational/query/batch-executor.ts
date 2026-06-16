/**
 * Generic batch execution helpers for relational operations.
 * @module query/batch-executor
 */

export {
  DEFAULT_BATCH_SIZE,
  MAX_BATCH_SIZE,
} from './batch-executor-options.js';
export { benchmarkBatchExecution } from './batch-executor-benchmark.js';
export { executeBatchedTask } from './batch-executor-execution.js';
export type {
  BatchBenchmarkResult,
  BatchExecutionOptions,
  BatchExecutionResult,
  BatchExecutionTask,
  BatchFailureDetail,
  BatchProgressUpdate,
} from './batch-executor-types.js';
