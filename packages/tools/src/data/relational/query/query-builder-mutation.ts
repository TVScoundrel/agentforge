import { sql } from 'drizzle-orm';
import {
  quoteIdentifier,
  quoteQualifiedIdentifier,
  validateIdentifier,
  validateQualifiedIdentifier,
} from '../utils/identifier-utils.js';
import { buildWhereCondition } from './query-builder-conditions.js';
import type {
  BuiltDeleteQuery,
  BuiltUpdateQuery,
  DeleteQueryInput,
  UpdateData,
  UpdateQueryInput,
} from './query-builder-types.js';

function normalizeUpdateData(data: UpdateData): UpdateData {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Update data must be an object');
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    throw new Error('Update data must not be empty');
  }

  keys.forEach(column => {
    validateIdentifier(column, 'Update column');

    if (data[column] === undefined) {
      throw new Error(`Update value for column "${column}" must not be undefined`);
    }
  });

  return data;
}

export function buildUpdateQuery(input: UpdateQueryInput): BuiltUpdateQuery {
  validateQualifiedIdentifier(input.table, 'Table name');
  const normalizedData = normalizeUpdateData(input.data);

  const setClauses = Object.entries(normalizedData).map(([column, value]) => {
    const quotedColumn = sql.raw(quoteIdentifier(column, input.vendor));
    return sql`${quotedColumn} = ${value}`;
  });

  const whereConditions = (input.where ?? []).map(condition =>
    buildWhereCondition(condition, input.vendor),
  );

  if (input.optimisticLock) {
    validateIdentifier(input.optimisticLock.column, 'Optimistic lock column');
    if (
      input.optimisticLock.expectedValue === undefined ||
      input.optimisticLock.expectedValue === null
    ) {
      throw new Error('Optimistic lock expectedValue must not be empty');
    }
    const lockColumn = sql.raw(quoteIdentifier(input.optimisticLock.column, input.vendor));
    whereConditions.push(sql`${lockColumn} = ${input.optimisticLock.expectedValue}`);
  }

  if (whereConditions.length === 0 && !input.allowFullTableUpdate) {
    throw new Error(
      'WHERE conditions are required for UPDATE queries. Set allowFullTableUpdate=true to override.',
    );
  }

  let query = sql.join(
    [
      sql.raw(`UPDATE ${quoteQualifiedIdentifier(input.table, input.vendor)} SET `),
      sql.join(setClauses, sql.raw(', ')),
    ],
    sql.raw(''),
  );

  if (whereConditions.length > 0) {
    query = sql.join(
      [query, sql.raw(' WHERE '), sql.join(whereConditions, sql.raw(' AND '))],
      sql.raw(''),
    );
  }

  return {
    query,
    whereApplied: whereConditions.length > 0,
    usesOptimisticLock: !!input.optimisticLock,
  };
}

export function buildDeleteQuery(input: DeleteQueryInput): BuiltDeleteQuery {
  validateQualifiedIdentifier(input.table, 'Table name');

  const whereConditions = (input.where ?? []).map(condition =>
    buildWhereCondition(condition, input.vendor),
  );

  if (whereConditions.length === 0 && !input.allowFullTableDelete) {
    throw new Error(
      'WHERE conditions are required for DELETE queries. Set allowFullTableDelete=true to override.',
    );
  }

  const softDeleteColumn = input.softDelete?.column ?? 'deleted_at';
  const softDeleteValue = input.softDelete?.value ?? new Date().toISOString();

  let query;
  if (input.softDelete) {
    validateIdentifier(softDeleteColumn, 'Soft delete column');
    const quotedColumn = sql.raw(quoteIdentifier(softDeleteColumn, input.vendor));
    query = sql.join(
      [
        sql.raw(`UPDATE ${quoteQualifiedIdentifier(input.table, input.vendor)} SET `),
        sql`${quotedColumn} = ${softDeleteValue}`,
      ],
      sql.raw(''),
    );
  } else {
    query = sql.raw(`DELETE FROM ${quoteQualifiedIdentifier(input.table, input.vendor)}`);
  }

  if (whereConditions.length > 0) {
    query = sql.join(
      [query, sql.raw(' WHERE '), sql.join(whereConditions, sql.raw(' AND '))],
      sql.raw(''),
    );
  }

  return {
    query,
    whereApplied: whereConditions.length > 0,
    usesSoftDelete: !!input.softDelete,
    softDeleteColumn: input.softDelete ? softDeleteColumn : undefined,
  };
}
