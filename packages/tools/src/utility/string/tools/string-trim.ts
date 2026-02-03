/**
 * String Trim Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { StringTrimSchema } from '../types.js';

/**
 * Create string trim tool
 */
export function createStringTrimTool() {
  return toolBuilder()
    .name('string-trim')
    .description('Remove whitespace from the beginning and/or end of a string. Supports trim, trim start, and trim end.')
    .category(ToolCategory.UTILITY)
    .tags(['string', 'trim', 'whitespace'])
    .schema(StringTrimSchema)
    .implement(async (input) => {
      let result: string;
      
      if (input.characters) {
        const chars = input.characters.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
        const regex = input.mode === 'both' 
          ? new RegExp(`^[${chars}]+|[${chars}]+$`, 'g')
          : input.mode === 'start'
          ? new RegExp(`^[${chars}]+`, 'g')
          : new RegExp(`[${chars}]+$`, 'g');
        result = input.text.replace(regex, '');
      } else {
        result = input.mode === 'both' 
          ? input.text.trim()
          : input.mode === 'start'
          ? input.text.trimStart()
          : input.text.trimEnd();
      }
      
      return {
        original: input.text,
        trimmed: result,
        removed: input.text.length - result.length,
      };
    })
    .build();
}

