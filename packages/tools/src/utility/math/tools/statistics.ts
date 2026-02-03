/**
 * Statistics Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { StatisticsSchema } from '../types.js';

/**
 * Create statistics tool
 */
export function createStatisticsTool() {
  return toolBuilder()
    .name('statistics')
    .description('Calculate statistics for an array of numbers: sum, average, min, max, median, standard deviation.')
    .category(ToolCategory.UTILITY)
    .tags(['math', 'statistics', 'average', 'sum'])
    .schema(StatisticsSchema)
    .implement(async (input) => {
      if (input.numbers.length === 0) {
        return {
          success: false,
          error: 'Empty array',
        };
      }
      
      const sorted = [...input.numbers].sort((a, b) => a - b);
      const sum = input.numbers.reduce((acc, n) => acc + n, 0);
      const average = sum / input.numbers.length;
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      
      // Median
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
      
      // Standard deviation
      const variance = input.numbers.reduce((acc, n) => acc + Math.pow(n - average, 2), 0) / input.numbers.length;
      const stdDev = Math.sqrt(variance);
      
      return {
        success: true,
        count: input.numbers.length,
        sum,
        average,
        min,
        max,
        median,
        standardDeviation: stdDev,
        variance,
      };
    })
    .build();
}

