/**
 * String Utility Tools - Type Definitions
 */

import { z } from 'zod';

/**
 * Schema for string case converter tool
 */
export const StringCaseConverterSchema = z.object({
  text: z.string().describe('Text to convert'),
  targetCase: z.enum(['lowercase', 'uppercase', 'title', 'camel', 'snake', 'kebab', 'pascal']).describe('Target case format'),
});

/**
 * Schema for string trim tool
 */
export const StringTrimSchema = z.object({
  text: z.string().describe('Text to trim'),
  mode: z.enum(['both', 'start', 'end']).default('both').describe('Which side to trim'),
  characters: z.string().optional().describe('Optional custom characters to trim (default: whitespace)'),
});

/**
 * Schema for string replace tool
 */
export const StringReplaceSchema = z.object({
  text: z.string().describe('Text to search in'),
  search: z.string().describe('String or regex pattern to search for'),
  replace: z.string().describe('Replacement string'),
  global: z.boolean().default(true).describe('Replace all occurrences (true) or just the first (false)'),
  caseInsensitive: z.boolean().default(false).describe('Case-insensitive search'),
});

/**
 * Schema for string split tool
 */
export const StringSplitSchema = z.object({
  text: z.string().describe('Text to split'),
  delimiter: z.string().describe('Delimiter to split on (can be a regex pattern)'),
  limit: z.number().optional().describe('Maximum number of splits'),
});

/**
 * Schema for string join tool
 */
export const StringJoinSchema = z.object({
  parts: z.array(z.string().describe("String value")).describe('Array of strings to join'),
  separator: z.string().default('').describe('Separator to use between parts'),
});

/**
 * Schema for string substring tool
 */
export const StringSubstringSchema = z.object({
  text: z.string().describe('Source text'),
  start: z.number().describe('Start position (0-based)'),
  end: z.number().optional().describe('End position (optional, defaults to end of string)'),
});

/**
 * Schema for string length tool
 */
export const StringLengthSchema = z.object({
  text: z.string().describe('Text to measure'),
});

/**
 * Configuration for string utility tools
 */
export type StringUtilitiesConfig = Record<string, never>;

export type StringCaseConverterInput = z.infer<typeof StringCaseConverterSchema>;
export type StringTrimInput = z.infer<typeof StringTrimSchema>;
export type StringReplaceInput = z.infer<typeof StringReplaceSchema>;
export type StringSplitInput = z.infer<typeof StringSplitSchema>;
export type StringJoinInput = z.infer<typeof StringJoinSchema>;
export type StringSubstringInput = z.infer<typeof StringSubstringSchema>;
export type StringLengthInput = z.infer<typeof StringLengthSchema>;
