/**
 * Web Scraper Tool
 * 
 * Scrape and extract data from web pages using CSS selectors.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { createHtmlDocument } from '../../html-document.js';
import { requestWithDestinationPolicy } from '../../egress-policy.js';
import type { DestinationPolicy } from '../../egress-policy.js';
import { webScraperSchema, type ScraperResult } from '../types.js';

/**
 * Create a web scraper tool
 * 
 * @param defaultTimeout - Default timeout in milliseconds
 * @param userAgent - User agent string for requests
 * @returns Web scraper tool
 * 
 * @example
 * ```ts
 * const scraper = createWebScraperTool(60000, 'MyBot/1.0');
 * const result = await scraper.execute({
 *   url: 'https://example.com',
 *   selector: 'article h1',
 *   extractText: true
 * });
 * ```
 */
export function createWebScraperTool(
  defaultTimeout: number = 30000,
  userAgent: string = 'Mozilla/5.0 (compatible; AgentForge/1.0; +https://agentforge.dev)',
  destinationPolicy: DestinationPolicy = {}
) {
  return toolBuilder()
    .name('web-scraper')
    .description('Scrape and extract data from policy-checked web pages. Local, metadata, link-local, and private-network destinations are blocked by default. Supports text, HTML, links, images, and CSS selectors.')
    .category(ToolCategory.WEB)
    .tags(['scraper', 'web', 'html', 'extract', 'parse'])
    .schema(webScraperSchema)
    .implement(async (input): Promise<ScraperResult> => {
      // Fetch the page
      const response = await requestWithDestinationPolicy<string>({
        method: 'GET',
        url: input.url,
        timeout: input.timeout || defaultTimeout,
        headers: {
          'User-Agent': userAgent,
        },
      }, destinationPolicy);

      const document = createHtmlDocument(response.data);

      const result: ScraperResult = {
        url: response.config.url ?? input.url,
      };

      // Apply selector if provided
      const selected = document.select(input.selector || 'body');

      // Extract text
      if (input.extractText) {
        result.text = selected.text();
      }

      // Extract HTML
      if (input.extractHtml) {
        result.html = selected.html() || '';
      }

      // Extract links
      if (input.extractLinks) {
        result.links = document.links(input.url).filter(({ href }) => href).map(({ href }) => href);
      }

      // Extract images
      if (input.extractImages) {
        result.images = document.images(input.url).filter(({ src }) => src).map(({ src }) => src);
      }

      // Extract metadata
      if (input.extractMetadata) {
        result.metadata = document.metadata();
      }

      // If selector was provided, return the selected elements
      if (input.selector) {
        result.selected = selected.elements({ extractText: true, extractHtml: true });
      }

      return result;
    })
    .build();
}
