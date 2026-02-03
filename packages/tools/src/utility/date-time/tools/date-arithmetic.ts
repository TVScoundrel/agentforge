/**
 * Date Arithmetic Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { add, sub, isValid } from 'date-fns';
import { DateArithmeticSchema } from '../types.js';

/**
 * Create date arithmetic tool
 */
export function createDateArithmeticTool() {
  return toolBuilder()
    .name('date-arithmetic')
    .description('Add or subtract time from a date. Supports years, months, weeks, days, hours, minutes, and seconds.')
    .category(ToolCategory.UTILITY)
    .tags(['date', 'time', 'add', 'subtract', 'arithmetic'])
    .schema(DateArithmeticSchema)
    .implement(async (input) => {
      try {
        const date = new Date(input.date);
        
        if (!isValid(date)) {
          return {
            success: false,
            error: 'Invalid date',
          };
        }
        
        const duration = { [input.unit]: input.amount };
        const result = input.operation === 'add' 
          ? add(date, duration)
          : sub(date, duration);
        
        return {
          success: true,
          result: result.toISOString(),
          unix: Math.floor(result.getTime() / 1000),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to perform date arithmetic',
        };
      }
    })
    .build();
}

