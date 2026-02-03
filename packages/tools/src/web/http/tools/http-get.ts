/**
 * HTTP GET Tool
 * 
 * Make simple HTTP GET requests.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import axios from 'axios';
import { httpGetSchema } from '../types.js';

/**
 * Create HTTP GET tool
 * 
 * @param defaultTimeout - Default timeout in milliseconds
 * @param defaultHeaders - Default headers to include in all requests
 */
export function createHttpGetTool(
  defaultTimeout: number = 30000,
  defaultHeaders: Record<string, string> = {}
) {
  return toolBuilder()
    .name('http-get')
    .description('Make a simple HTTP GET request to a URL and return the response data.')
    .category(ToolCategory.WEB)
    .tags(['http', 'get', 'fetch', 'web'])
    .schema(httpGetSchema)
    .implement(async (input) => {
      const response = await axios.get(input.url, {
        headers: { ...defaultHeaders, ...input.headers },
        params: input.params,
        timeout: defaultTimeout,
      });
      return response.data;
    })
    .build();
}

