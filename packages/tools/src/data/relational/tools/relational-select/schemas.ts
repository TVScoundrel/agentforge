/**
 * Zod schemas for relational SELECT operations
 * @module tools/relational-select/schemas
 */

import { z } from 'zod';

/**
 * WHERE condition operator types
 */
export const whereOperatorSchema = z.enum([
  'eq',      // equals
  'ne',      // not equals
  'gt',      // greater than
  'lt',      // less than
  'gte',     // greater than or equal
  'lte',     // less than or equal
  'like',    // LIKE pattern matching
  'in',      // IN array
  'notIn',   // NOT IN array
  'isNull',  // IS NULL
  'isNotNull' // IS NOT NULL
]);

/**
 * WHERE condition schema
 */
export const whereConditionSchema = z.object({
  column: z.string().min(1, 'Column name must not be empty').describe('Column name to filter on'),
  operator: whereOperatorSchema.describe('Comparison operator'),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number()])),
    z.null()
  ]).optional().describe('Value to compare against (not required for isNull/isNotNull)')
}).superRefine((val, ctx) => {
  const op = val.operator;

  if (op === 'isNull' || op === 'isNotNull') {
    if (val.value !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'value must not be provided when using isNull or isNotNull operator',
      });
    }
    return;
  }

  // All other operators require a value
  if (val.value === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'value is required for this operator',
    });
  }

  // IN/NOT IN operators require a non-empty array
  if (op === 'in' || op === 'notIn') {
    if (!Array.isArray(val.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: `${op === 'in' ? 'IN' : 'NOT IN'} operator requires an array value`,
      });
    } else if (val.value.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: `${op === 'in' ? 'IN' : 'NOT IN'} operator requires a non-empty array value`,
      });
    }
  }
});

/**
 * ORDER BY direction
 */
export const orderDirectionSchema = z.enum(['asc', 'desc']);

/**
 * ORDER BY clause schema
 */
export const orderBySchema = z.object({
  column: z.string().describe('Column name to order by'),
  direction: orderDirectionSchema.describe('Sort direction (ascending or descending)')
});

/**
 * Relational SELECT tool input schema
 */
export const relationalSelectSchema = z.object({
  table: z.string().min(1, 'Table name is required').describe('Table name to select from'),
  columns: z.array(z.string().min(1, 'Column name must not be empty')).optional().describe('Columns to select (omit for SELECT *)'),
  where: z.array(whereConditionSchema).optional().describe('WHERE conditions (combined with AND)'),
  orderBy: z.array(orderBySchema).optional().describe('ORDER BY clauses'),
  limit: z.number().int().positive().optional().describe('Maximum number of rows to return'),
  offset: z.number().int().nonnegative().optional().describe('Number of rows to skip'),
  vendor: z.enum(['postgresql', 'mysql', 'sqlite']).describe('Database vendor'),
  connectionString: z.string().min(1, 'Database connection string is required').describe('Database connection string')
});

