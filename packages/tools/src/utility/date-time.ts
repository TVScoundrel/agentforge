/**
 * Date and Time Utility Tools
 * 
 * Tools for working with dates, times, and timestamps.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import { format, parse, add, sub, differenceInDays, differenceInHours, differenceInMinutes, isAfter, isBefore, isValid } from 'date-fns';

/**
 * Current date/time tool
 */
export const currentDateTime = toolBuilder()
  .name('current-date-time')
  .description('Get the current date and time in various formats (ISO, Unix timestamp, formatted string).')
  .category(ToolCategory.UTILITY)
  .tags(['date', 'time', 'now', 'current'])
  .schema(z.object({
    format: z.enum(['iso', 'unix', 'custom']).default('iso').describe('Output format'),
    customFormat: z.string().optional().describe('Custom format string (e.g., "yyyy-MM-dd HH:mm:ss") when format is "custom"'),
    timezone: z.string().optional().describe('Timezone (e.g., "America/New_York")'),
  }))
  .implement(async (input) => {
    const now = new Date();
    
    let formatted: string | number;
    if (input.format === 'iso') {
      formatted = now.toISOString();
    } else if (input.format === 'unix') {
      formatted = Math.floor(now.getTime() / 1000);
    } else if (input.format === 'custom' && input.customFormat) {
      formatted = format(now, input.customFormat);
    } else {
      formatted = now.toISOString();
    }
    
    return {
      formatted,
      iso: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
    };
  })
  .build();

/**
 * Date formatter tool
 */
export const dateFormatter = toolBuilder()
  .name('date-formatter')
  .description('Format a date string or timestamp into a different format. Supports ISO, Unix timestamps, and custom formats.')
  .category(ToolCategory.UTILITY)
  .tags(['date', 'format', 'time'])
  .schema(z.object({
    date: z.string().describe('Date string or Unix timestamp to format'),
    outputFormat: z.string().describe('Output format string (e.g., "yyyy-MM-dd", "MMM dd, yyyy")'),
    inputFormat: z.string().optional().describe('Input format string (optional, auto-detected if not provided)'),
  }))
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

/**
 * Date arithmetic tool
 */
export const dateArithmetic = toolBuilder()
  .name('date-arithmetic')
  .description('Add or subtract time from a date. Supports years, months, weeks, days, hours, minutes, and seconds.')
  .category(ToolCategory.UTILITY)
  .tags(['date', 'time', 'add', 'subtract', 'arithmetic'])
  .schema(z.object({
    date: z.string().describe('Starting date (ISO string or Unix timestamp)'),
    operation: z.enum(['add', 'subtract']).describe('Operation to perform'),
    amount: z.number().describe('Amount to add or subtract'),
    unit: z.enum(['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds']).describe('Time unit'),
  }))
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

/**
 * Date difference tool
 */
export const dateDifference = toolBuilder()
  .name('date-difference')
  .description('Calculate the difference between two dates in various units (days, hours, minutes).')
  .category(ToolCategory.UTILITY)
  .tags(['date', 'time', 'difference', 'duration'])
  .schema(z.object({
    startDate: z.string().describe('Start date (ISO string or Unix timestamp)'),
    endDate: z.string().describe('End date (ISO string or Unix timestamp)'),
    unit: z.enum(['days', 'hours', 'minutes']).default('days').describe('Unit for the difference'),
  }))
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

/**
 * Date comparison tool
 */
export const dateComparison = toolBuilder()
  .name('date-comparison')
  .description('Compare two dates to determine if one is before, after, or equal to the other.')
  .category(ToolCategory.UTILITY)
  .tags(['date', 'time', 'compare', 'comparison'])
  .schema(z.object({
    date1: z.string().describe('First date to compare'),
    date2: z.string().describe('Second date to compare'),
  }))
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

