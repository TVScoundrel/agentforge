/**
 * Array Sort Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { arraySortSchema } from '../types.js';

/**
 * Create array sort tool
 */
export function createArraySortTool() {
  return toolBuilder()
    .name('array-sort')
    .description('Sort an array by a property value. Supports ascending and descending order.')
    .category(ToolCategory.UTILITY)
    .tags(['array', 'sort', 'data', 'transform'])
    .schema(arraySortSchema)
    .implement(async (input) => {
      const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
      };

      const sorted = [...input.array].sort((a, b) => {
        const aValue = getNestedValue(a, input.property);
        const bValue = getNestedValue(b, input.property);
        
        if (aValue < bValue) return input.order === 'asc' ? -1 : 1;
        if (aValue > bValue) return input.order === 'asc' ? 1 : -1;
        return 0;
      });

      return {
        sorted,
        count: sorted.length,
      };
    })
    .build();
}

