/**
 * Web Scraper Tool
 * 
 * Scrape and extract data from web pages using CSS selectors.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scraper result type
 */
export interface ScraperResult {
  url: string;
  title?: string;
  text?: string;
  html?: string;
  links?: string[];
  images?: string[];
  metadata?: Record<string, string>;
  selected?: any;
}

/**
 * Web scraper tool
 * 
 * @example
 * ```ts
 * const result = await webScraper.execute({
 *   url: 'https://example.com',
 *   selector: 'article h1',
 *   extractText: true
 * });
 * ```
 */
export const webScraper = toolBuilder()
  .name('web-scraper')
  .description('Scrape and extract data from web pages. Can extract text, HTML, links, images, and use CSS selectors to target specific elements.')
  .category(ToolCategory.WEB)
  .tags(['scraper', 'web', 'html', 'extract', 'parse'])
  .schema(z.object({
    url: z.string().url().describe('The URL of the web page to scrape'),
    selector: z.string().optional().describe('Optional CSS selector to extract specific elements'),
    extractText: z.boolean().default(true).describe('Extract text content from the page'),
    extractHtml: z.boolean().default(false).describe('Extract raw HTML content'),
    extractLinks: z.boolean().default(false).describe('Extract all links from the page'),
    extractImages: z.boolean().default(false).describe('Extract all image URLs from the page'),
    extractMetadata: z.boolean().default(false).describe('Extract meta tags (title, description, etc.)'),
    timeout: z.number().default(30000).describe('Request timeout in milliseconds'),
  }))
  .implement(async (input): Promise<ScraperResult> => {
    // Fetch the page
    const response = await axios.get(input.url, {
      timeout: input.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AgentForge/1.0; +https://agentforge.dev)',
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const result: ScraperResult = {
      url: input.url,
    };

    // Apply selector if provided
    const $selected = input.selector ? $(input.selector) : $('body');

    // Extract text
    if (input.extractText) {
      result.text = $selected.text().trim();
    }

    // Extract HTML
    if (input.extractHtml) {
      result.html = $selected.html() || '';
    }

    // Extract links
    if (input.extractLinks) {
      result.links = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          // Convert relative URLs to absolute
          try {
            const absoluteUrl = new URL(href, input.url).href;
            result.links!.push(absoluteUrl);
          } catch {
            result.links!.push(href);
          }
        }
      });
    }

    // Extract images
    if (input.extractImages) {
      result.images = [];
      $('img[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src) {
          // Convert relative URLs to absolute
          try {
            const absoluteUrl = new URL(src, input.url).href;
            result.images!.push(absoluteUrl);
          } catch {
            result.images!.push(src);
          }
        }
      });
    }

    // Extract metadata
    if (input.extractMetadata) {
      result.metadata = {};
      
      // Title
      const title = $('title').text() || $('meta[property="og:title"]').attr('content');
      if (title) result.metadata.title = title;

      // Description
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content');
      if (description) result.metadata.description = description;

      // Other meta tags
      $('meta[name], meta[property]').each((_, el) => {
        const name = $(el).attr('name') || $(el).attr('property');
        const content = $(el).attr('content');
        if (name && content) {
          result.metadata![name] = content;
        }
      });
    }

    // If selector was provided, return the selected elements
    if (input.selector) {
      result.selected = $selected.map((_, el) => ({
        text: $(el).text().trim(),
        html: $(el).html(),
      })).get();
    }

    return result;
  })
  .build();

