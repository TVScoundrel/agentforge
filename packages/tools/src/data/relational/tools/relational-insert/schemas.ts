/**
 * Zod schemas for relational INSERT operations
 * @module tools/relational-insert/schemas
 */

import { z } from 'zod';

/**
 * Valid schema-qualified identifier pattern (e.g., "public.users")
 */
const VALID_QUALIFIED_IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;

/**
 * Scalar values accepted for INSERT payloads.
 */
export const insertValueSchema = z.union([
  z.string().describe('String value'),
  z.number().describe('Numeric value'),
  z.boolean().describe('Boolean value'),
  z.null().describe('Null value'),
]).describe('Scalar value for an INSERT column');

/**
 * INSERT row payload schema.
 *
 * Empty objects are allowed to support INSERT ... DEFAULT VALUES.
 */
export const insertRowSchema = z.record(
  z.string().min(1, 'Column name must not be empty').describe('Column name'),
  insertValueSchema
).describe('One row object where keys are column names and values are scalar values');

/**
 * INSERT RETURNING mode schema.
 */
export const insertReturningModeSchema = z.enum(['none', 'id', 'row']);

/**
 * INSERT RETURNING options schema.
 */
export const insertReturningSchema = z.object({
  mode: insertReturningModeSchema.default('none').describe('Returning mode: none, id, or full row'),
  idColumn: z.string().min(1, 'idColumn must not be empty').optional().describe('Primary key column to return when mode is "id"'),
}).superRefine((value, ctx) => {
  if (value.idColumn && value.mode !== 'id') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['idColumn'],
      message: 'idColumn can only be provided when returning.mode is "id"',
    });
  }
});

/**
 * Relational INSERT tool input schema.
 */
export const relationalInsertSchema = z.object({
  table: z.string()
    .min(1, 'Table name is required')
    .regex(
      VALID_QUALIFIED_IDENTIFIER_PATTERN,
      'Table name contains invalid characters. Only alphanumeric characters, underscores, and dots (for schema qualification) are allowed.'
    )
    .describe('Table name to insert into (schema-qualified names supported, e.g. public.users)'),
  data: z.union([
    insertRowSchema,
    z.array(insertRowSchema).min(1, 'Insert data array must not be empty'),
  ]).describe('Single row object or array of row objects to insert'),
  returning: insertReturningSchema.optional().describe('Optional RETURNING behavior'),
  vendor: z.enum(['postgresql', 'mysql', 'sqlite']).describe('Database vendor'),
  connectionString: z.string().min(1, 'Database connection string is required').describe('Database connection string'),
});
