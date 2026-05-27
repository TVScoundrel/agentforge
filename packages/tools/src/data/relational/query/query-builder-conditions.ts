import { sql, type SQL } from 'drizzle-orm';
import type { DatabaseVendor } from '../types.js';
import { quoteIdentifier, validateIdentifier } from '../utils/identifier-utils.js';
import type {
  DeleteWhereCondition,
  SelectWhereCondition,
  UpdateWhereCondition,
} from './query-builder-types.js';

type QueryWhereCondition =
  | UpdateWhereCondition
  | DeleteWhereCondition
  | SelectWhereCondition;

export function buildWhereCondition(
  condition: QueryWhereCondition,
  vendor?: DatabaseVendor,
): SQL {
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
      return sql`${column} IN (${sql.join(condition.value.map(value => sql`${value}`), sql.raw(', '))})`;
    case 'notIn':
      if (!Array.isArray(condition.value) || condition.value.length === 0) {
        throw new Error(`NOT IN operator requires a non-empty array value for column ${condition.column}`);
      }
      return sql`${column} NOT IN (${sql.join(condition.value.map(value => sql`${value}`), sql.raw(', '))})`;
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
