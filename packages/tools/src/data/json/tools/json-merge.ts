/**
 * JSON Merge Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { jsonMergeSchema } from '../types.js';

/**
 * Create JSON merge tool
 */
export function createJsonMergeTool() {
  return toolBuilder()
    .name('json-merge')
    .description('Merge two or more JSON objects. Later objects override earlier ones for conflicting keys.')
    .category(ToolCategory.UTILITY)
    .tags(['json', 'merge', 'combine', 'data'])
    .schema(jsonMergeSchema)
    .implement(async (input) => {
      if (input.deep) {
        // Deep merge
        const deepMerge = (target: any, source: any): any => {
          const output = { ...target };
          for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
              output[key] = deepMerge(output[key] || {}, source[key]);
            } else {
              output[key] = source[key];
            }
          }
          return output;
        };
        
        return input.objects.reduce((acc, obj) => deepMerge(acc, obj), {});
      } else {
        // Shallow merge
        return Object.assign({}, ...input.objects);
      }
    })
    .build();
}

