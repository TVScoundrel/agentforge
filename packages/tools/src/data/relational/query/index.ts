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
  buildInsertQuery,
  type InsertValue,
  type InsertRow,
  type InsertData,
  type InsertReturningMode,
  type InsertReturningOptions,
  type InsertQueryInput,
  type BuiltInsertQuery,
} from './query-builder.js';
