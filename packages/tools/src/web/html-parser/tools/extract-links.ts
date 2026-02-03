/**
 * Extract Links Tool
 * 
 * Extract all links from HTML content.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import * as cheerio from 'cheerio';
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
      const $ = cheerio.load(input.html);
      const links: Array<{ text: string; href: string; title?: string }> = [];

      $('a[href]').each((_, el) => {
        const $el = $(el);
        let href = $el.attr('href') || '';
        
        // Resolve relative URLs if baseUrl is provided
        if (input.baseUrl && href) {
          try {
            href = new URL(href, input.baseUrl).href;
          } catch {
            // Keep original href if URL parsing fails
          }
        }

        links.push({
          text: $el.text().trim(),
          href,
          title: $el.attr('title'),
        });
      });

      return {
        count: links.length,
        links,
      };
    })
    .build();
}

