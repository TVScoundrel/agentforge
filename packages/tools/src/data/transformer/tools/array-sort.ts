/**
 * Array Sort Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { arraySortSchema } from '../types.js';
import { compareRelationalValues, getNestedValue } from './shared.js';

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
      const sorted = [...input.array].sort((a, b) => {
        const aValue = getNestedValue(a, input.property);
        const bValue = getNestedValue(b, input.property);
        const comparison = compareRelationalValues(aValue, bValue);

        if (comparison === 0) {
          return 0;
        }

        return input.order === 'asc' ? comparison : comparison * -1;
      });

      return {
        sorted,
        count: sorted.length,
      };
    })
    .build();
}
