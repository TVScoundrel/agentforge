import { sql, type SQL } from 'drizzle-orm';
import {
  quoteIdentifier,
  quoteQualifiedIdentifier,
  validateIdentifier,
  validateQualifiedIdentifier,
} from '../utils/identifier-utils.js';
import type {
  BuiltInsertQuery,
  InsertData,
  InsertQueryInput,
  InsertReturningMode,
  InsertRow,
} from './query-builder-types.js';

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

  rows.forEach(row => {
    Object.keys(row).forEach(column => {
      if (!seen.has(column)) {
        seen.add(column);
        orderedColumns.push(column);
      }
    });
  });

  return orderedColumns;
}

function buildValuesTuple(columns: string[], row: InsertRow): SQL {
  const valueFragments = columns.map(column => {
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
    sql.raw(''),
  );
}

function rowsHaveHomogeneousColumns(rows: InsertRow[]): boolean {
  if (rows.length <= 1) return true;
  const firstKeys = Object.keys(rows[0]).sort().join(',');
  return rows.every(row => Object.keys(row).sort().join(',') === firstKeys);
}

function buildSingleRowInsert(
  table: string,
  row: InsertRow,
  vendor: InsertQueryInput['vendor'],
): SQL {
  const columns = Object.keys(row);

  if (columns.length === 0) {
    return sql.raw(`INSERT INTO ${quoteQualifiedIdentifier(table, vendor)} DEFAULT VALUES`);
  }

  columns.forEach(column => validateIdentifier(column, 'Insert column'));
  const quotedColumns = columns.map(column => quoteIdentifier(column, vendor)).join(', ');

  const valueFragments = columns.map(column => {
    const value = row[column];
    if (value === undefined) {
      throw new Error(`Insert value for column "${column}" must not be undefined`);
    }
    return sql`${value}`;
  });

  return sql.join(
    [
      sql.raw(
        `INSERT INTO ${quoteQualifiedIdentifier(table, vendor)} (${quotedColumns}) VALUES (`,
      ),
      sql.join(valueFragments, sql.raw(', ')),
      sql.raw(')'),
    ],
    sql.raw(''),
  );
}

function buildInsertValuesQuery(
  table: string,
  columns: string[],
  rows: InsertRow[],
  vendor: InsertQueryInput['vendor'],
): SQL | SQL[] {
  if (vendor === 'sqlite' && !rowsHaveHomogeneousColumns(rows)) {
    return rows.map(row => buildSingleRowInsert(table, row, vendor));
  }

  const quotedColumns = columns.map(column => quoteIdentifier(column, vendor)).join(', ');
  const rowTuples = rows.map(row => buildValuesTuple(columns, row));

  return sql.join(
    [
      sql.raw(
        `INSERT INTO ${quoteQualifiedIdentifier(table, vendor)} (${quotedColumns}) VALUES `,
      ),
      sql.join(rowTuples, sql.raw(', ')),
    ],
    sql.raw(''),
  );
}

function buildInsertDefaultValuesQuery(
  table: string,
  rowCount: number,
  vendor: InsertQueryInput['vendor'],
): SQL {
  if (rowCount > 1) {
    throw new Error('Batch INSERT with only DEFAULT VALUES is not supported');
  }

  return sql.raw(`INSERT INTO ${quoteQualifiedIdentifier(table, vendor)} DEFAULT VALUES`);
}

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

  columns.forEach(column => validateIdentifier(column, 'Insert column'));

  const valuesResult =
    columns.length > 0
      ? buildInsertValuesQuery(input.table, columns, rows, input.vendor)
      : buildInsertDefaultValuesQuery(input.table, rows.length, input.vendor);

  if (Array.isArray(valuesResult)) {
    let queries: SQL[] = valuesResult;

    if (returningMode !== 'none' && supportsReturning) {
      const returningClause =
        returningMode === 'id'
          ? sql.raw(` RETURNING ${quoteIdentifier(idColumn, input.vendor)}`)
          : sql.raw(' RETURNING *');

      queries = queries.map(query => sql.join([query, returningClause], sql.raw('')));
    }

    return {
      query: queries,
      rows,
      returningMode,
      idColumn,
      supportsReturning,
    };
  }

  let query: SQL = valuesResult;

  if (returningMode !== 'none' && supportsReturning) {
    query =
      returningMode === 'id'
        ? sql.join(
            [query, sql.raw(` RETURNING ${quoteIdentifier(idColumn, input.vendor)}`)],
            sql.raw(''),
          )
        : sql.join([query, sql.raw(' RETURNING *')], sql.raw(''));
  }

  return {
    query,
    rows,
    returningMode,
    idColumn,
    supportsReturning,
  };
}
