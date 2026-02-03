/**
 * Date Formatter Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { format, parse, isValid } from 'date-fns';
import { DateFormatterSchema } from '../types.js';

/**
 * Create date formatter tool
 */
export function createDateFormatterTool() {
  return toolBuilder()
    .name('date-formatter')
    .description('Format a date string or timestamp into a different format. Supports ISO, Unix timestamps, and custom formats.')
    .category(ToolCategory.UTILITY)
    .tags(['date', 'format', 'time'])
    .schema(DateFormatterSchema)
    .implement(async (input) => {
      try {
        let date: Date;
        
        // Try to parse the input
        if (input.inputFormat) {
          date = parse(input.date, input.inputFormat, new Date());
        } else if (!isNaN(Number(input.date))) {
          // Unix timestamp
          date = new Date(Number(input.date) * 1000);
        } else {
          // ISO or other standard format
          date = new Date(input.date);
        }
        
        if (!isValid(date)) {
          return {
            success: false,
            error: 'Invalid date',
          };
        }
        
        const formatted = format(date, input.outputFormat);
        
        return {
          success: true,
          formatted,
          iso: date.toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to format date',
        };
      }
    })
    .build();
}

