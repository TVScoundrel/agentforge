/**
 * String Utility Tools
 * 
 * Tools for string manipulation and transformation.
 */

import { createStringCaseConverterTool } from './tools/string-case-converter.js';
import { createStringTrimTool } from './tools/string-trim.js';
import { createStringReplaceTool } from './tools/string-replace.js';
import { createStringSplitTool } from './tools/string-split.js';
import { createStringJoinTool } from './tools/string-join.js';
import { createStringSubstringTool } from './tools/string-substring.js';
import { createStringLengthTool } from './tools/string-length.js';
import type { StringUtilitiesConfig } from './types.js';

// Default tool instances
export const stringCaseConverter = createStringCaseConverterTool();
export const stringTrim = createStringTrimTool();
export const stringReplace = createStringReplaceTool();
export const stringSplit = createStringSplitTool();
export const stringJoin = createStringJoinTool();
export const stringSubstring = createStringSubstringTool();
export const stringLength = createStringLengthTool();

// Tools array
export const stringUtilityTools = [
  stringCaseConverter,
  stringTrim,
  stringReplace,
  stringSplit,
  stringJoin,
  stringSubstring,
  stringLength,
];

/**
 * Create string utility tools with optional configuration
 */
export function createStringUtilityTools(config: StringUtilitiesConfig = {}) {
  return [
    createStringCaseConverterTool(),
    createStringTrimTool(),
    createStringReplaceTool(),
    createStringSplitTool(),
    createStringJoinTool(),
    createStringSubstringTool(),
    createStringLengthTool(),
  ];
}

// Re-export types
export * from './types.js';

// Re-export tool factory functions
export { createStringCaseConverterTool } from './tools/string-case-converter.js';
export { createStringTrimTool } from './tools/string-trim.js';
export { createStringReplaceTool } from './tools/string-replace.js';
export { createStringSplitTool } from './tools/string-split.js';
export { createStringJoinTool } from './tools/string-join.js';
export { createStringSubstringTool } from './tools/string-substring.js';
export { createStringLengthTool } from './tools/string-length.js';

