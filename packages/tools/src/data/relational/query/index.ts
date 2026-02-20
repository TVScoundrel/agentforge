/**
 * Query execution and CRUD operations
 * @module query
 */

export type {
  QueryParams,
  QueryInput,
  QueryExecutionResult,
  SqlExecutor,
} from './types.js';

export { executeQuery } from './query-executor.js';
export {
  buildSelectQuery,
  type SelectOrderDirection,
  type SelectOrderBy,
  type SelectWhereCondition,
  type SelectQueryInput,
  buildInsertQuery,
  type InsertValue,
  type InsertRow,
  type InsertData,
  type InsertReturningMode,
  type InsertReturningOptions,
  type InsertQueryInput,
  type BuiltInsertQuery,
  buildUpdateQuery,
  type UpdateValue,
  type UpdateData,
  type UpdateWhereOperator,
  type UpdateWhereCondition,
  type UpdateOptimisticLock,
  type UpdateQueryInput,
  type BuiltUpdateQuery,
  buildDeleteQuery,
  type DeleteWhereCondition,
  type DeleteSoftDeleteOptions,
  type DeleteQueryInput,
  type BuiltDeleteQuery,
} from './query-builder.js';

export {
  DEFAULT_BATCH_SIZE,
  MAX_BATCH_SIZE,
  executeBatchedTask,
  benchmarkBatchExecution,
  type BatchProgressUpdate,
  type BatchFailureDetail,
  type BatchExecutionOptions,
  type BatchExecutionTask,
  type BatchExecutionResult,
  type BatchBenchmarkResult,
} from './batch-executor.js';

export {
  DEFAULT_CHUNK_SIZE,
  streamSelectChunks,
  createSelectReadableStream,
  executeStreamingSelect,
  benchmarkStreamingSelectMemory,
  type StreamingSelectOptions,
  type StreamingSelectChunk,
  type StreamingSelectResult,
  type StreamingMemoryUsage,
  type StreamingBenchmarkResult,
} from './stream-executor.js';

export {
  withTransaction,
  type TransactionOptions,
  type TransactionIsolationLevel,
  type TransactionContext,
} from './transaction.js';
