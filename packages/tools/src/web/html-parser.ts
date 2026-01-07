/**
 * HTML Parser Tool
 * 
 * Parse HTML content and extract data using CSS selectors.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import * as cheerio from 'cheerio';

/**
 * HTML parser tool
 * 
 * @example
 * ```ts
 * const result = await htmlParser.execute({
 *   html: '<div class="content"><h1>Title</h1><p>Text</p></div>',
 *   selector: '.content h1'
 * });
 * ```
 */
export const htmlParser = toolBuilder()
  .name('html-parser')
  .description('Parse HTML content and extract data using CSS selectors. Returns text, attributes, and structure of selected elements.')
  .category(ToolCategory.WEB)
  .tags(['html', 'parser', 'css', 'selector', 'extract'])
  .schema(z.object({
    html: z.string().describe('The HTML content to parse'),
    selector: z.string().describe('CSS selector to find elements'),
    extractText: z.boolean().default(true).describe('Extract text content from selected elements'),
    extractHtml: z.boolean().default(false).describe('Extract inner HTML of selected elements'),
    extractAttributes: z.array(z.string().describe("String value")).optional().describe('List of attributes to extract (e.g., ["href", "src", "class"])'),
  }))
  .implement(async (input) => {
    const $ = cheerio.load(input.html);
    const $selected = $(input.selector);

    const results = $selected.map((_, el) => {
      const $el = $(el);
      const item: any = {};

      if (input.extractText) {
        item.text = $el.text().trim();
      }

      if (input.extractHtml) {
        item.html = $el.html();
      }

      if (input.extractAttributes && input.extractAttributes.length > 0) {
        item.attributes = {};
        for (const attr of input.extractAttributes) {
          const value = $el.attr(attr);
          if (value !== undefined) {
            item.attributes[attr] = value;
          }
        }
      }

      return item;
    }).get();

    return {
      count: results.length,
      results,
    };
  })
  .build();

/**
 * Extract links from HTML
 */
export const extractLinks = toolBuilder()
  .name('extract-links')
  .description('Extract all links (anchor tags) from HTML content with their text and href attributes.')
  .category(ToolCategory.WEB)
  .tags(['html', 'links', 'extract', 'anchor'])
  .schema(z.object({
    html: z.string().describe('The HTML content to extract links from'),
    baseUrl: z.string().url().optional().describe('Optional base URL to resolve relative links'),
  }))
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

/**
 * Extract images from HTML
 */
export const extractImages = toolBuilder()
  .name('extract-images')
  .description('Extract all images from HTML content with their src, alt, and other attributes.')
  .category(ToolCategory.WEB)
  .tags(['html', 'images', 'extract', 'img'])
  .schema(z.object({
    html: z.string().describe('The HTML content to extract images from'),
    baseUrl: z.string().url().optional().describe('Optional base URL to resolve relative image URLs'),
  }))
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

