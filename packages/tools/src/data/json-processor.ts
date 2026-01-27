/**
 * JSON Processor Tool
 * 
 * Parse, validate, transform, and query JSON data.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

/**
 * JSON parser tool
 */
export const jsonParser = toolBuilder()
  .name('json-parser')
  .description('Parse JSON string into an object. Validates JSON syntax and returns parsed data or error details.')
  .category(ToolCategory.UTILITY)
  .tags(['json', 'parse', 'data'])
  .schema(z.object({
    json: z.string().describe('JSON string to parse'),
    strict: z.boolean().default(true).describe('Use strict JSON parsing (no trailing commas, etc.)'),
  }))
  .implementSafe(async (input) => {
    const parsed = JSON.parse(input.json);
    return {
      data: parsed,
      type: Array.isArray(parsed) ? 'array' : typeof parsed,
    };
  })
  .build();

/**
 * JSON stringifier tool
 */
export const jsonStringify = toolBuilder()
  .name('json-stringify')
  .description('Convert an object to a JSON string with optional formatting (pretty print).')
  .category(ToolCategory.UTILITY)
  .tags(['json', 'stringify', 'format', 'data'])
  .schema(z.object({
    data: z.any().describe('Data to convert to JSON string'),
    pretty: z.boolean().default(false).describe('Format with indentation for readability'),
    indent: z.number().default(2).describe('Number of spaces for indentation (when pretty is true)'),
  }))
  .implementSafe(async (input) => {
    const json = input.pretty
      ? JSON.stringify(input.data, null, input.indent)
      : JSON.stringify(input.data);

    return {
      json,
      length: json.length,
    };
  })
  .build();

/**
 * JSON query tool (using JSONPath-like syntax)
 */
export const jsonQuery = toolBuilder()
  .name('json-query')
  .description('Query JSON data using dot notation path (e.g., "user.address.city"). Supports array indexing.')
  .category(ToolCategory.UTILITY)
  .tags(['json', 'query', 'path', 'data'])
  .schema(z.object({
    data: z.any().describe('JSON data to query'),
    path: z.string().describe('Dot notation path to query (e.g., "user.name" or "items[0].id")'),
  }))
  .implementSafe(async (input) => {
    const parts = input.path.split('.');
    let current = input.data;

    for (const part of parts) {
      // Handle array indexing: items[0]
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current[key][parseInt(index, 10)];
      } else {
        current = current[part];
      }

      if (current === undefined) {
        throw new Error(`Path not found: ${input.path}`);
      }
    }

    return {
      value: current,
      type: Array.isArray(current) ? 'array' : typeof current,
    };
  })
  .build();

/**
 * JSON validator tool
 */
export const jsonValidator = toolBuilder()
  .name('json-validator')
  .description('Validate JSON string syntax without parsing. Returns whether the JSON is valid and any error details.')
  .category(ToolCategory.UTILITY)
  .tags(['json', 'validate', 'check', 'data'])
  .schema(z.object({
    json: z.string().describe('JSON string to validate'),
  }))
  .implementSafe(async (input) => {
    JSON.parse(input.json);
    return {
      valid: true,
      message: 'Valid JSON',
    };
  })
  .build();

/**
 * JSON merge tool
 */
export const jsonMerge = toolBuilder()
  .name('json-merge')
  .description('Merge two or more JSON objects. Later objects override earlier ones for conflicting keys.')
  .category(ToolCategory.UTILITY)
  .tags(['json', 'merge', 'combine', 'data'])
  .schema(z.object({
    objects: z.array(z.any().describe('Object to merge')).describe('Array of objects to merge'),
    deep: z.boolean().default(false).describe('Perform deep merge (nested objects)'),
  }))
  .implement(async (input) => {
    if (input.deep) {
      // Deep merge
      const deepMerge = (target: any, source: any): any => {
        const output = { ...target };
        for (const key in source) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = deepMerge(output[key] || {}, source[key]);
          } else {
            output[key] = source[key];
          }
        }
        return output;
      };
      
      return input.objects.reduce((acc, obj) => deepMerge(acc, obj), {});
    } else {
      // Shallow merge
      return Object.assign({}, ...input.objects);
    }
  })
  .build();

