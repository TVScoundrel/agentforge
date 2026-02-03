/**
 * String Substring Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { StringSubstringSchema } from '../types.js';

/**
 * Create string substring tool
 */
export function createStringSubstringTool() {
  return toolBuilder()
    .name('string-substring')
    .description('Extract a substring from a string using start and end positions.')
    .category(ToolCategory.UTILITY)
    .tags(['string', 'substring', 'slice'])
    .schema(StringSubstringSchema)
    .implement(async (input) => {
      const result = input.text.substring(input.start, input.end);
      
      return {
        result,
        length: result.length,
        start: input.start,
        end: input.end ?? input.text.length,
      };
    })
    .build();
}

