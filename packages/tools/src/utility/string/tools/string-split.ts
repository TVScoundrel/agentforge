/**
 * String Split Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { StringSplitSchema } from '../types.js';

/**
 * Create string split tool
 */
export function createStringSplitTool() {
  return toolBuilder()
    .name('string-split')
    .description('Split a string into an array of substrings using a delimiter. Supports regex delimiters and limit.')
    .category(ToolCategory.UTILITY)
    .tags(['string', 'split', 'array'])
    .schema(StringSplitSchema)
    .implement(async (input) => {
      const parts = input.text.split(input.delimiter, input.limit);
      
      return {
        parts,
        count: parts.length,
      };
    })
    .build();
}

