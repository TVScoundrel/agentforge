/**
 * Zod schemas for relational DELETE operations
 * @module tools/relational-delete/schemas
 */

import { z } from 'zod';
import { VALID_QUALIFIED_IDENTIFIER_PATTERN } from '../../utils/identifier-utils.js';

export const deleteWhereOperatorSchema = z.enum([
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

export const deleteWhereConditionSchema = z.object({
  column: z.string().min(1, 'Column name must not be empty').describe('Column name to filter on'),
  operator: deleteWhereOperatorSchema.describe('Comparison operator'),
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
  }
});

export const deleteSoftDeleteSchema = z.object({
  column: z.string().min(1, 'Soft delete column must not be empty').default('deleted_at').describe('Column to write deletion timestamp/value into'),
  value: z.union([z.string(), z.number()]).optional().describe('Optional explicit value for the soft-delete column (defaults to ISO timestamp)'),
}).describe('Enable soft delete by updating a column instead of physically deleting rows');

export const relationalDeleteSchema = z.object({
  table: z.string()
    .min(1, 'Table name is required')
    .regex(
      VALID_QUALIFIED_IDENTIFIER_PATTERN,
      'Table name contains invalid characters. Only alphanumeric characters, underscores, and dots (for schema qualification) are allowed.'
    )
    .describe('Table name to delete from (schema-qualified names supported, e.g. public.users)'),
  where: z.array(deleteWhereConditionSchema).optional().describe('WHERE conditions (combined with AND)'),
  allowFullTableDelete: z.boolean().default(false).describe('Explicitly allow DELETE without WHERE conditions'),
  cascade: z.boolean().default(false).describe('Enable cascade-aware error messaging for foreign key constraints'),
  softDelete: deleteSoftDeleteSchema.optional().describe('Use soft-delete semantics instead of hard DELETE'),
  vendor: z.enum(['postgresql', 'mysql', 'sqlite']).describe('Database vendor'),
  connectionString: z.string().min(1, 'Database connection string is required').describe('Database connection string'),
}).superRefine((value, ctx) => {
  const hasWhere = (value.where?.length ?? 0) > 0;

  if (!value.allowFullTableDelete && !hasWhere) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['where'],
      message: 'WHERE conditions are required unless allowFullTableDelete is true',
    });
  }
});
