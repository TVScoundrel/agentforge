/**
 * CSV Generator Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { stringify } from 'csv-stringify/sync';
import { csvGeneratorSchema } from '../types.js';

/**
 * Create CSV generator tool
 */
export function createCsvGeneratorTool(defaultDelimiter = ',') {
  return toolBuilder()
    .name('csv-generator')
    .description('Convert an array of objects to CSV string. Automatically extracts headers from object keys.')
    .category(ToolCategory.UTILITY)
    .tags(['csv', 'generate', 'stringify', 'data'])
    .schema(csvGeneratorSchema)
    .implement(async (input) => {
      try {
        const csv = stringify(input.data, {
          delimiter: input.delimiter ?? defaultDelimiter,
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
}

