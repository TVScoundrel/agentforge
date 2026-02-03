/**
 * Array Filter Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { arrayFilterSchema } from '../types.js';

/**
 * Create array filter tool
 */
export function createArrayFilterTool() {
  return toolBuilder()
    .name('array-filter')
    .description('Filter an array based on a property value. Supports equality, comparison, and contains operations.')
    .category(ToolCategory.UTILITY)
    .tags(['array', 'filter', 'data', 'transform'])
    .schema(arrayFilterSchema)
    .implement(async (input) => {
      const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
      };

      const filtered = input.array.filter((item) => {
        const itemValue = getNestedValue(item, input.property);
        
        switch (input.operator) {
          case 'equals':
            return itemValue === input.value;
          case 'not-equals':
            return itemValue !== input.value;
          case 'greater-than':
            return itemValue > input.value;
          case 'less-than':
            return itemValue < input.value;
          case 'contains':
            return String(itemValue).includes(String(input.value));
          case 'starts-with':
            return String(itemValue).startsWith(String(input.value));
          case 'ends-with':
            return String(itemValue).endsWith(String(input.value));
          default:
            return false;
        }
      });

      return {
        filtered,
        originalCount: input.array.length,
        filteredCount: filtered.length,
      };
    })
    .build();
}

