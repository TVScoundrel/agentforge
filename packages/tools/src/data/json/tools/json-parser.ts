/**
 * JSON Parser Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { jsonParserSchema } from '../types.js';

/**
 * Create JSON parser tool
 */
export function createJsonParserTool() {
  return toolBuilder()
    .name('json-parser')
    .description('Parse JSON string into an object. Validates JSON syntax and returns parsed data or error details.')
    .category(ToolCategory.UTILITY)
    .tags(['json', 'parse', 'data'])
    .schema(jsonParserSchema)
    .implementSafe(async (input) => {
      const parsed = JSON.parse(input.json);
      return {
        data: parsed,
        type: Array.isArray(parsed) ? 'array' : typeof parsed,
      };
    })
    .build();
}

