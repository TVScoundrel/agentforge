import { sql, type SQL } from 'drizzle-orm';
import {
  quoteIdentifier,
  quoteQualifiedIdentifier,
  validateIdentifier,
  validateQualifiedIdentifier,
} from '../utils/identifier-utils.js';
import { buildWhereCondition } from './query-builder-conditions.js';
import type { SelectQueryInput } from './query-builder-types.js';

export function buildSelectQuery(input: SelectQueryInput): SQL {
  validateQualifiedIdentifier(input.table, 'Table name');

  let query = sql.raw('SELECT ');

  if (input.columns && input.columns.length > 0) {
    input.columns.forEach(column => validateIdentifier(column, 'SELECT column'));
    query = sql.join(
      [query, sql.raw(input.columns.map(column => quoteIdentifier(column, input.vendor)).join(', '))],
      sql.raw(''),
    );
  } else {
    query = sql.join([query, sql.raw('*')], sql.raw(''));
  }

  query = sql.join(
    [query, sql.raw(` FROM ${quoteQualifiedIdentifier(input.table, input.vendor)}`)],
    sql.raw(''),
  );

  if (input.where && input.where.length > 0) {
    const whereConditions = input.where.map(condition =>
      buildWhereCondition(condition, input.vendor),
    );
    query = sql.join(
      [query, sql.raw(' WHERE '), sql.join(whereConditions, sql.raw(' AND '))],
      sql.raw(''),
    );
  }

  if (input.orderBy && input.orderBy.length > 0) {
    const orderClauses = input.orderBy.map(order => {
      validateIdentifier(order.column, 'ORDER BY column');
      return sql.raw(`${quoteIdentifier(order.column, input.vendor)} ${order.direction.toUpperCase()}`);
    });
    query = sql.join(
      [query, sql.raw(' ORDER BY '), sql.join(orderClauses, sql.raw(', '))],
      sql.raw(''),
    );
  }

  if (input.limit !== undefined) {
    query = sql.join([query, sql` LIMIT ${input.limit}`], sql.raw(''));
  } else if (input.offset !== undefined && input.vendor === 'sqlite') {
    query = sql.join([query, sql` LIMIT -1`], sql.raw(''));
  }

  if (input.offset !== undefined) {
    query = sql.join([query, sql` OFFSET ${input.offset}`], sql.raw(''));
  }

  return query;
}
