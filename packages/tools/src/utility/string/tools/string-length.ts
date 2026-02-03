/**
 * String Length Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { StringLengthSchema } from '../types.js';

/**
 * Create string length tool
 */
export function createStringLengthTool() {
  return toolBuilder()
    .name('string-length')
    .description('Get the length of a string in characters, words, or lines.')
    .category(ToolCategory.UTILITY)
    .tags(['string', 'length', 'count'])
    .schema(StringLengthSchema)
    .implement(async (input) => {
      const words = input.text.trim().split(/\s+/).filter(w => w.length > 0);
      const lines = input.text.split('\n');
      
      return {
        characters: input.text.length,
        words: words.length,
        lines: lines.length,
      };
    })
    .build();
}

