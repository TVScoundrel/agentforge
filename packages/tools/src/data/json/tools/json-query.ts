/**
 * JSON Query Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { jsonQuerySchema } from '../types.js';

/**
 * Create JSON query tool
 */
export function createJsonQueryTool() {
  return toolBuilder()
    .name('json-query')
    .description('Query JSON data using dot notation path (e.g., "user.address.city"). Supports array indexing.')
    .category(ToolCategory.UTILITY)
    .tags(['json', 'query', 'path', 'data'])
    .schema(jsonQuerySchema)
    .implementSafe(async (input) => {
      const parts = input.path.split('.');
      let current = input.data;

      for (const part of parts) {
        // Handle array indexing: items[0]
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
          const [, key, index] = arrayMatch;
          current = current[key][parseInt(index, 10)];
        } else {
          current = current[part];
        }

        if (current === undefined) {
          throw new Error(`Path not found: ${input.path}`);
        }
      }

      return {
        value: current,
        type: Array.isArray(current) ? 'array' : typeof current,
      };
    })
    .build();
}

