/**
 * Array Map Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { arrayMapSchema } from '../types.js';

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
        const result: any = {};
        for (const prop of input.properties) {
          // Support dot notation
          const value = prop.split('.').reduce((current, key) => current?.[key], item);
          result[prop] = value;
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

