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
export function validateSchemaDescriptions(
  schema: z.ZodTypeAny,
  fieldPath: string[] = []
): void {
  const def = schema._def;
  const typeName = def.typeName;

  // Handle ZodObject - validate all properties
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    
    Object.entries(shape).forEach(([key, fieldSchema]: [string, any]) => {
      validateSchemaDescriptions(fieldSchema, [...fieldPath, key]);
    });
    return;
  }

  // Handle ZodArray - validate the element type
  if (schema instanceof z.ZodArray) {
    validateSchemaDescriptions(def.type, [...fieldPath, '[]']);
    return;
  }

  // Handle ZodOptional - check for description on wrapper OR inner type
  if (schema instanceof z.ZodOptional) {
    const wrapperDescription = def.description;
    const innerDescription = def.innerType._def.description;

    if (fieldPath.length > 0 && !wrapperDescription && !innerDescription) {
      throw new MissingDescriptionError(fieldPath, typeName);
    }

    // Don't validate inner type again if wrapper has description
    if (!wrapperDescription) {
      validateSchemaDescriptions(def.innerType, fieldPath);
    }
    return;
  }

  // Handle ZodNullable - check for description on wrapper OR inner type
  if (schema instanceof z.ZodNullable) {
    const wrapperDescription = def.description;
    const innerDescription = def.innerType._def.description;

    if (fieldPath.length > 0 && !wrapperDescription && !innerDescription) {
      throw new MissingDescriptionError(fieldPath, typeName);
    }

    if (!wrapperDescription) {
      validateSchemaDescriptions(def.innerType, fieldPath);
    }
    return;
  }

  // Handle ZodDefault - check for description on wrapper OR inner type
  if (schema instanceof z.ZodDefault) {
    const wrapperDescription = def.description;
    const innerDescription = def.innerType._def.description;

    if (fieldPath.length > 0 && !wrapperDescription && !innerDescription) {
      throw new MissingDescriptionError(fieldPath, typeName);
    }

    if (!wrapperDescription) {
      validateSchemaDescriptions(def.innerType, fieldPath);
    }
    return;
  }

  // Handle ZodUnion - validate all options
  if (schema instanceof z.ZodUnion) {
    def.options.forEach((option: z.ZodTypeAny, index: number) => {
      validateSchemaDescriptions(option, [...fieldPath, `option${index}`]);
    });
    return;
  }

  // Handle ZodIntersection - validate both sides
  if (schema instanceof z.ZodIntersection) {
    validateSchemaDescriptions(def.left, fieldPath);
    validateSchemaDescriptions(def.right, fieldPath);
    return;
  }

  // Handle ZodRecord - validate the value type
  if (schema instanceof z.ZodRecord) {
    validateSchemaDescriptions(def.valueType, [...fieldPath, '[key]']);
    return;
  }

  // Handle ZodTuple - validate all elements
  if (schema instanceof z.ZodTuple) {
    def.items.forEach((item: z.ZodTypeAny, index: number) => {
      validateSchemaDescriptions(item, [...fieldPath, `[${index}]`]);
    });
    return;
  }

  // For primitive types (string, number, boolean, etc.), check for description
  // Skip validation for root level (empty fieldPath) as that's the object itself
  if (fieldPath.length > 0) {
    const description = def.description;
    
    if (!description || description.trim() === '') {
      throw new MissingDescriptionError(fieldPath, typeName);
    }
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

  function check(s: z.ZodTypeAny, path: string[] = []): void {
    const def = s._def;
    const typeName = def.typeName;

    // Handle ZodObject - check all properties
    if (s instanceof z.ZodObject) {
      const shape = s.shape;
      Object.entries(shape).forEach(([key, fieldSchema]: [string, any]) => {
        check(fieldSchema, [...path, key]);
      });
      return;
    }

    // Handle wrappers (optional, nullable, default)
    if (s instanceof z.ZodOptional || s instanceof z.ZodNullable || s instanceof z.ZodDefault) {
      const wrapperDescription = def.description;
      const innerDescription = def.innerType._def.description;

      if (path.length > 0 && !wrapperDescription && !innerDescription) {
        missing.push(path.join('.'));
      }

      if (!wrapperDescription) {
        check(def.innerType, path);
      }
      return;
    }

    // Handle arrays
    if (s instanceof z.ZodArray) {
      check(def.type, [...path, '[]']);
      return;
    }

    // For primitive types, check for description
    if (path.length > 0) {
      const description = def.description;
      if (!description || description.trim() === '') {
        missing.push(path.join('.'));
      }
    }
  }

  check(schema);
  return missing;
}

