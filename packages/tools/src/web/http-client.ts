/**
 * HTTP Client Tool
 * 
 * Make HTTP requests with support for GET, POST, PUT, DELETE, PATCH methods.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import axios, { AxiosRequestConfig } from 'axios';

/**
 * HTTP method enum
 */
const HttpMethod = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']);

/**
 * HTTP request schema
 */
const httpRequestSchema = z.object({
  url: z.string().url().describe('The URL to make the request to'),
  method: HttpMethod.default('GET').describe('HTTP method to use'),
  headers: z.record(z.string()).optional().describe('Optional HTTP headers'),
  body: z.any().optional().describe('Optional request body (for POST, PUT, PATCH)'),
  timeout: z.number().default(30000).describe('Request timeout in milliseconds'),
  params: z.record(z.string()).optional().describe('Optional URL query parameters'),
});

/**
 * HTTP response type
 */
export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  url: string;
  method: string;
}

/**
 * Create HTTP client tool
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
export const httpClient = toolBuilder()
  .name('http-client')
  .description('Make HTTP requests to web APIs and services. Supports GET, POST, PUT, DELETE, PATCH methods with custom headers and body.')
  .category(ToolCategory.WEB)
  .tags(['http', 'api', 'request', 'web'])
  .schema(httpRequestSchema)
  .implement(async (input): Promise<HttpResponse> => {
    const config: AxiosRequestConfig = {
      method: input.method,
      url: input.url,
      headers: input.headers,
      data: input.body,
      timeout: input.timeout,
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

/**
 * Create a simple GET request tool
 */
export const httpGet = toolBuilder()
  .name('http-get')
  .description('Make a simple HTTP GET request to a URL and return the response data.')
  .category(ToolCategory.WEB)
  .tags(['http', 'get', 'fetch', 'web'])
  .schema(z.object({
    url: z.string().url().describe('The URL to fetch'),
    headers: z.record(z.string()).optional().describe('Optional HTTP headers'),
    params: z.record(z.string()).optional().describe('Optional URL query parameters'),
  }))
  .implement(async (input) => {
    const response = await axios.get(input.url, {
      headers: input.headers,
      params: input.params,
      timeout: 30000,
    });
    return response.data;
  })
  .build();

/**
 * Create a simple POST request tool
 */
export const httpPost = toolBuilder()
  .name('http-post')
  .description('Make a simple HTTP POST request with JSON body and return the response data.')
  .category(ToolCategory.WEB)
  .tags(['http', 'post', 'api', 'web'])
  .schema(z.object({
    url: z.string().url().describe('The URL to post to'),
    body: z.any().describe('The request body (will be sent as JSON)'),
    headers: z.record(z.string()).optional().describe('Optional HTTP headers'),
  }))
  .implement(async (input) => {
    const response = await axios.post(input.url, input.body, {
      headers: {
        'Content-Type': 'application/json',
        ...input.headers,
      },
      timeout: 30000,
    });
    return response.data;
  })
  .build();

