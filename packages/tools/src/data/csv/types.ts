/**
 * CSV Tools Types
 * 
 * Type definitions and schemas for CSV tools.
 */

import { z } from 'zod';

/**
 * CSV parser schema
 */
export const csvParserSchema = z.object({
  csv: z.string().describe('CSV string to parse'),
  delimiter: z.string().default(',').describe('Column delimiter character'),
  hasHeaders: z.boolean().default(true).describe('First row contains column headers'),
  skipEmptyLines: z.boolean().default(true).describe('Skip empty lines in the CSV'),
  trim: z.boolean().default(true).describe('Trim whitespace from values'),
});

/**
 * CSV generator schema
 */
export const csvGeneratorSchema = z.object({
  data: z.array(z.record(z.any().describe('Column value'))).describe('Array of objects to convert to CSV'),
  delimiter: z.string().default(',').describe('Column delimiter character'),
  includeHeaders: z.boolean().default(true).describe('Include header row with column names'),
  columns: z.array(z.string().describe("String value")).optional().describe('Optional list of columns to include (in order)'),
});

/**
 * CSV to JSON schema
 */
export const csvToJsonSchema = z.object({
  csv: z.string().describe('CSV string to convert'),
  delimiter: z.string().default(',').describe('Column delimiter character'),
  pretty: z.boolean().default(false).describe('Format JSON with indentation'),
});

/**
 * JSON to CSV schema
 */
export const jsonToCsvSchema = z.object({
  json: z.string().describe('JSON array string to convert'),
  delimiter: z.string().default(',').describe('Column delimiter character'),
});

/**
 * CSV tools configuration
 */
export interface CsvToolsConfig {
  defaultDelimiter?: string;
  defaultHasHeaders?: boolean;
  defaultSkipEmptyLines?: boolean;
  defaultTrim?: boolean;
}

