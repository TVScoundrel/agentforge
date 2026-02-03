/**
 * Date Comparison Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { isAfter, isBefore, isValid } from 'date-fns';
import { DateComparisonSchema } from '../types.js';

/**
 * Create date comparison tool
 */
export function createDateComparisonTool() {
  return toolBuilder()
    .name('date-comparison')
    .description('Compare two dates to determine if one is before, after, or equal to the other.')
    .category(ToolCategory.UTILITY)
    .tags(['date', 'time', 'compare', 'comparison'])
    .schema(DateComparisonSchema)
    .implement(async (input) => {
      try {
        const d1 = new Date(input.date1);
        const d2 = new Date(input.date2);
        
        if (!isValid(d1) || !isValid(d2)) {
          return {
            success: false,
            error: 'Invalid date(s)',
          };
        }
        
        return {
          success: true,
          date1IsBefore: isBefore(d1, d2),
          date1IsAfter: isAfter(d1, d2),
          datesAreEqual: d1.getTime() === d2.getTime(),
          date1: d1.toISOString(),
          date2: d2.toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to compare dates',
        };
      }
    })
    .build();
}

