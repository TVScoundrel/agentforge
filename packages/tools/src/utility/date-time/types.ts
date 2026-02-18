/**
 * Date and Time Tools - Type Definitions
 */

import { z } from 'zod';

/**
 * Schema for current date/time tool
 */
export const CurrentDateTimeSchema = z.object({
  format: z.enum(['iso', 'unix', 'custom']).default('iso').describe('Output format'),
  customFormat: z.string().optional().describe('Custom format string (e.g., "yyyy-MM-dd HH:mm:ss") when format is "custom"'),
  timezone: z.string().optional().describe('Timezone (e.g., "America/New_York")'),
});

/**
 * Schema for date formatter tool
 */
export const DateFormatterSchema = z.object({
  date: z.string().describe('Date string or Unix timestamp to format'),
  outputFormat: z.string().describe('Output format string (e.g., "yyyy-MM-dd", "MMM dd, yyyy")'),
  inputFormat: z.string().optional().describe('Input format string (optional, auto-detected if not provided)'),
});

/**
 * Schema for date arithmetic tool
 */
export const DateArithmeticSchema = z.object({
  date: z.string().describe('Starting date (ISO string or Unix timestamp)'),
  operation: z.enum(['add', 'subtract']).describe('Operation to perform'),
  amount: z.number().describe('Amount to add or subtract'),
  unit: z.enum(['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds']).describe('Time unit'),
});

/**
 * Schema for date difference tool
 */
export const DateDifferenceSchema = z.object({
  startDate: z.string().describe('Start date (ISO string or Unix timestamp)'),
  endDate: z.string().describe('End date (ISO string or Unix timestamp)'),
  unit: z.enum(['days', 'hours', 'minutes']).default('days').describe('Unit for the difference'),
});

/**
 * Schema for date comparison tool
 */
export const DateComparisonSchema = z.object({
  date1: z.string().describe('First date to compare'),
  date2: z.string().describe('Second date to compare'),
});

/**
 * Configuration for date/time tools
 */
export type DateTimeConfig = Record<string, never>;

export type CurrentDateTimeInput = z.infer<typeof CurrentDateTimeSchema>;
export type DateFormatterInput = z.infer<typeof DateFormatterSchema>;
export type DateArithmeticInput = z.infer<typeof DateArithmeticSchema>;
export type DateDifferenceInput = z.infer<typeof DateDifferenceSchema>;
export type DateComparisonInput = z.infer<typeof DateComparisonSchema>;
