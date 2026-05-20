/**
 * Array Map Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { arrayMapSchema } from '../types.js';
import { getNestedValue } from './shared.js';

/**
 * Create array map tool
 */
export function createArrayMapTool() {
  return toolBuilder()
    .name('array-map')
    .description('Extract specific properties from each object in an array. Creates a new array with only the selected properties.')
    .category(ToolCategory.UTILITY)
    .tags(['array', 'map', 'data', 'transform'])
    .schema(arrayMapSchema)
    .implement(async (input) => {
      const mapped = input.array.map((item) => {
        const result: Record<string, unknown> = {};
        for (const prop of input.properties) {
          Object.defineProperty(result, prop, {
            value: getNestedValue(item, prop),
            enumerable: true,
            configurable: true,
            writable: true,
          });
        }
        return result;
      });

      return {
        mapped,
        count: mapped.length,
      };
    })
    .build();
}
