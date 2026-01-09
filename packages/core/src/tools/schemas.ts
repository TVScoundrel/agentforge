/**
 * Tool System Schemas
 * 
 * Zod schemas for runtime validation of tool metadata and configuration.
 * 
 * Why Zod schemas?
 * - Runtime validation: Catch errors when tools are created
 * - Type inference: TypeScript types are automatically inferred
 * - Great errors: Clear messages when validation fails
 * - JSON Schema: Can convert to JSON Schema for LangChain
 */

import { z } from 'zod';
import { ToolCategory } from './types.js';

/**
 * Schema for ToolCategory
 * 
 * This validates that a value is one of the valid ToolCategory enum values.
 * 
 * Example:
 * ```ts
 * ToolCategorySchema.parse('file-system');  // ✅ Valid
 * ToolCategorySchema.parse('invalid');      // ❌ Throws ZodError
 * ```
 */
export const ToolCategorySchema = z.nativeEnum(ToolCategory, {
  errorMap: () => ({
    message: `Must be a valid ToolCategory: ${Object.values(ToolCategory).join(', ')}`,
  }),
});

/**
 * Schema for ToolExample
 * 
 * Validates the structure of tool usage examples.
 * 
 * Example:
 * ```ts
 * ToolExampleSchema.parse({
 *   description: 'Read a file',
 *   input: { path: './file.txt' },
 *   output: 'file contents',
 *   explanation: 'Reads and returns file contents'
 * });
 * ```
 */
export const ToolExampleSchema = z.object({
  /**
   * Description must be a non-empty string
   */
  description: z.string().min(1, 'Example description cannot be empty'),

  /**
   * Input must be an object (can have any properties)
   */
  input: z.record(z.unknown()),

  /**
   * Output is optional and can be anything
   */
  output: z.unknown().optional(),

  /**
   * Explanation is optional but must be non-empty if provided
   */
  explanation: z.string().min(1).optional(),
});

/**
 * Schema for ToolRelations
 *
 * Validates tool relationship definitions.
 * All fields are optional arrays of tool names.
 *
 * Example:
 * ```ts
 * ToolRelationsSchema.parse({
 *   requires: ['view-file'],
 *   suggests: ['run-tests', 'format-code'],
 *   conflicts: ['delete-file'],
 *   follows: ['search-codebase'],
 *   precedes: ['run-tests']
 * });
 * ```
 */
export const ToolRelationsSchema = z.object({
  /**
   * Tools that must be called before this tool
   */
  requires: z.array(z.string().min(1)).optional(),

  /**
   * Tools that work well with this tool
   */
  suggests: z.array(z.string().min(1)).optional(),

  /**
   * Tools that conflict with this tool
   */
  conflicts: z.array(z.string().min(1)).optional(),

  /**
   * Tools this typically follows in a workflow
   */
  follows: z.array(z.string().min(1)).optional(),

  /**
   * Tools this typically precedes in a workflow
   */
  precedes: z.array(z.string().min(1)).optional(),
});

/**
 * Schema for tool names
 * 
 * Tool names must be:
 * - Lowercase letters, numbers, and hyphens only
 * - Start with a letter
 * - Not start or end with a hyphen
 * - Between 2 and 50 characters
 * 
 * Valid: 'read-file', 'http-request', 'query-db'
 * Invalid: 'ReadFile', 'read_file', '-read-file', 'r'
 */
export const ToolNameSchema = z
  .string()
  .min(2, 'Tool name must be at least 2 characters')
  .max(50, 'Tool name must be at most 50 characters')
  .regex(
    /^[a-z][a-z0-9-]*[a-z0-9]$/,
    'Tool name must be kebab-case (lowercase letters, numbers, hyphens only, must start with a letter)'
  );

/**
 * Schema for ToolMetadata
 * 
 * Validates all tool metadata fields with appropriate constraints.
 * 
 * Example:
 * ```ts
 * ToolMetadataSchema.parse({
 *   name: 'read-file',
 *   description: 'Read a file from the file system',
 *   category: ToolCategory.FILE_SYSTEM,
 *   tags: ['file', 'read'],
 *   examples: [{ description: 'Read README', input: { path: './README.md' } }]
 * });
 * ```
 */
export const ToolMetadataSchema = z.object({
  // ===== REQUIRED FIELDS =====

  /**
   * Tool name - must be valid kebab-case
   */
  name: ToolNameSchema,

  /**
   * Description - must be meaningful (at least 10 characters)
   */
  description: z
    .string()
    .min(10, 'Tool description must be at least 10 characters')
    .max(500, 'Tool description must be at most 500 characters'),

  /**
   * Category - must be a valid ToolCategory
   */
  category: ToolCategorySchema,

  // ===== OPTIONAL FIELDS =====

  /**
   * Display name - if provided, must be non-empty
   */
  displayName: z.string().min(1).optional(),

  /**
   * Tags - array of non-empty strings
   */
  tags: z.array(z.string().min(1)).optional(),

  /**
   * Examples - array of valid ToolExample objects
   */
  examples: z.array(ToolExampleSchema).optional(),

  /**
   * Usage notes - if provided, must be meaningful
   */
  usageNotes: z.string().min(10).optional(),

  /**
   * Limitations - array of non-empty strings
   */
  limitations: z.array(z.string().min(1)).optional(),

  /**
   * Version - if provided, should follow semver format
   * Examples: '1.0.0', '2.1.3', '0.1.0-beta', '1.0.0-alpha.1'
   */
  version: z
    .string()
    .regex(
      /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i,
      'Version should follow semantic versioning (e.g., 1.0.0)'
    )
    .optional(),

  /**
   * Author - if provided, must be non-empty
   */
  author: z.string().min(1).optional(),

  /**
   * Deprecated flag
   */
  deprecated: z.boolean().optional(),

  /**
   * Replacement tool name - if provided, must be valid tool name
   */
  replacedBy: ToolNameSchema.optional(),

  /**
   * Tool relations - defines relationships with other tools
   */
  relations: ToolRelationsSchema.optional(),
});

/**
 * Helper function to validate tool metadata
 * 
 * This is a convenience function that validates metadata and returns
 * a typed result with helpful error messages.
 * 
 * Example:
 * ```ts
 * const result = validateToolMetadata({
 *   name: 'read-file',
 *   description: 'Read a file',
 *   category: ToolCategory.FILE_SYSTEM
 * });
 * 
 * if (result.success) {
 *   console.log('Valid metadata:', result.data);
 * } else {
 *   console.error('Validation errors:', result.error.errors);
 * }
 * ```
 */
export function validateToolMetadata(metadata: unknown) {
  return ToolMetadataSchema.safeParse(metadata);
}

/**
 * Helper function to validate tool name
 * 
 * Quick validation for just the tool name.
 * 
 * Example:
 * ```ts
 * validateToolName('read-file');     // ✅ Returns true
 * validateToolName('ReadFile');      // ❌ Returns false
 * ```
 */
export function validateToolName(name: string): boolean {
  return ToolNameSchema.safeParse(name).success;
}

