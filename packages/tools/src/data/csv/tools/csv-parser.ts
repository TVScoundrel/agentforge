/**
 * CSV Parser Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { parse } from 'csv-parse/sync';
import { csvParserSchema } from '../types.js';

/**
 * Create CSV parser tool
 */
export function createCsvParserTool(
  defaultDelimiter = ',',
  defaultHasHeaders = true,
  defaultSkipEmptyLines = true,
  defaultTrim = true
) {
  return toolBuilder()
    .name('csv-parser')
    .description('Parse CSV string into an array of objects. Supports custom delimiters, headers, and options.')
    .category(ToolCategory.UTILITY)
    .tags(['csv', 'parse', 'data', 'table'])
    .schema(csvParserSchema)
    .implement(async (input) => {
      try {
        const records = parse(input.csv, {
          delimiter: input.delimiter ?? defaultDelimiter,
          columns: input.hasHeaders ?? defaultHasHeaders,
          skip_empty_lines: input.skipEmptyLines ?? defaultSkipEmptyLines,
          trim: input.trim ?? defaultTrim,
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
}

