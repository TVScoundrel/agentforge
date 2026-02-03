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
      const groups: Record<string, any[]> = {};
      
      for (const item of input.array) {
        const key = String(item[input.property]);
        if (!groups[key]) {
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

