/**
 * Date Difference Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { differenceInDays, differenceInHours, differenceInMinutes, isValid } from 'date-fns';
import { DateDifferenceSchema } from '../types.js';

/**
 * Create date difference tool
 */
export function createDateDifferenceTool() {
  return toolBuilder()
    .name('date-difference')
    .description('Calculate the difference between two dates in various units (days, hours, minutes).')
    .category(ToolCategory.UTILITY)
    .tags(['date', 'time', 'difference', 'duration'])
    .schema(DateDifferenceSchema)
    .implement(async (input) => {
      try {
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        
        if (!isValid(start) || !isValid(end)) {
          return {
            success: false,
            error: 'Invalid date(s)',
          };
        }
        
        let difference: number;
        if (input.unit === 'days') {
          difference = differenceInDays(end, start);
        } else if (input.unit === 'hours') {
          difference = differenceInHours(end, start);
        } else {
          difference = differenceInMinutes(end, start);
        }
        
        return {
          success: true,
          difference,
          unit: input.unit,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to calculate date difference',
        };
      }
    })
    .build();
}

