/**
 * Extract Images Tool
 * 
 * Extract all images from HTML content.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { createHtmlDocument } from '../../html-document.js';
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
      const images: Array<{ src: string; alt?: string; title?: string; width?: string; height?: string }> = createHtmlDocument(input.html).images(input.baseUrl);

      return {
        count: images.length,
        images,
      };
    })
    .build();
}

