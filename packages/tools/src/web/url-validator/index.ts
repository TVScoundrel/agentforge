/**
 * URL Validator Tools
 * 
 * Tools for validating, parsing, and manipulating URLs.
 */

// Export types
export type { UrlValidationResult, UrlValidatorToolsConfig } from './types.js';
export { urlValidatorSchema, urlBuilderSchema, urlQueryParserSchema } from './types.js';

// Export tool factories
export { createUrlValidatorTool } from './tools/url-validator.js';
export { createUrlBuilderTool } from './tools/url-builder.js';
export { createUrlQueryParserTool } from './tools/url-query-parser.js';

// Import for default instances
import { createUrlValidatorTool } from './tools/url-validator.js';
import { createUrlBuilderTool } from './tools/url-builder.js';
import { createUrlQueryParserTool } from './tools/url-query-parser.js';

// Default tool instances
export const urlValidator = createUrlValidatorTool();
export const urlBuilder = createUrlBuilderTool();
export const urlQueryParser = createUrlQueryParserTool();

// Tools array
export const urlValidatorTools = [urlValidator, urlBuilder, urlQueryParser];

/**
 * Create URL validator tools with custom configuration
 * 
 * @param config - Configuration options
 * @returns Array of URL validator tools
 * 
 * @example
 * ```ts
 * const tools = createUrlValidatorTools();
 * ```
 */
export function createUrlValidatorTools(config: import('./types.js').UrlValidatorToolsConfig = {}) {
  return [
    createUrlValidatorTool(),
    createUrlBuilderTool(),
    createUrlQueryParserTool(),
  ];
}

