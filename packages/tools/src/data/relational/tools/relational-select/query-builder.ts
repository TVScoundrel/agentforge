/**
 * Query builder for relational SELECT operations
 * @module tools/relational-select/query-builder
 */

import { sql, type SQL } from 'drizzle-orm';
import type { RelationalSelectInput, WhereCondition } from './types.js';

/**
 * Build a WHERE condition SQL fragment
 */
function buildWhereCondition(condition: WhereCondition): SQL {
  const column = sql.raw(`"${condition.column}"`);

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
    case 'in':
      if (!Array.isArray(condition.value)) {
        throw new Error(`IN operator requires an array value for column ${condition.column}`);
      }
      return sql`${column} IN ${condition.value}`;
    case 'notIn':
      if (!Array.isArray(condition.value)) {
        throw new Error(`NOT IN operator requires an array value for column ${condition.column}`);
      }
      return sql`${column} NOT IN ${condition.value}`;
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
    query = sql.join([query, sql.raw(input.columns.map(c => `"${c}"`).join(', '))], sql.raw(''));
  } else {
    query = sql.join([query, sql.raw('*')], sql.raw(''));
  }

  // Add FROM clause
  query = sql.join([query, sql.raw(` FROM "${input.table}"`)], sql.raw(''));

  // Add WHERE conditions
  if (input.where && input.where.length > 0) {
    const whereConditions: SQL[] = input.where.map(buildWhereCondition);

    if (whereConditions.length > 0) {
      query = sql.join([query, sql.raw(' WHERE '), sql.join(whereConditions, sql.raw(' AND '))], sql.raw(''));
    }
  }

  // Add ORDER BY
  if (input.orderBy && input.orderBy.length > 0) {
    const orderClauses = input.orderBy.map(order => {
      const direction = order.direction.toUpperCase();
      return sql.raw(`"${order.column}" ${direction}`);
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

