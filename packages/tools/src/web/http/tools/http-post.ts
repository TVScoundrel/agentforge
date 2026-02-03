/**
 * HTTP POST Tool
 * 
 * Make simple HTTP POST requests with JSON body.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import axios from 'axios';
import { httpPostSchema } from '../types.js';

/**
 * Create HTTP POST tool
 * 
 * @param defaultTimeout - Default timeout in milliseconds
 * @param defaultHeaders - Default headers to include in all requests
 */
export function createHttpPostTool(
  defaultTimeout: number = 30000,
  defaultHeaders: Record<string, string> = {}
) {
  return toolBuilder()
    .name('http-post')
    .description('Make a simple HTTP POST request with JSON body and return the response data.')
    .category(ToolCategory.WEB)
    .tags(['http', 'post', 'api', 'web'])
    .schema(httpPostSchema)
    .implement(async (input) => {
      const response = await axios.post(input.url, input.body, {
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
          ...input.headers,
        },
        timeout: defaultTimeout,
      });
      return response.data;
    })
    .build();
}

