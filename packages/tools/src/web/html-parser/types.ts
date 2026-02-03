/**
 * HTML Parser Types
 * 
 * Type definitions for HTML parsing tools.
 */

import { z } from 'zod';

/**
 * HTML parser tools configuration
 */
export interface HtmlParserToolsConfig {
  // No specific config needed for HTML parser tools currently
}

/**
 * HTML parser input schema
 */
export const htmlParserSchema = z.object({
  html: z.string().describe('The HTML content to parse'),
  selector: z.string().describe('CSS selector to find elements'),
  extractText: z.boolean().default(true).describe('Extract text content from selected elements'),
  extractHtml: z.boolean().default(false).describe('Extract inner HTML of selected elements'),
  extractAttributes: z.array(z.string().describe("String value")).optional().describe('List of attributes to extract (e.g., ["href", "src", "class"])'),
});

/**
 * Extract links input schema
 */
export const extractLinksSchema = z.object({
  html: z.string().describe('The HTML content to extract links from'),
  baseUrl: z.string().url().optional().describe('Optional base URL to resolve relative links'),
});

/**
 * Extract images input schema
 */
export const extractImagesSchema = z.object({
  html: z.string().describe('The HTML content to extract images from'),
  baseUrl: z.string().url().optional().describe('Optional base URL to resolve relative image URLs'),
});

