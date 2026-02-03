/**
 * Web Scraper Types
 * 
 * Type definitions for web scraping tools.
 */

import { z } from 'zod';

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
 * Scraper tools configuration
 */
export interface ScraperToolsConfig {
  defaultTimeout?: number;
  userAgent?: string;
}

/**
 * Web scraper input schema
 */
export const webScraperSchema = z.object({
  url: z.string().url().describe('The URL of the web page to scrape'),
  selector: z.string().optional().describe('Optional CSS selector to extract specific elements'),
  extractText: z.boolean().default(true).describe('Extract text content from the page'),
  extractHtml: z.boolean().default(false).describe('Extract raw HTML content'),
  extractLinks: z.boolean().default(false).describe('Extract all links from the page'),
  extractImages: z.boolean().default(false).describe('Extract all image URLs from the page'),
  extractMetadata: z.boolean().default(false).describe('Extract meta tags (title, description, etc.)'),
  timeout: z.number().default(30000).describe('Request timeout in milliseconds'),
});

