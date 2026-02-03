/**
 * String Join Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { StringJoinSchema } from '../types.js';

/**
 * Create string join tool
 */
export function createStringJoinTool() {
  return toolBuilder()
    .name('string-join')
    .description('Join an array of strings into a single string with a separator.')
    .category(ToolCategory.UTILITY)
    .tags(['string', 'join', 'array'])
    .schema(StringJoinSchema)
    .implement(async (input) => {
      const result = input.parts.join(input.separator);
      
      return {
        result,
        partCount: input.parts.length,
        length: result.length,
      };
    })
    .build();
}

