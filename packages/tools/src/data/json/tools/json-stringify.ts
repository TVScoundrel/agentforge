/**
 * JSON Stringify Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { jsonStringifySchema } from '../types.js';

/**
 * Create JSON stringify tool
 */
export function createJsonStringifyTool(defaultIndent = 2, defaultPretty = false) {
  return toolBuilder()
    .name('json-stringify')
    .description('Convert an object to a JSON string with optional formatting (pretty print).')
    .category(ToolCategory.UTILITY)
    .tags(['json', 'stringify', 'format', 'data'])
    .schema(jsonStringifySchema)
    .implementSafe(async (input) => {
      const pretty = input.pretty ?? defaultPretty;
      const indent = input.indent ?? defaultIndent;
      
      const json = pretty
        ? JSON.stringify(input.data, null, indent)
        : JSON.stringify(input.data);

      return {
        json,
        length: json.length,
      };
    })
    .build();
}

