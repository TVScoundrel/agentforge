/**
 * Query builder for relational SELECT operations
 * @module tools/relational-select/query-builder
 */

import { sql, type SQL } from 'drizzle-orm';
import type { RelationalSelectInput, WhereCondition } from './types.js';
import type { DatabaseVendor } from '../../types.js';
import { validateIdentifier, validateQualifiedIdentifier, quoteIdentifier, quoteQualifiedIdentifier } from './identifier-utils.js';

/**
 * Build a WHERE condition SQL fragment
 */
function buildWhereCondition(condition: WhereCondition, vendor?: DatabaseVendor): SQL {
  validateIdentifier(condition.column, 'WHERE column');
  const column = sql.raw(quoteIdentifier(condition.column, vendor));

  switch (condition.operator) {
    case 'eq':
      return sql`${column} = ${condition.value}`;
    case 'ne':
      return sql`${column} != ${condition.value}`;
    case 'gt':
      return sql`${column} > ${condition.value}`;
    case 'lt':
      return sql`${column} < ${condition.value}`;
    case 'gte':
      return sql`${column} >= ${condition.value}`;
    case 'lte':
      return sql`${column} <= ${condition.value}`;
    case 'like':
      return sql`${column} LIKE ${condition.value}`;
    case 'in': {
      if (!Array.isArray(condition.value) || condition.value.length === 0) {
        throw new Error(`IN operator requires a non-empty array value for column ${condition.column}`);
      }
      const inValues = condition.value.map((v) => sql`${v}`);
      return sql`${column} IN (${sql.join(inValues, sql.raw(', '))})`;
    }
    case 'notIn': {
      if (!Array.isArray(condition.value) || condition.value.length === 0) {
        throw new Error(`NOT IN operator requires a non-empty array value for column ${condition.column}`);
      }
      const notInValues = condition.value.map((v) => sql`${v}`);
      return sql`${column} NOT IN (${sql.join(notInValues, sql.raw(', '))})`;
    }
    case 'isNull':
      return sql`${column} IS NULL`;
    case 'isNotNull':
      return sql`${column} IS NOT NULL`;
  }
}

/**
 * Build a complete SELECT query using Drizzle's sql template
 */
export function buildSelectQuery(input: RelationalSelectInput): SQL {
  // Start with SELECT clause
  let query = sql.raw('SELECT ');

  // Add columns
  if (input.columns && input.columns.length > 0) {
    input.columns.forEach(c => validateIdentifier(c, 'SELECT column'));
    query = sql.join([query, sql.raw(input.columns.map(c => quoteIdentifier(c, input.vendor)).join(', '))], sql.raw(''));
  } else {
    query = sql.join([query, sql.raw('*')], sql.raw(''));
  }

  // Add FROM clause
  validateQualifiedIdentifier(input.table, 'Table name');
  query = sql.join([query, sql.raw(` FROM ${quoteQualifiedIdentifier(input.table, input.vendor)}`)], sql.raw(''));

  // Add WHERE conditions
  if (input.where && input.where.length > 0) {
    const whereConditions: SQL[] = input.where.map(w => buildWhereCondition(w, input.vendor));

    if (whereConditions.length > 0) {
      query = sql.join([query, sql.raw(' WHERE '), sql.join(whereConditions, sql.raw(' AND '))], sql.raw(''));
    }
  }

  // Add ORDER BY
  if (input.orderBy && input.orderBy.length > 0) {
    const orderClauses = input.orderBy.map(order => {
      validateIdentifier(order.column, 'ORDER BY column');
      const direction = order.direction.toUpperCase();
      return sql.raw(`${quoteIdentifier(order.column, input.vendor)} ${direction}`);
    });
    query = sql.join([query, sql.raw(' ORDER BY '), sql.join(orderClauses, sql.raw(', '))], sql.raw(''));
  }

  // Add LIMIT
  if (input.limit !== undefined) {
    query = sql.join([query, sql` LIMIT ${input.limit}`], sql.raw(''));
  }

  // Add OFFSET
  if (input.offset !== undefined) {
    query = sql.join([query, sql` OFFSET ${input.offset}`], sql.raw(''));
  }

  return query;
}

