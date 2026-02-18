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
  column: z.string().describe('Column name to filter on'),
  operator: whereOperatorSchema.describe('Comparison operator'),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number()])),
    z.null()
  ]).optional().describe('Value to compare against (not required for isNull/isNotNull)')
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
  table: z.string().describe('Table name to select from'),
  columns: z.array(z.string()).optional().describe('Columns to select (omit for SELECT *)'),
  where: z.array(whereConditionSchema).optional().describe('WHERE conditions (combined with AND)'),
  orderBy: z.array(orderBySchema).optional().describe('ORDER BY clauses'),
  limit: z.number().int().positive().optional().describe('Maximum number of rows to return'),
  offset: z.number().int().nonnegative().optional().describe('Number of rows to skip'),
  vendor: z.enum(['postgresql', 'mysql', 'sqlite']).describe('Database vendor'),
  connectionString: z.string().describe('Database connection string')
});

