/**
 * JSON Query Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { jsonQuerySchema } from '../types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getPathValue(current: unknown, part: string): unknown {
  const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
  if (arrayMatch) {
    const [, key, index] = arrayMatch;
    if (!isRecord(current)) {
      return undefined;
    }

    const candidate = current[key];
    if (!Array.isArray(candidate)) {
      return undefined;
    }

    return candidate[parseInt(index, 10)];
  }

  if (!isRecord(current)) {
    return undefined;
  }

  return current[part];
}

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
        current = getPathValue(current, part);
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
