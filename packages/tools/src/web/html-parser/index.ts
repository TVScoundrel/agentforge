/**
 * HTML Parser Tools
 * 
 * Tools for parsing HTML content and extracting data.
 */

// Export types
export type { HtmlParserToolsConfig } from './types.js';
export { htmlParserSchema, extractLinksSchema, extractImagesSchema } from './types.js';

// Export tool factories
export { createHtmlParserTool } from './tools/html-parser.js';
export { createExtractLinksTool } from './tools/extract-links.js';
export { createExtractImagesTool } from './tools/extract-images.js';

// Import for default instances
import { createHtmlParserTool } from './tools/html-parser.js';
import { createExtractLinksTool } from './tools/extract-links.js';
import { createExtractImagesTool } from './tools/extract-images.js';

// Default tool instances
export const htmlParser = createHtmlParserTool();
export const extractLinks = createExtractLinksTool();
export const extractImages = createExtractImagesTool();

// Tools array
export const htmlParserTools = [htmlParser, extractLinks, extractImages];

/**
 * Create HTML parser tools with custom configuration
 * 
 * @param config - Configuration options
 * @returns Array of HTML parser tools
 * 
 * @example
 * ```ts
 * const tools = createHtmlParserTools();
 * ```
 */
export function createHtmlParserTools(config: import('./types.js').HtmlParserToolsConfig = {}) {
  return [
    createHtmlParserTool(),
    createExtractLinksTool(),
    createExtractImagesTool(),
  ];
}

