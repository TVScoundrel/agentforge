/**
 * Date and Time Utility Tools
 * 
 * Tools for working with dates, times, and timestamps.
 */

import { createCurrentDateTimeTool } from './tools/current-date-time.js';
import { createDateFormatterTool } from './tools/date-formatter.js';
import { createDateArithmeticTool } from './tools/date-arithmetic.js';
import { createDateDifferenceTool } from './tools/date-difference.js';
import { createDateComparisonTool } from './tools/date-comparison.js';
import type { DateTimeConfig } from './types.js';

// Default tool instances
export const currentDateTime = createCurrentDateTimeTool();
export const dateFormatter = createDateFormatterTool();
export const dateArithmetic = createDateArithmeticTool();
export const dateDifference = createDateDifferenceTool();
export const dateComparison = createDateComparisonTool();

// Tools array
export const dateTimeTools = [
  currentDateTime,
  dateFormatter,
  dateArithmetic,
  dateDifference,
  dateComparison,
];

/**
 * Create date/time tools with optional configuration
 */
export function createDateTimeTools(config: DateTimeConfig = {}) {
  return [
    createCurrentDateTimeTool(),
    createDateFormatterTool(),
    createDateArithmeticTool(),
    createDateDifferenceTool(),
    createDateComparisonTool(),
  ];
}

// Re-export types
export * from './types.js';

// Re-export tool factory functions
export { createCurrentDateTimeTool } from './tools/current-date-time.js';
export { createDateFormatterTool } from './tools/date-formatter.js';
export { createDateArithmeticTool } from './tools/date-arithmetic.js';
export { createDateDifferenceTool } from './tools/date-difference.js';
export { createDateComparisonTool } from './tools/date-comparison.js';

