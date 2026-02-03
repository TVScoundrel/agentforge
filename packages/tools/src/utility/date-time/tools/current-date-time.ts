/**
 * Current Date/Time Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { format } from 'date-fns';
import { CurrentDateTimeSchema } from '../types.js';

/**
 * Create current date/time tool
 */
export function createCurrentDateTimeTool() {
  return toolBuilder()
    .name('current-date-time')
    .description('Get the current date and time in various formats (ISO, Unix timestamp, formatted string).')
    .category(ToolCategory.UTILITY)
    .tags(['date', 'time', 'now', 'current'])
    .schema(CurrentDateTimeSchema)
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
}

