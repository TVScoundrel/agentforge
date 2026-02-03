/**
 * HTTP Tools
 * 
 * Tools for making HTTP requests to web APIs and services.
 */

import { createHttpClientTool } from './tools/http-client.js';
import { createHttpGetTool } from './tools/http-get.js';
import { createHttpPostTool } from './tools/http-post.js';
import type { HttpToolsConfig } from './types.js';

// Export types
export * from './types.js';

// Default tool instances
export const httpClient = createHttpClientTool();
export const httpGet = createHttpGetTool();
export const httpPost = createHttpPostTool();

// Tools array
export const httpTools = [httpClient, httpGet, httpPost];

/**
 * Create HTTP tools with custom configuration
 * 
 * @param config - Configuration options for HTTP tools
 * @returns Array of configured HTTP tools
 * 
 * @example
 * ```ts
 * const tools = createHttpTools({
 *   defaultTimeout: 60000,
 *   defaultHeaders: { 'User-Agent': 'MyApp/1.0' }
 * });
 * ```
 */
export function createHttpTools(config: HttpToolsConfig = {}) {
  const { defaultTimeout = 30000, defaultHeaders = {} } = config;

  return [
    createHttpClientTool(defaultTimeout, defaultHeaders),
    createHttpGetTool(defaultTimeout, defaultHeaders),
    createHttpPostTool(defaultTimeout, defaultHeaders),
  ];
}

