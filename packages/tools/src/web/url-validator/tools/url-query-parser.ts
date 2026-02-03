/**
 * URL Query Parser Tool
 * 
 * Parse query parameters from URLs.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { urlQueryParserSchema } from '../types.js';

/**
 * Create a URL query parser tool
 * 
 * @returns URL query parser tool
 * 
 * @example
 * ```ts
 * const parser = createUrlQueryParserTool();
 * const result = await parser.execute({
 *   input: 'https://example.com?foo=bar&baz=qux'
 * });
 * ```
 */
export function createUrlQueryParserTool() {
  return toolBuilder()
    .name('url-query-parser')
    .description('Parse query parameters from a URL or query string into a key-value object.')
    .category(ToolCategory.WEB)
    .tags(['url', 'query', 'parse', 'params'])
    .schema(urlQueryParserSchema)
    .implement(async (input) => {
      let searchParams: URLSearchParams;
      
      try {
        // Try to parse as full URL first
        const url = new URL(input.input);
        searchParams = url.searchParams;
      } catch {
        // If that fails, treat as query string
        const queryString = input.input.startsWith('?') ? input.input.slice(1) : input.input;
        searchParams = new URLSearchParams(queryString);
      }
      
      const params: Record<string, string | string[]> = {};
      
      searchParams.forEach((value, key) => {
        if (params[key]) {
          // Handle multiple values for same key
          if (Array.isArray(params[key])) {
            (params[key] as string[]).push(value);
          } else {
            params[key] = [params[key] as string, value];
          }
        } else {
          params[key] = value;
        }
      });
      
      return {
        params,
        count: Object.keys(params).length,
      };
    })
    .build();
}

