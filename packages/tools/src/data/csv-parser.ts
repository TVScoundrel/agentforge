/**
 * CSV Parser Tool
 * 
 * Parse and generate CSV data.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

/**
 * CSV parser tool
 */
export const csvParser = toolBuilder()
  .name('csv-parser')
  .description('Parse CSV string into an array of objects. Supports custom delimiters, headers, and options.')
  .category(ToolCategory.UTILITY)
  .tags(['csv', 'parse', 'data', 'table'])
  .schema(z.object({
    csv: z.string().describe('CSV string to parse'),
    delimiter: z.string().default(',').describe('Column delimiter character'),
    hasHeaders: z.boolean().default(true).describe('First row contains column headers'),
    skipEmptyLines: z.boolean().default(true).describe('Skip empty lines in the CSV'),
    trim: z.boolean().default(true).describe('Trim whitespace from values'),
  }))
  .implement(async (input) => {
    try {
      const records = parse(input.csv, {
        delimiter: input.delimiter,
        columns: input.hasHeaders,
        skip_empty_lines: input.skipEmptyLines,
        trim: input.trim,
        relax_column_count: true,
      });

      return {
        success: true,
        data: records,
        rowCount: records.length,
        columnCount: records.length > 0 ? Object.keys(records[0]).length : 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse CSV',
      };
    }
  })
  .build();

/**
 * CSV generator tool
 */
export const csvGenerator = toolBuilder()
  .name('csv-generator')
  .description('Convert an array of objects to CSV string. Automatically extracts headers from object keys.')
  .category(ToolCategory.UTILITY)
  .tags(['csv', 'generate', 'stringify', 'data'])
  .schema(z.object({
    data: z.array(z.record(z.any().describe('Column value'))).describe('Array of objects to convert to CSV'),
    delimiter: z.string().default(',').describe('Column delimiter character'),
    includeHeaders: z.boolean().default(true).describe('Include header row with column names'),
    columns: z.array(z.string().describe("String value")).optional().describe('Optional list of columns to include (in order)'),
  }))
  .implement(async (input) => {
    try {
      const csv = stringify(input.data, {
        delimiter: input.delimiter,
        header: input.includeHeaders,
        columns: input.columns,
      });

      return {
        success: true,
        csv,
        rowCount: input.data.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate CSV',
      };
    }
  })
  .build();

/**
 * CSV to JSON converter
 */
export const csvToJson = toolBuilder()
  .name('csv-to-json')
  .description('Convert CSV string to JSON array. Each row becomes an object with column headers as keys.')
  .category(ToolCategory.UTILITY)
  .tags(['csv', 'json', 'convert', 'data'])
  .schema(z.object({
    csv: z.string().describe('CSV string to convert'),
    delimiter: z.string().default(',').describe('Column delimiter character'),
    pretty: z.boolean().default(false).describe('Format JSON with indentation'),
  }))
  .implement(async (input) => {
    try {
      const records = parse(input.csv, {
        delimiter: input.delimiter,
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const json = input.pretty 
        ? JSON.stringify(records, null, 2)
        : JSON.stringify(records);

      return {
        success: true,
        json,
        recordCount: records.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to convert CSV to JSON',
      };
    }
  })
  .build();

/**
 * JSON to CSV converter
 */
export const jsonToCsv = toolBuilder()
  .name('json-to-csv')
  .description('Convert JSON array to CSV string. Each object becomes a row with keys as column headers.')
  .category(ToolCategory.UTILITY)
  .tags(['json', 'csv', 'convert', 'data'])
  .schema(z.object({
    json: z.string().describe('JSON array string to convert'),
    delimiter: z.string().default(',').describe('Column delimiter character'),
  }))
  .implement(async (input) => {
    try {
      const data = JSON.parse(input.json);
      
      if (!Array.isArray(data)) {
        return {
          success: false,
          error: 'Input must be a JSON array',
        };
      }

      const csv = stringify(data, {
        delimiter: input.delimiter,
        header: true,
      });

      return {
        success: true,
        csv,
        rowCount: data.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to convert JSON to CSV',
      };
    }
  })
  .build();

