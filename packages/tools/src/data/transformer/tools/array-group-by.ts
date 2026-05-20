/**
 * Array Group By Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { arrayGroupBySchema } from '../types.js';

/**
 * Create array group by tool
 */
export function createArrayGroupByTool() {
  return toolBuilder()
    .name('array-group-by')
    .description('Group an array of objects by a property value. Returns an object with groups as keys.')
    .category(ToolCategory.UTILITY)
    .tags(['array', 'group', 'data', 'transform'])
    .schema(arrayGroupBySchema)
    .implement(async (input) => {
      const groups = Object.create(null) as Record<string, unknown[]>;
      
      for (const item of input.array) {
        if (item == null) {
          throw new TypeError(`Cannot read properties of ${item} (reading '${input.property}')`);
        }

        const key = String(Reflect.get(Object(item), input.property));
        if (!Object.hasOwn(groups, key)) {
          groups[key] = [];
        }
        groups[key].push(item);
      }

      return {
        groups,
        groupCount: Object.keys(groups).length,
        totalItems: input.array.length,
      };
    })
    .build();
}
