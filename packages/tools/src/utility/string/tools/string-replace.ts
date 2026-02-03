/**
 * String Replace Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { StringReplaceSchema } from '../types.js';

/**
 * Create string replace tool
 */
export function createStringReplaceTool() {
  return toolBuilder()
    .name('string-replace')
    .description('Replace occurrences of a substring or pattern in a string. Supports regex patterns and global replacement.')
    .category(ToolCategory.UTILITY)
    .tags(['string', 'replace', 'substitute'])
    .schema(StringReplaceSchema)
    .implement(async (input) => {
      const flags = (input.global ? 'g' : '') + (input.caseInsensitive ? 'i' : '');
      const regex = new RegExp(input.search, flags);
      const result = input.text.replace(regex, input.replace);
      
      // Count replacements
      const matches = input.text.match(regex);
      const count = matches ? matches.length : 0;
      
      return {
        original: input.text,
        result,
        replacements: count,
      };
    })
    .build();
}

