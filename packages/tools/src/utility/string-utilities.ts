/**
 * String Utility Tools
 * 
 * Tools for string manipulation and transformation.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

/**
 * String case converter tool
 */
export const stringCaseConverter = toolBuilder()
  .name('string-case-converter')
  .description('Convert string to different cases: lowercase, uppercase, title case, camel case, snake case, kebab case.')
  .category(ToolCategory.UTILITY)
  .tags(['string', 'case', 'convert', 'transform'])
  .schema(z.object({
    text: z.string().describe('Text to convert'),
    targetCase: z.enum(['lowercase', 'uppercase', 'title', 'camel', 'snake', 'kebab', 'pascal']).describe('Target case format'),
  }))
  .implement(async (input) => {
    let result: string;
    
    switch (input.targetCase) {
      case 'lowercase':
        result = input.text.toLowerCase();
        break;
      case 'uppercase':
        result = input.text.toUpperCase();
        break;
      case 'title':
        result = input.text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
        break;
      case 'camel':
        result = input.text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
        break;
      case 'snake':
        result = input.text
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, '');
        break;
      case 'kebab':
        result = input.text
          .replace(/([A-Z])/g, '-$1')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        break;
      case 'pascal':
        result = input.text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
          .replace(/^./, (char) => char.toUpperCase());
        break;
      default:
        result = input.text;
    }
    
    return {
      original: input.text,
      converted: result,
      targetCase: input.targetCase,
    };
  })
  .build();

/**
 * String trim tool
 */
export const stringTrim = toolBuilder()
  .name('string-trim')
  .description('Remove whitespace from the beginning and/or end of a string. Supports trim, trim start, and trim end.')
  .category(ToolCategory.UTILITY)
  .tags(['string', 'trim', 'whitespace'])
  .schema(z.object({
    text: z.string().describe('Text to trim'),
    mode: z.enum(['both', 'start', 'end']).default('both').describe('Which side to trim'),
    characters: z.string().optional().describe('Optional custom characters to trim (default: whitespace)'),
  }))
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

/**
 * String replace tool
 */
export const stringReplace = toolBuilder()
  .name('string-replace')
  .description('Replace occurrences of a substring or pattern in a string. Supports regex patterns and global replacement.')
  .category(ToolCategory.UTILITY)
  .tags(['string', 'replace', 'substitute'])
  .schema(z.object({
    text: z.string().describe('Text to search in'),
    search: z.string().describe('String or regex pattern to search for'),
    replace: z.string().describe('Replacement string'),
    global: z.boolean().default(true).describe('Replace all occurrences (true) or just the first (false)'),
    caseInsensitive: z.boolean().default(false).describe('Case-insensitive search'),
  }))
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

/**
 * String split tool
 */
export const stringSplit = toolBuilder()
  .name('string-split')
  .description('Split a string into an array of substrings using a delimiter. Supports regex delimiters and limit.')
  .category(ToolCategory.UTILITY)
  .tags(['string', 'split', 'array'])
  .schema(z.object({
    text: z.string().describe('Text to split'),
    delimiter: z.string().describe('Delimiter to split on (can be a regex pattern)'),
    limit: z.number().optional().describe('Maximum number of splits'),
  }))
  .implement(async (input) => {
    const parts = input.text.split(input.delimiter, input.limit);
    
    return {
      parts,
      count: parts.length,
    };
  })
  .build();

/**
 * String join tool
 */
export const stringJoin = toolBuilder()
  .name('string-join')
  .description('Join an array of strings into a single string with a separator.')
  .category(ToolCategory.UTILITY)
  .tags(['string', 'join', 'array'])
  .schema(z.object({
    parts: z.array(z.string().describe("String value")).describe('Array of strings to join'),
    separator: z.string().default('').describe('Separator to use between parts'),
  }))
  .implement(async (input) => {
    const result = input.parts.join(input.separator);
    
    return {
      result,
      partCount: input.parts.length,
      length: result.length,
    };
  })
  .build();

/**
 * String substring tool
 */
export const stringSubstring = toolBuilder()
  .name('string-substring')
  .description('Extract a substring from a string using start and end positions.')
  .category(ToolCategory.UTILITY)
  .tags(['string', 'substring', 'slice'])
  .schema(z.object({
    text: z.string().describe('Source text'),
    start: z.number().describe('Start position (0-based)'),
    end: z.number().optional().describe('End position (optional, defaults to end of string)'),
  }))
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

/**
 * String length tool
 */
export const stringLength = toolBuilder()
  .name('string-length')
  .description('Get the length of a string in characters, words, or lines.')
  .category(ToolCategory.UTILITY)
  .tags(['string', 'length', 'count'])
  .schema(z.object({
    text: z.string().describe('Text to measure'),
  }))
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

