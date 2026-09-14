/**
 * Schema Validation Utilities
 *
 * Helpers to ensure schemas are properly configured for LLM usage,
 * including enforcing descriptions on all fields.
 */

import { z } from 'zod';

/**
 * Error thrown when a schema field is missing a description
 */
export class MissingDescriptionError extends Error {
  constructor(
    public readonly fieldPath: string[],
    public readonly fieldType: string
  ) {
    super(
      `Schema field "${fieldPath.join('.')}" (${fieldType}) is missing a description. ` +
        `All fields must have descriptions for LLM understanding. ` +
        `Use .describe("...") on this field.`
    );
    this.name = 'MissingDescriptionError';
  }
}

interface MissingDescriptionFinding {
  fieldPath: string[];
  fieldType: string;
}

function* findMissingDescriptions(
  schema: z.ZodTypeAny,
  fieldPath: string[] = []
): Generator<MissingDescriptionFinding> {
  const def = schema._def;
  const typeName = def.typeName;

  if (schema instanceof z.ZodObject) {
    for (const [key, fieldSchema] of Object.entries(schema.shape)) {
      yield* findMissingDescriptions(fieldSchema as z.ZodTypeAny, [...fieldPath, key]);
    }
    return;
  }

  if (schema instanceof z.ZodArray) {
    yield* findMissingDescriptions(def.type, [...fieldPath, '[]']);
    return;
  }

  if (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault
  ) {
    const wrapperDescription = def.description;
    const innerDescription = def.innerType._def.description;

    if (fieldPath.length > 0 && !wrapperDescription && !innerDescription) {
      yield { fieldPath, fieldType: typeName };
    }

    if (!wrapperDescription) {
      yield* findMissingDescriptions(def.innerType, fieldPath);
    }
    return;
  }

  if (schema instanceof z.ZodUnion) {
    for (const [index, option] of def.options.entries()) {
      yield* findMissingDescriptions(option, [...fieldPath, `option${index}`]);
    }
    return;
  }

  if (schema instanceof z.ZodIntersection) {
    yield* findMissingDescriptions(def.left, fieldPath);
    yield* findMissingDescriptions(def.right, fieldPath);
    return;
  }

  if (schema instanceof z.ZodRecord) {
    yield* findMissingDescriptions(def.valueType, [...fieldPath, '[key]']);
    return;
  }

  if (schema instanceof z.ZodTuple) {
    for (const [index, item] of def.items.entries()) {
      yield* findMissingDescriptions(item, [...fieldPath, `[${index}]`]);
    }
    return;
  }

  if (fieldPath.length > 0) {
    const description = def.description;

    if (!description || description.trim() === '') {
      yield { fieldPath, fieldType: typeName };
    }
  }
}

/**
 * Validates that all fields in a Zod schema have descriptions
 *
 * Why enforce descriptions?
 * - LLMs need context to understand what each parameter does
 * - Descriptions are converted to JSON Schema for tool calling
 * - Better descriptions = Better tool selection and usage
 *
 * @param schema - The Zod schema to validate
 * @param fieldPath - Internal: current field path for nested objects
 * @throws {MissingDescriptionError} If any field lacks a description
 *
 * @example
 * ```ts
 * // ❌ This will throw - no descriptions
 * const badSchema = z.object({
 *   name: z.string(),
 *   age: z.number()
 * });
 * validateSchemaDescriptions(badSchema); // Throws!
 *
 * // ✅ This is valid - all fields have descriptions
 * const goodSchema = z.object({
 *   name: z.string().describe('User name'),
 *   age: z.number().describe('User age in years')
 * });
 * validateSchemaDescriptions(goodSchema); // OK!
 * ```
 */
export function validateSchemaDescriptions(schema: z.ZodTypeAny, fieldPath: string[] = []): void {
  const firstFinding = findMissingDescriptions(schema, fieldPath).next();

  if (!firstFinding.done) {
    throw new MissingDescriptionError(firstFinding.value.fieldPath, firstFinding.value.fieldType);
  }
}

/**
 * Safe version of validateSchemaDescriptions that returns a result
 * instead of throwing
 *
 * @param schema - The Zod schema to validate
 * @returns Object with success flag and optional error
 *
 * @example
 * ```ts
 * const result = safeValidateSchemaDescriptions(schema);
 * if (!result.success) {
 *   console.error('Missing descriptions:', result.error.message);
 * }
 * ```
 */
export function safeValidateSchemaDescriptions(schema: z.ZodTypeAny): {
  success: boolean;
  error?: MissingDescriptionError;
} {
  try {
    validateSchemaDescriptions(schema);
    return { success: true };
  } catch (error) {
    if (error instanceof MissingDescriptionError) {
      return { success: false, error };
    }
    throw error; // Re-throw unexpected errors
  }
}

/**
 * Helper to get all missing descriptions from a schema
 *
 * @param schema - The Zod schema to check
 * @returns Array of field paths that are missing descriptions
 *
 * @example
 * ```ts
 * const missing = getMissingDescriptions(schema);
 * if (missing.length > 0) {
 *   console.log('Fields missing descriptions:', missing);
 * }
 * ```
 */
export function getMissingDescriptions(schema: z.ZodTypeAny): string[] {
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const finding of findMissingDescriptions(schema)) {
    const path = finding.fieldPath.join('.');

    if (!seen.has(path)) {
      seen.add(path);
      missing.push(path);
    }
  }
  return missing;
}
