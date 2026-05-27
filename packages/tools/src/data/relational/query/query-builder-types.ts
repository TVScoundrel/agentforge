import type { SQL } from 'drizzle-orm';
import type { DatabaseVendor } from '../types.js';

/**
 * Supported scalar values for INSERT payloads.
 */
export type InsertValue = string | number | boolean | null;

/**
 * One INSERT row payload.
 */
export type InsertRow = Record<string, InsertValue>;

/**
 * INSERT payload input shape.
 */
export type InsertData = InsertRow | InsertRow[];

/**
 * INSERT RETURNING behavior.
 */
export type InsertReturningMode = 'none' | 'id' | 'row';

/**
 * INSERT RETURNING configuration.
 */
export interface InsertReturningOptions {
  mode?: InsertReturningMode;
  idColumn?: string;
}

/**
 * Builder input for INSERT queries.
 */
export interface InsertQueryInput {
  table: string;
  data: InsertData;
  returning?: InsertReturningOptions;
  vendor: DatabaseVendor;
}

/**
 * Built INSERT query with normalized metadata used by execution layer.
 */
export interface BuiltInsertQuery {
  query: SQL | SQL[];
  rows: InsertRow[];
  returningMode: InsertReturningMode;
  idColumn: string;
  supportsReturning: boolean;
}

/**
 * Supported scalar values for UPDATE payloads.
 */
export type UpdateValue = InsertValue;

/**
 * UPDATE payload shape.
 */
export type UpdateData = Record<string, UpdateValue>;

/**
 * WHERE operator types shared by UPDATE/DELETE/SELECT conditions.
 */
export type UpdateWhereOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'like'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull';

export type WhereConditionValue =
  | string
  | number
  | boolean
  | null
  | Array<string | number>;

interface BaseWhereCondition {
  column: string;
  operator: UpdateWhereOperator;
  value?: WhereConditionValue;
}

/**
 * WHERE condition for UPDATE queries.
 */
export type UpdateWhereCondition = BaseWhereCondition;

/**
 * Optional optimistic lock condition appended to WHERE.
 */
export interface UpdateOptimisticLock {
  column: string;
  expectedValue: string | number;
}

/**
 * Builder input for UPDATE queries.
 */
export interface UpdateQueryInput {
  table: string;
  data: UpdateData;
  where?: UpdateWhereCondition[];
  allowFullTableUpdate?: boolean;
  optimisticLock?: UpdateOptimisticLock;
  vendor: DatabaseVendor;
}

/**
 * Built UPDATE query with normalized metadata used by execution layer.
 */
export interface BuiltUpdateQuery {
  query: SQL;
  whereApplied: boolean;
  usesOptimisticLock: boolean;
}

/**
 * WHERE condition for DELETE queries.
 */
export type DeleteWhereCondition = BaseWhereCondition;

/**
 * Soft-delete configuration.
 */
export interface DeleteSoftDeleteOptions {
  column?: string;
  value?: string | number;
}

/**
 * Builder input for DELETE queries.
 */
export interface DeleteQueryInput {
  table: string;
  where?: DeleteWhereCondition[];
  allowFullTableDelete?: boolean;
  softDelete?: DeleteSoftDeleteOptions;
  vendor: DatabaseVendor;
}

/**
 * Built DELETE query with normalized metadata used by execution layer.
 */
export interface BuiltDeleteQuery {
  query: SQL;
  whereApplied: boolean;
  usesSoftDelete: boolean;
  softDeleteColumn?: string;
}

/**
 * ORDER BY direction for SELECT queries.
 */
export type SelectOrderDirection = 'asc' | 'desc';

/**
 * ORDER BY clause for SELECT queries.
 */
export interface SelectOrderBy {
  column: string;
  direction: SelectOrderDirection;
}

/**
 * WHERE condition for SELECT queries.
 */
export type SelectWhereCondition = BaseWhereCondition;

/**
 * Builder input for SELECT queries.
 */
export interface SelectQueryInput {
  table: string;
  columns?: string[];
  where?: SelectWhereCondition[];
  orderBy?: SelectOrderBy[];
  limit?: number;
  offset?: number;
  vendor: DatabaseVendor;
}
