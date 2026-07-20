/**
 * HTTP GET Tool
 * 
 * Make simple HTTP GET requests.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { requestWithDestinationPolicy } from '../../egress-policy.js';
import { httpGetSchema } from '../types.js';

/**
 * Create HTTP GET tool
 * 
 * @param defaultTimeout - Default timeout in milliseconds
 * @param defaultHeaders - Default headers to include in all requests
 */
export function createHttpGetTool(
  defaultTimeout: number = 30000,
  defaultHeaders: Record<string, string> = {},
  destinationPolicy = {}
) {
  return toolBuilder()
    .name('http-get')
    .description('Make a policy-checked HTTP GET request to a URL and return the response data. Local, metadata, link-local, and private-network destinations are blocked by default.')
    .category(ToolCategory.WEB)
    .tags(['http', 'get', 'fetch', 'web'])
    .schema(httpGetSchema)
    .implement(async (input) => {
      const response = await requestWithDestinationPolicy({
        method: 'GET',
        url: input.url,
        headers: { ...defaultHeaders, ...input.headers },
        params: input.params,
        timeout: defaultTimeout,
      }, destinationPolicy);
      return response.data;
    })
    .build();
}
