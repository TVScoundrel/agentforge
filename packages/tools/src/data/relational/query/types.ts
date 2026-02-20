/**
 * Query execution types for relational databases
 * @module query/types
 */

import type { DatabaseVendor } from '../types.js';
import type { SQL } from 'drizzle-orm';

/**
 * Query parameters for parameterized SQL execution
 * 
 * Parameters can be provided as:
 * - An array for positional parameters (e.g., [value1, value2])
 * - An object for named parameters (e.g., { name: 'John', age: 30 })
 */
export type QueryParams = unknown[] | Record<string, unknown>;

/**
 * Query execution input
 */
export interface QueryInput {
  /** SQL query string */
  sql: string;
  /** Query parameters for parameter binding */
  params?: QueryParams;
  /** Database vendor */
  vendor: DatabaseVendor;
}

/**
 * Query execution result
 */
export interface QueryExecutionResult {
  /** Query result rows */
  rows: unknown[];
  /** Number of rows affected (for INSERT/UPDATE/DELETE) */
  rowCount: number;
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * Minimal SQL executor abstraction.
 * Used by ConnectionManager and transaction contexts.
 */
export interface SqlExecutor {
  execute(query: SQL): Promise<unknown>;
}
