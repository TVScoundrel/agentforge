/**
 * HTTP POST Tool
 * 
 * Make simple HTTP POST requests with JSON body.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { requestWithDestinationPolicy } from '../../egress-policy.js';
import type { DestinationPolicy } from '../../egress-policy.js';
import { httpPostSchema } from '../types.js';

/**
 * Create HTTP POST tool
 * 
 * @param defaultTimeout - Default timeout in milliseconds
 * @param defaultHeaders - Default headers to include in all requests
 */
export function createHttpPostTool(
  defaultTimeout: number = 30000,
  defaultHeaders: Record<string, string> = {},
  destinationPolicy: DestinationPolicy = {}
) {
  return toolBuilder()
    .name('http-post')
    .description('Make a policy-checked HTTP POST request with JSON body and return the response data. Local, metadata, link-local, and private-network destinations are blocked by default.')
    .category(ToolCategory.WEB)
    .tags(['http', 'post', 'api', 'web'])
    .schema(httpPostSchema)
    .implement(async (input) => {
      const response = await requestWithDestinationPolicy({
        method: 'POST',
        url: input.url,
        data: input.body,
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
          ...input.headers,
        },
        timeout: defaultTimeout,
      }, destinationPolicy);
      return response.data;
    })
    .build();
}
