/**
 * JSON Validator Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { jsonValidatorSchema } from '../types.js';

/**
 * Create JSON validator tool
 */
export function createJsonValidatorTool() {
  return toolBuilder()
    .name('json-validator')
    .description('Validate JSON string syntax without parsing. Returns whether the JSON is valid and any error details.')
    .category(ToolCategory.UTILITY)
    .tags(['json', 'validate', 'check', 'data'])
    .schema(jsonValidatorSchema)
    .implementSafe(async (input) => {
      JSON.parse(input.json);
      return {
        valid: true,
        message: 'Valid JSON',
      };
    })
    .build();
}

