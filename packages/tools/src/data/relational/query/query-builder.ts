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
