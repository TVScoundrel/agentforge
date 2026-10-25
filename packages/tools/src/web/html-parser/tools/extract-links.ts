/**
 * Extract Links Tool
 * 
 * Extract all links from HTML content.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { createHtmlDocument } from '../../html-document.js';
import { extractLinksSchema } from '../types.js';

/**
 * Create an extract links tool
 * 
 * @returns Extract links tool
 * 
 * @example
 * ```ts
 * const extractor = createExtractLinksTool();
 * const result = await extractor.execute({
 *   html: '<a href="/page">Link</a>',
 *   baseUrl: 'https://example.com'
 * });
 * ```
 */
export function createExtractLinksTool() {
  return toolBuilder()
    .name('extract-links')
    .description('Extract all links (anchor tags) from HTML content with their text and href attributes.')
    .category(ToolCategory.WEB)
    .tags(['html', 'links', 'extract', 'anchor'])
    .schema(extractLinksSchema)
    .implement(async (input) => {
      const links: Array<{ text: string; href: string; title?: string }> = createHtmlDocument(input.html).links(input.baseUrl);

      return {
        count: links.length,
        links,
      };
    })
    .build();
}

