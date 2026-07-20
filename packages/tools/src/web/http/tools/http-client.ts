/**
 * HTTP Client Tool
 * 
 * Make HTTP requests with support for GET, POST, PUT, DELETE, PATCH methods.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import type { AxiosRequestConfig } from 'axios';
import { requestWithDestinationPolicy } from '../../egress-policy.js';
import type { DestinationPolicy } from '../../egress-policy.js';
import { httpRequestSchema, HttpResponse } from '../types.js';

/**
 * Create HTTP client tool
 * 
 * @param defaultTimeout - Default timeout in milliseconds
 * @param defaultHeaders - Default headers to include in all requests
 * 
 * @example
 * ```ts
 * const result = await httpClient.execute({
 *   url: 'https://api.example.com/data',
 *   method: 'GET',
 *   headers: { 'Authorization': 'Bearer token' }
 * });
 * ```
 */
export function createHttpClientTool(
  defaultTimeout: number = 30000,
  defaultHeaders: Record<string, string> = {},
  destinationPolicy: DestinationPolicy = {}
) {
  return toolBuilder()
    .name('http-client')
    .description('Make policy-checked HTTP requests to web APIs and services. Supports GET, POST, PUT, DELETE, PATCH methods with custom headers and body. Local, metadata, link-local, and private-network destinations are blocked by default.')
    .category(ToolCategory.WEB)
    .tags(['http', 'api', 'request', 'web'])
    .schema(httpRequestSchema)
    .implement(async (input): Promise<HttpResponse> => {
      const config: AxiosRequestConfig = {
        method: input.method,
        url: input.url,
        headers: { ...defaultHeaders, ...input.headers },
        data: input.body,
        timeout: input.timeout ?? defaultTimeout,
        params: input.params,
        validateStatus: () => true, // Don't throw on any status code
      };

      const response = await requestWithDestinationPolicy(config, destinationPolicy);

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        data: response.data,
        url: response.config.url ?? input.url,
        method: input.method ?? 'GET',
      };
    })
    .build();
}
