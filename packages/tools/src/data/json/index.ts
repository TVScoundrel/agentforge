/**
 * JSON Tools
 * 
 * Tools for parsing, validating, transforming, and querying JSON data.
 */

export * from './types.js';
export { createJsonParserTool } from './tools/json-parser.js';
export { createJsonStringifyTool } from './tools/json-stringify.js';
export { createJsonQueryTool } from './tools/json-query.js';
export { createJsonValidatorTool } from './tools/json-validator.js';
export { createJsonMergeTool } from './tools/json-merge.js';

import { createJsonParserTool } from './tools/json-parser.js';
import { createJsonStringifyTool } from './tools/json-stringify.js';
import { createJsonQueryTool } from './tools/json-query.js';
import { createJsonValidatorTool } from './tools/json-validator.js';
import { createJsonMergeTool } from './tools/json-merge.js';
import type { JsonToolsConfig } from './types.js';

/**
 * Default JSON parser tool instance
 */
export const jsonParser = createJsonParserTool();

/**
 * Default JSON stringify tool instance
 */
export const jsonStringify = createJsonStringifyTool();

/**
 * Default JSON query tool instance
 */
export const jsonQuery = createJsonQueryTool();

/**
 * Default JSON validator tool instance
 */
export const jsonValidator = createJsonValidatorTool();

/**
 * Default JSON merge tool instance
 */
export const jsonMerge = createJsonMergeTool();

/**
 * All JSON tools
 */
export const jsonTools = [jsonParser, jsonStringify, jsonQuery, jsonValidator, jsonMerge];

/**
 * Create JSON tools with custom configuration
 */
export function createJsonTools(config: JsonToolsConfig = {}) {
  const {
    defaultIndent = 2,
    defaultPretty = false,
  } = config;

  return [
    createJsonParserTool(),
    createJsonStringifyTool(defaultIndent, defaultPretty),
    createJsonQueryTool(),
    createJsonValidatorTool(),
    createJsonMergeTool(),
  ];
}

