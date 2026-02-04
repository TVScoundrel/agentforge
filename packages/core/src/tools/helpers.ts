/**
 * Tool Creation Helpers
 * 
 * Utility functions to create tools with automatic validation.
 */

import { z } from 'zod';
import { Tool, ToolMetadata } from './types.js';
import { validateToolMetadata } from './schemas.js';
import { validateSchemaDescriptions } from './validation.js';

/**
 * Create a tool with automatic validation
 *
 * This function validates:
 * 1. Metadata is valid (name, description, category, etc.)
 * 2. Schema has descriptions on ALL fields (enforced!)
 *
 * Why enforce descriptions?
 * - LLMs need context to understand parameters
 * - Better descriptions = Better tool usage
 * - Prevents common mistakes
 *
 * @param metadata - Tool metadata
 * @param schema - Zod schema for input validation (must have descriptions!)
 * @param invoke - Tool implementation (primary method, industry standard)
 * @returns Validated tool
 * @throws {Error} If metadata is invalid or schema is missing descriptions
 *
 * @example
 * ```ts
 * // ✅ This works - all fields have descriptions
 * const tool = createTool(
 *   {
 *     name: 'read-file',
 *     description: 'Read a file from the file system',
 *     category: ToolCategory.FILE_SYSTEM,
 *   },
 *   z.object({
 *     path: z.string().describe('Path to the file to read'),
 *   }),
 *   async ({ path }) => {
 *     // Implementation
 *   }
 * );
 *
 * // ❌ This throws - missing description on 'path'
 * const badTool = createTool(
 *   { name: 'bad', description: 'Bad tool', category: ToolCategory.UTILITY },
 *   z.object({
 *     path: z.string(), // No .describe()!
 *   }),
 *   async ({ path }) => {}
 * );
 * ```
 */
export function createTool<TInput = unknown, TOutput = unknown>(
  metadata: ToolMetadata,
  schema: z.ZodSchema<TInput>,
  invoke: (input: TInput) => Promise<TOutput>
): Tool<TInput, TOutput> {
  // Validate metadata
  const metadataResult = validateToolMetadata(metadata);
  if (!metadataResult.success) {
    const errors = metadataResult.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`Invalid tool metadata:\n${errors}`);
  }

  // Validate schema has descriptions on all fields
  validateSchemaDescriptions(schema);

  // Create the tool with invoke as primary method (industry standard)
  const tool: Tool<TInput, TOutput> = {
    metadata: metadataResult.data,
    schema,
    invoke,
  };

  // Add execute as a deprecated alias for invoke (backward compatibility)
  // This maintains compatibility with existing code while encouraging use of invoke()
  (tool as any).execute = invoke;

  return tool;
}

/**
 * Create a tool without enforcing schema descriptions
 *
 * ⚠️ WARNING: Only use this if you have a good reason to skip description validation.
 * In most cases, you should use `createTool()` instead.
 *
 * This is useful for:
 * - Migration from existing code
 * - Tools with dynamic schemas
 * - Testing
 *
 * @param metadata - Tool metadata
 * @param schema - Zod schema for input validation
 * @param invoke - Tool implementation (primary method, industry standard)
 * @returns Tool (without schema validation)
 */
export function createToolUnsafe<TInput = unknown, TOutput = unknown>(
  metadata: ToolMetadata,
  schema: z.ZodSchema<TInput>,
  invoke: (input: TInput) => Promise<TOutput>
): Tool<TInput, TOutput> {
  // Only validate metadata, skip schema description validation
  const metadataResult = validateToolMetadata(metadata);
  if (!metadataResult.success) {
    const errors = metadataResult.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`Invalid tool metadata:\n${errors}`);
  }

  // Create the tool with invoke as primary method (industry standard)
  const tool: Tool<TInput, TOutput> = {
    metadata: metadataResult.data,
    schema,
    invoke,
  };

  // Add execute as a deprecated alias for invoke (backward compatibility)
  (tool as any).execute = invoke;

  return tool;
}

/**
 * Validate an existing tool
 * 
 * Checks both metadata and schema descriptions.
 * 
 * @param tool - The tool to validate
 * @returns Validation result with success flag and errors
 * 
 * @example
 * ```ts
 * const result = validateTool(myTool);
 * if (!result.success) {
 *   console.error('Tool validation failed:', result.errors);
 * }
 * ```
 */
export function validateTool(tool: Tool): {
  success: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate metadata
  const metadataResult = validateToolMetadata(tool.metadata);
  if (!metadataResult.success) {
    metadataResult.error.errors.forEach((err) => {
      errors.push(`Metadata: ${err.path.join('.')}: ${err.message}`);
    });
  }

  // Validate schema descriptions
  try {
    validateSchemaDescriptions(tool.schema);
  } catch (error) {
    if (error instanceof Error) {
      errors.push(`Schema: ${error.message}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

