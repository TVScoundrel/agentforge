/**
 * Web Scraper Tools
 * 
 * Tools for scraping and extracting data from web pages.
 */

// Export types
export type { ScraperResult, ScraperToolsConfig } from './types.js';
export { webScraperSchema } from './types.js';

// Export tool factory
export { createWebScraperTool } from './tools/web-scraper.js';
import { createWebScraperTool } from './tools/web-scraper.js';

// Default tool instance
export const webScraper = createWebScraperTool();

// Tools array
export const scraperTools = [webScraper];

/**
 * Create scraper tools with custom configuration
 * 
 * @param config - Configuration options
 * @returns Array of scraper tools
 * 
 * @example
 * ```ts
 * const tools = createScraperTools({
 *   defaultTimeout: 60000,
 *   userAgent: 'MyBot/1.0'
 * });
 * ```
 */
export function createScraperTools(config: import('./types.js').ScraperToolsConfig = {}) {
  const { defaultTimeout = 30000, userAgent = 'Mozilla/5.0 (compatible; AgentForge/1.0; +https://agentforge.dev)' } = config;
  return [createWebScraperTool(defaultTimeout, userAgent)];
}

