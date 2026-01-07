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
  .implement(async (input) => {
    try {
      const parsed = JSON.parse(input.json);
      return {
        success: true,
        data: parsed,
        type: Array.isArray(parsed) ? 'array' : typeof parsed,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse JSON',
      };
    }
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
  .implement(async (input) => {
    try {
      const json = input.pretty 
        ? JSON.stringify(input.data, null, input.indent)
        : JSON.stringify(input.data);
      
      return {
        success: true,
        json,
        length: json.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stringify data',
      };
    }
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
  .implement(async (input) => {
    try {
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
          return {
            success: false,
            error: `Path not found: ${input.path}`,
          };
        }
      }
      
      return {
        success: true,
        value: current,
        type: Array.isArray(current) ? 'array' : typeof current,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query JSON',
      };
    }
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
  .implement(async (input) => {
    try {
      JSON.parse(input.json);
      return {
        valid: true,
        message: 'Valid JSON',
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON',
      };
    }
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

