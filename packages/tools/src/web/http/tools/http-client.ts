/**
 * HTTP Client Tool
 * 
 * Make HTTP requests with support for GET, POST, PUT, DELETE, PATCH methods.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import axios, { AxiosRequestConfig } from 'axios';
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
  defaultHeaders: Record<string, string> = {}
) {
  return toolBuilder()
    .name('http-client')
    .description('Make HTTP requests to web APIs and services. Supports GET, POST, PUT, DELETE, PATCH methods with custom headers and body.')
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

      const response = await axios(config);

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        data: response.data,
        url: input.url,
        method: input.method ?? 'GET',
      };
    })
    .build();
}

