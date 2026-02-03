/**
 * JSON to CSV Converter Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { stringify } from 'csv-stringify/sync';
import { jsonToCsvSchema } from '../types.js';

/**
 * Create JSON to CSV converter tool
 */
export function createJsonToCsvTool(defaultDelimiter = ',') {
  return toolBuilder()
    .name('json-to-csv')
    .description('Convert JSON array to CSV string. Each object becomes a row with keys as column headers.')
    .category(ToolCategory.UTILITY)
    .tags(['json', 'csv', 'convert', 'data'])
    .schema(jsonToCsvSchema)
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
          delimiter: input.delimiter ?? defaultDelimiter,
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
}

