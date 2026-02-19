/**
 * Query execution and CRUD operations
 * @module query
 */

export type {
  QueryParams,
  QueryInput,
  QueryExecutionResult
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
} from './query-builder.js';

export {
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
