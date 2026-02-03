/**
 * CSV to JSON Converter Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { parse } from 'csv-parse/sync';
import { csvToJsonSchema } from '../types.js';

/**
 * Create CSV to JSON converter tool
 */
export function createCsvToJsonTool(defaultDelimiter = ',') {
  return toolBuilder()
    .name('csv-to-json')
    .description('Convert CSV string to JSON array. Each row becomes an object with column headers as keys.')
    .category(ToolCategory.UTILITY)
    .tags(['csv', 'json', 'convert', 'data'])
    .schema(csvToJsonSchema)
    .implement(async (input) => {
      try {
        const records = parse(input.csv, {
          delimiter: input.delimiter ?? defaultDelimiter,
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
}

