/**
 * JSON Tools Types
 * 
 * Type definitions and schemas for JSON tools.
 */

import { z } from 'zod';

/**
 * JSON parser schema
 */
export const jsonParserSchema = z.object({
  json: z.string().describe('JSON string to parse'),
  strict: z.boolean().default(true).describe('Use strict JSON parsing (no trailing commas, etc.)'),
});

/**
 * JSON stringify schema
 */
export const jsonStringifySchema = z.object({
  data: z.any().describe('Data to convert to JSON string'),
  pretty: z.boolean().default(false).describe('Format with indentation for readability'),
  indent: z.number().default(2).describe('Number of spaces for indentation (when pretty is true)'),
});

/**
 * JSON query schema
 */
export const jsonQuerySchema = z.object({
  data: z.any().describe('JSON data to query'),
  path: z.string().describe('Dot notation path to query (e.g., "user.name" or "items[0].id")'),
});

/**
 * JSON validator schema
 */
export const jsonValidatorSchema = z.object({
  json: z.string().describe('JSON string to validate'),
});

/**
 * JSON merge schema
 */
export const jsonMergeSchema = z.object({
  objects: z.array(z.any().describe('Object to merge')).describe('Array of objects to merge'),
  deep: z.boolean().default(false).describe('Perform deep merge (nested objects)'),
});

/**
 * JSON tools configuration
 */
export interface JsonToolsConfig {
  defaultIndent?: number;
  defaultPretty?: boolean;
}

