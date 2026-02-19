/**
 * Query builder helpers for relational CRUD operations.
 * @module query/query-builder
 */

import { sql, type SQL } from 'drizzle-orm';
import type { DatabaseVendor } from '../types.js';
import {
  quoteIdentifier,
  quoteQualifiedIdentifier,
  validateIdentifier,
  validateQualifiedIdentifier,
} from '../utils/identifier-utils.js';

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
  query: SQL;
  rows: InsertRow[];
  returningMode: InsertReturningMode;
  idColumn: string;
  supportsReturning: boolean;
}

const DEFAULT_ID_COLUMN = 'id';

function normalizeInsertRows(data: InsertData): InsertRow[] {
  const rows = Array.isArray(data) ? data : [data];

  if (rows.length === 0) {
    throw new Error('Insert data must not be an empty array');
  }

  rows.forEach((row, rowIndex) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`Insert row at index ${rowIndex} must be an object`);
    }
  });

  return rows;
}

function collectOrderedColumns(rows: InsertRow[]): string[] {
  const seen = new Set<string>();
  const orderedColumns: string[] = [];

  rows.forEach((row) => {
    Object.keys(row).forEach((column) => {
      if (!seen.has(column)) {
        seen.add(column);
        orderedColumns.push(column);
      }
    });
  });

  return orderedColumns;
}

function buildValuesTuple(columns: string[], row: InsertRow): SQL {
  const valueFragments = columns.map((column) => {
    if (!Object.prototype.hasOwnProperty.call(row, column)) {
      return sql.raw('DEFAULT');
    }

    const value = row[column];

    if (value === undefined) {
      throw new Error(`Insert value for column "${column}" must not be undefined`);
    }

    return sql`${value}`;
  });

  return sql.join(
    [sql.raw('('), sql.join(valueFragments, sql.raw(', ')), sql.raw(')')],
    sql.raw('')
  );
}

function buildInsertValuesQuery(
  table: string,
  columns: string[],
  rows: InsertRow[],
  vendor: DatabaseVendor
): SQL {
  const quotedTable = quoteQualifiedIdentifier(table, vendor);
  const quotedColumns = columns.map((column) => quoteIdentifier(column, vendor)).join(', ');

  const rowTuples = rows.map((row) => buildValuesTuple(columns, row));

  return sql.join(
    [
      sql.raw(`INSERT INTO ${quotedTable} (${quotedColumns}) VALUES `),
      sql.join(rowTuples, sql.raw(', ')),
    ],
    sql.raw('')
  );
}

function buildInsertDefaultValuesQuery(
  table: string,
  rowCount: number,
  vendor: DatabaseVendor
): SQL {
  if (rowCount > 1) {
    throw new Error('Batch INSERT with only DEFAULT VALUES is not supported');
  }

  const quotedTable = quoteQualifiedIdentifier(table, vendor);
  return sql.raw(`INSERT INTO ${quotedTable} DEFAULT VALUES`);
}

/**
 * Build a safe parameterized INSERT query from structured input.
 */
export function buildInsertQuery(input: InsertQueryInput): BuiltInsertQuery {
  validateQualifiedIdentifier(input.table, 'Table name');

  const rows = normalizeInsertRows(input.data);
  const columns = collectOrderedColumns(rows);

  const returningMode: InsertReturningMode = input.returning?.mode ?? 'none';
  const idColumn = input.returning?.idColumn ?? DEFAULT_ID_COLUMN;
  const supportsReturning = input.vendor === 'postgresql' || input.vendor === 'sqlite';

  if (returningMode === 'id') {
    validateIdentifier(idColumn, 'Returning id column');
  } else if (input.returning?.idColumn) {
    throw new Error('returning.idColumn can only be provided when returning.mode is "id"');
  }

  if (returningMode === 'row' && input.vendor === 'mysql') {
    throw new Error('Returning full rows is not supported for mysql. Use returning.mode "id" or "none".');
  }

  columns.forEach((column) => validateIdentifier(column, 'Insert column'));

  let query = columns.length > 0
    ? buildInsertValuesQuery(input.table, columns, rows, input.vendor)
    : buildInsertDefaultValuesQuery(input.table, rows.length, input.vendor);

  if (returningMode !== 'none' && supportsReturning) {
    if (returningMode === 'id') {
      query = sql.join(
        [query, sql.raw(` RETURNING ${quoteIdentifier(idColumn, input.vendor)}`)],
        sql.raw('')
      );
    } else {
      query = sql.join([query, sql.raw(' RETURNING *')], sql.raw(''));
    }
  }

  return {
    query,
    rows,
    returningMode,
    idColumn,
    supportsReturning,
  };
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
 * WHERE operator types for UPDATE conditions.
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

/**
 * WHERE condition for UPDATE queries.
 */
export interface UpdateWhereCondition {
  column: string;
  operator: UpdateWhereOperator;
  value?: string | number | boolean | null | Array<string | number>;
}

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

function normalizeUpdateData(data: UpdateData): UpdateData {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Update data must be an object');
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    throw new Error('Update data must not be empty');
  }

  keys.forEach((column) => {
    validateIdentifier(column, 'Update column');

    if (data[column] === undefined) {
      throw new Error(`Update value for column "${column}" must not be undefined`);
    }
  });

  return data;
}

function buildUpdateWhereCondition(condition: UpdateWhereCondition, vendor?: DatabaseVendor): SQL {
  validateIdentifier(condition.column, 'WHERE column');
  const column = sql.raw(quoteIdentifier(condition.column, vendor));

  switch (condition.operator) {
    case 'eq':
      if (condition.value === undefined) {
        throw new Error(`EQ operator requires a value for column ${condition.column}`);
      }
      if (condition.value === null) {
        throw new Error('null is only allowed with isNull/isNotNull operators');
      }
      return sql`${column} = ${condition.value}`;
    case 'ne':
      if (condition.value === undefined) {
        throw new Error(`NE operator requires a value for column ${condition.column}`);
      }
      if (condition.value === null) {
        throw new Error('null is only allowed with isNull/isNotNull operators');
      }
      return sql`${column} != ${condition.value}`;
    case 'gt':
      if (typeof condition.value !== 'string' && typeof condition.value !== 'number') {
        throw new Error(`GT operator requires a string or number value for column ${condition.column}`);
      }
      return sql`${column} > ${condition.value}`;
    case 'lt':
      if (typeof condition.value !== 'string' && typeof condition.value !== 'number') {
        throw new Error(`LT operator requires a string or number value for column ${condition.column}`);
      }
      return sql`${column} < ${condition.value}`;
    case 'gte':
      if (typeof condition.value !== 'string' && typeof condition.value !== 'number') {
        throw new Error(`GTE operator requires a string or number value for column ${condition.column}`);
      }
      return sql`${column} >= ${condition.value}`;
    case 'lte':
      if (typeof condition.value !== 'string' && typeof condition.value !== 'number') {
        throw new Error(`LTE operator requires a string or number value for column ${condition.column}`);
      }
      return sql`${column} <= ${condition.value}`;
    case 'like':
      if (typeof condition.value !== 'string') {
        throw new Error(`LIKE operator requires a string value for column ${condition.column}`);
      }
      return sql`${column} LIKE ${condition.value}`;
    case 'in':
      if (!Array.isArray(condition.value) || condition.value.length === 0) {
        throw new Error(`IN operator requires a non-empty array value for column ${condition.column}`);
      }
      return sql`${column} IN (${sql.join(condition.value.map((v) => sql`${v}`), sql.raw(', '))})`;
    case 'notIn':
      if (!Array.isArray(condition.value) || condition.value.length === 0) {
        throw new Error(`NOT IN operator requires a non-empty array value for column ${condition.column}`);
      }
      return sql`${column} NOT IN (${sql.join(condition.value.map((v) => sql`${v}`), sql.raw(', '))})`;
    case 'isNull':
      if (condition.value !== undefined) {
        throw new Error(`IS NULL operator must not include value for column ${condition.column}`);
      }
      return sql`${column} IS NULL`;
    case 'isNotNull':
      if (condition.value !== undefined) {
        throw new Error(`IS NOT NULL operator must not include value for column ${condition.column}`);
      }
      return sql`${column} IS NOT NULL`;
  }
}

/**
 * Build a safe parameterized UPDATE query from structured input.
 */
export function buildUpdateQuery(input: UpdateQueryInput): BuiltUpdateQuery {
  validateQualifiedIdentifier(input.table, 'Table name');
  const normalizedData = normalizeUpdateData(input.data);

  const setClauses = Object.entries(normalizedData).map(([column, value]) => {
    const quotedColumn = sql.raw(quoteIdentifier(column, input.vendor));
    return sql`${quotedColumn} = ${value}`;
  });

  const whereConditions: SQL[] = (input.where ?? []).map((condition) =>
    buildUpdateWhereCondition(condition, input.vendor)
  );

  if (input.optimisticLock) {
    validateIdentifier(input.optimisticLock.column, 'Optimistic lock column');
    if (input.optimisticLock.expectedValue === undefined || input.optimisticLock.expectedValue === null) {
      throw new Error('Optimistic lock expectedValue must not be empty');
    }
    const lockColumn = sql.raw(quoteIdentifier(input.optimisticLock.column, input.vendor));
    whereConditions.push(sql`${lockColumn} = ${input.optimisticLock.expectedValue}`);
  }

  if (whereConditions.length === 0 && !input.allowFullTableUpdate) {
    throw new Error('WHERE conditions are required for UPDATE queries. Set allowFullTableUpdate=true to override.');
  }

  let query = sql.join(
    [
      sql.raw(`UPDATE ${quoteQualifiedIdentifier(input.table, input.vendor)} SET `),
      sql.join(setClauses, sql.raw(', ')),
    ],
    sql.raw('')
  );

  if (whereConditions.length > 0) {
    query = sql.join([query, sql.raw(' WHERE '), sql.join(whereConditions, sql.raw(' AND '))], sql.raw(''));
  }

  return {
    query,
    whereApplied: whereConditions.length > 0,
    usesOptimisticLock: !!input.optimisticLock,
  };
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
export interface SelectWhereCondition {
  column: string;
  operator: UpdateWhereOperator;
  value?: string | number | boolean | null | Array<string | number>;
}

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

function buildSelectWhereCondition(condition: SelectWhereCondition, vendor?: DatabaseVendor): SQL {
  validateIdentifier(condition.column, 'WHERE column');
  const column = sql.raw(quoteIdentifier(condition.column, vendor));

  switch (condition.operator) {
    case 'eq':
      if (condition.value === undefined) {
        throw new Error(`EQ operator requires a value for column ${condition.column}`);
      }
      if (condition.value === null) {
        throw new Error('null is only allowed with isNull/isNotNull operators');
      }
      return sql`${column} = ${condition.value}`;
    case 'ne':
      if (condition.value === undefined) {
        throw new Error(`NE operator requires a value for column ${condition.column}`);
      }
      if (condition.value === null) {
        throw new Error('null is only allowed with isNull/isNotNull operators');
      }
      return sql`${column} != ${condition.value}`;
    case 'gt':
      if (typeof condition.value !== 'string' && typeof condition.value !== 'number') {
        throw new Error(`GT operator requires a string or number value for column ${condition.column}`);
      }
      return sql`${column} > ${condition.value}`;
    case 'lt':
      if (typeof condition.value !== 'string' && typeof condition.value !== 'number') {
        throw new Error(`LT operator requires a string or number value for column ${condition.column}`);
      }
      return sql`${column} < ${condition.value}`;
    case 'gte':
      if (typeof condition.value !== 'string' && typeof condition.value !== 'number') {
        throw new Error(`GTE operator requires a string or number value for column ${condition.column}`);
      }
      return sql`${column} >= ${condition.value}`;
    case 'lte':
      if (typeof condition.value !== 'string' && typeof condition.value !== 'number') {
        throw new Error(`LTE operator requires a string or number value for column ${condition.column}`);
      }
      return sql`${column} <= ${condition.value}`;
    case 'like':
      if (typeof condition.value !== 'string') {
        throw new Error(`LIKE operator requires a string value for column ${condition.column}`);
      }
      return sql`${column} LIKE ${condition.value}`;
    case 'in':
      if (!Array.isArray(condition.value) || condition.value.length === 0) {
        throw new Error(`IN operator requires a non-empty array value for column ${condition.column}`);
      }
      return sql`${column} IN (${sql.join(condition.value.map((v) => sql`${v}`), sql.raw(', '))})`;
    case 'notIn':
      if (!Array.isArray(condition.value) || condition.value.length === 0) {
        throw new Error(`NOT IN operator requires a non-empty array value for column ${condition.column}`);
      }
      return sql`${column} NOT IN (${sql.join(condition.value.map((v) => sql`${v}`), sql.raw(', '))})`;
    case 'isNull':
      if (condition.value !== undefined) {
        throw new Error(`IS NULL operator must not include value for column ${condition.column}`);
      }
      return sql`${column} IS NULL`;
    case 'isNotNull':
      if (condition.value !== undefined) {
        throw new Error(`IS NOT NULL operator must not include value for column ${condition.column}`);
      }
      return sql`${column} IS NOT NULL`;
  }
}

/**
 * Build a safe parameterized SELECT query from structured input.
 */
export function buildSelectQuery(input: SelectQueryInput): SQL {
  validateQualifiedIdentifier(input.table, 'Table name');

  let query = sql.raw('SELECT ');

  if (input.columns && input.columns.length > 0) {
    input.columns.forEach((column) => validateIdentifier(column, 'SELECT column'));
    query = sql.join(
      [query, sql.raw(input.columns.map((column) => quoteIdentifier(column, input.vendor)).join(', '))],
      sql.raw('')
    );
  } else {
    query = sql.join([query, sql.raw('*')], sql.raw(''));
  }

  query = sql.join(
    [query, sql.raw(` FROM ${quoteQualifiedIdentifier(input.table, input.vendor)}`)],
    sql.raw('')
  );

  if (input.where && input.where.length > 0) {
    const whereConditions = input.where.map((condition) => buildSelectWhereCondition(condition, input.vendor));
    query = sql.join(
      [query, sql.raw(' WHERE '), sql.join(whereConditions, sql.raw(' AND '))],
      sql.raw('')
    );
  }

  if (input.orderBy && input.orderBy.length > 0) {
    const orderClauses = input.orderBy.map((order) => {
      validateIdentifier(order.column, 'ORDER BY column');
      return sql.raw(`${quoteIdentifier(order.column, input.vendor)} ${order.direction.toUpperCase()}`);
    });
    query = sql.join(
      [query, sql.raw(' ORDER BY '), sql.join(orderClauses, sql.raw(', '))],
      sql.raw('')
    );
  }

  if (input.limit !== undefined) {
    query = sql.join([query, sql` LIMIT ${input.limit}`], sql.raw(''));
  }

  if (input.offset !== undefined) {
    query = sql.join([query, sql` OFFSET ${input.offset}`], sql.raw(''));
  }

  return query;
}
