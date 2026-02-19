/**
 * Zod schemas for relational UPDATE operations
 * @module tools/relational-update/schemas
 */

import { z } from 'zod';
import { VALID_QUALIFIED_IDENTIFIER_PATTERN } from '../../utils/identifier-utils.js';

/**
 * Scalar values accepted for UPDATE payloads.
 */
export const updateValueSchema = z.union([
  z.string().describe('String value'),
  z.number().describe('Numeric value'),
  z.boolean().describe('Boolean value'),
  z.null().describe('Null value'),
]).describe('Scalar value for an UPDATE column');

/**
 * UPDATE payload schema.
 */
export const updateDataSchema = z.record(
  z.string().min(1, 'Column name must not be empty').describe('Column name'),
  updateValueSchema
).superRefine((value, ctx) => {
  if (Object.keys(value).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Update data must not be empty',
    });
  }
}).describe('Object containing column-value pairs to update');

/**
 * WHERE condition operators.
 */
export const updateWhereOperatorSchema = z.enum([
  'eq',
  'ne',
  'gt',
  'lt',
  'gte',
  'lte',
  'like',
  'in',
  'notIn',
  'isNull',
  'isNotNull',
]);

/**
 * WHERE condition schema.
 */
export const updateWhereConditionSchema = z.object({
  column: z.string().min(1, 'Column name must not be empty').describe('Column name to filter on'),
  operator: updateWhereOperatorSchema.describe('Comparison operator'),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number()])),
    z.null(),
  ]).optional().describe('Value to compare against (not required for isNull/isNotNull)'),
}).superRefine((value, ctx) => {
  const op = value.operator;

  if (op === 'isNull' || op === 'isNotNull') {
    if (value.value !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'value must not be provided when using isNull or isNotNull operator',
      });
    }
    return;
  }

  if (value.value === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'value is required for this operator',
    });
    return;
  }

  if (op === 'in' || op === 'notIn') {
    if (!Array.isArray(value.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: `${op === 'in' ? 'IN' : 'NOT IN'} operator requires an array value`,
      });
    } else if (value.value.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: `${op === 'in' ? 'IN' : 'NOT IN'} operator requires a non-empty array value`,
      });
    }
    return;
  }

  if (value.value === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'null is only allowed with isNull/isNotNull operators',
    });
    return;
  }

  if (op === 'like' && typeof value.value !== 'string') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'LIKE operator requires a string value',
    });
    return;
  }

  if ((op === 'gt' || op === 'lt' || op === 'gte' || op === 'lte') &&
      typeof value.value !== 'string' &&
      typeof value.value !== 'number') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: `${op.toUpperCase()} operator requires a string or number value`,
    });
  }
});

/**
 * Optimistic lock schema.
 */
export const updateOptimisticLockSchema = z.object({
  column: z.string().min(1, 'Optimistic lock column must not be empty').describe('Version or lock column name'),
  expectedValue: z.union([
    z.string().describe('Expected string version value'),
    z.number().describe('Expected numeric version value'),
  ]).describe('Expected current value for the lock column'),
}).describe('Optional optimistic lock condition');

/**
 * Relational UPDATE tool input schema.
 */
export const relationalUpdateSchema = z.object({
  table: z.string()
    .min(1, 'Table name is required')
    .regex(
      VALID_QUALIFIED_IDENTIFIER_PATTERN,
      'Table name contains invalid characters. Only alphanumeric characters, underscores, and dots (for schema qualification) are allowed.'
    )
    .describe('Table name to update (schema-qualified names supported, e.g. public.users)'),
  data: updateDataSchema.describe('Columns and values to update'),
  where: z.array(updateWhereConditionSchema).optional().describe('WHERE conditions (combined with AND)'),
  allowFullTableUpdate: z.boolean().default(false).describe('Explicitly allow UPDATE without WHERE conditions'),
  optimisticLock: updateOptimisticLockSchema.optional().describe('Optional optimistic locking condition'),
  vendor: z.enum(['postgresql', 'mysql', 'sqlite']).describe('Database vendor'),
  connectionString: z.string().min(1, 'Database connection string is required').describe('Database connection string'),
}).superRefine((value, ctx) => {
  const hasWhere = (value.where?.length ?? 0) > 0;
  const hasOptimisticLock = !!value.optimisticLock;

  if (!value.allowFullTableUpdate && !hasWhere && !hasOptimisticLock) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['where'],
      message: 'WHERE conditions are required unless allowFullTableUpdate is true',
    });
  }
});
