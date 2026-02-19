/**
 * Zod schemas for relational SELECT operations
 * @module tools/relational-select/schemas
 */

import { z } from 'zod';
import { VALID_QUALIFIED_IDENTIFIER_PATTERN } from '../../utils/identifier-utils.js';

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
    return;
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
    return;
  }

  // Operators other than IS NULL/IS NOT NULL should not use null values.
  // Use explicit null operators to avoid generating invalid SQL like "column = NULL".
  if (val.value === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'null is only allowed with isNull/isNotNull operators',
    });
    return;
  }

  if (op === 'like' && typeof val.value !== 'string') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'LIKE operator requires a string value',
    });
    return;
  }

  if ((op === 'gt' || op === 'lt' || op === 'gte' || op === 'lte') &&
      typeof val.value !== 'string' &&
      typeof val.value !== 'number') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: `${op.toUpperCase()} operator requires a string or number value`,
    });
    return;
  }

  if ((op === 'eq' || op === 'ne') && Array.isArray(val.value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: `${op.toUpperCase()} operator requires a scalar value`,
    });
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
  column: z.string().min(1, 'Column name must not be empty').describe('Column name to order by'),
  direction: orderDirectionSchema.describe('Sort direction (ascending or descending)')
});

/**
 * Optional streaming configuration
 */
export const streamingOptionsSchema = z.object({
  enabled: z.boolean().default(true).describe('Enable chunked streaming mode for large result sets'),
  chunkSize: z.number().int().min(1).max(5000).optional().describe('Rows fetched per chunk (default: 100)'),
  maxRows: z.number().int().positive().optional().describe('Optional cap on streamed rows'),
  sampleSize: z.number().int().min(0).max(5000).optional().describe('Number of rows to include in the response payload'),
  benchmark: z.boolean().optional().default(false).describe('Run memory benchmark comparing regular vs streaming execution (adds two extra query executions; use side-effect-free SELECT statements)')
});

/**
 * Relational SELECT tool input schema
 */
export const relationalSelectSchema = z.object({
  table: z.string()
    .min(1, 'Table name is required')
    .regex(
      VALID_QUALIFIED_IDENTIFIER_PATTERN,
      'Table name contains invalid characters. Only alphanumeric characters, underscores, and dots (for schema qualification) are allowed.'
    )
    .describe('Table name to select from (schema-qualified names supported, e.g. public.users)'),
  columns: z.array(z.string().min(1, 'Column name must not be empty')).min(1, 'Columns array must not be empty').optional().describe('Columns to select (omit for SELECT *)'),
  where: z.array(whereConditionSchema).optional().describe('WHERE conditions (combined with AND)'),
  orderBy: z.array(orderBySchema).optional().describe('ORDER BY clauses'),
  limit: z.number().int().positive().optional().describe('Maximum number of rows to return'),
  offset: z.number().int().nonnegative().optional().describe('Number of rows to skip'),
  streaming: streamingOptionsSchema.optional().describe('Optional streaming mode configuration'),
  vendor: z.enum(['postgresql', 'mysql', 'sqlite']).describe('Database vendor'),
  connectionString: z.string().min(1, 'Database connection string is required').describe('Database connection string')
});
