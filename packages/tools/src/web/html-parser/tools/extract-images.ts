/**
 * Extract Images Tool
 * 
 * Extract all images from HTML content.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import * as cheerio from 'cheerio';
import { extractImagesSchema } from '../types.js';

/**
 * Create an extract images tool
 * 
 * @returns Extract images tool
 * 
 * @example
 * ```ts
 * const extractor = createExtractImagesTool();
 * const result = await extractor.execute({
 *   html: '<img src="/image.jpg" alt="Image">',
 *   baseUrl: 'https://example.com'
 * });
 * ```
 */
export function createExtractImagesTool() {
  return toolBuilder()
    .name('extract-images')
    .description('Extract all images from HTML content with their src, alt, and other attributes.')
    .category(ToolCategory.WEB)
    .tags(['html', 'images', 'extract', 'img'])
    .schema(extractImagesSchema)
    .implement(async (input) => {
      const $ = cheerio.load(input.html);
      const images: Array<{ src: string; alt?: string; title?: string; width?: string; height?: string }> = [];

      $('img[src]').each((_, el) => {
        const $el = $(el);
        let src = $el.attr('src') || '';
        
        // Resolve relative URLs if baseUrl is provided
        if (input.baseUrl && src) {
          try {
            src = new URL(src, input.baseUrl).href;
          } catch {
            // Keep original src if URL parsing fails
          }
        }

        images.push({
          src,
          alt: $el.attr('alt'),
          title: $el.attr('title'),
          width: $el.attr('width'),
          height: $el.attr('height'),
        });
      });

      return {
        count: images.length,
        images,
      };
    })
    .build();
}

