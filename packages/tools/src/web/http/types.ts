/**
 * HTTP Tools Types
 * 
 * Type definitions for HTTP client tools.
 */

import { z } from 'zod';

/**
 * HTTP method enum
 */
export const HttpMethod = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']);

/**
 * HTTP request schema
 */
export const httpRequestSchema = z.object({
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
 * HTTP GET request schema
 */
export const httpGetSchema = z.object({
  url: z.string().url().describe('The URL to fetch'),
  headers: z.record(z.string()).optional().describe('Optional HTTP headers'),
  params: z.record(z.string()).optional().describe('Optional URL query parameters'),
});

/**
 * HTTP POST request schema
 */
export const httpPostSchema = z.object({
  url: z.string().url().describe('The URL to post to'),
  body: z.any().describe('The request body (will be sent as JSON)'),
  headers: z.record(z.string()).optional().describe('Optional HTTP headers'),
});

/**
 * HTTP tools configuration
 */
export interface HttpToolsConfig {
  defaultTimeout?: number;
  defaultHeaders?: Record<string, string>;
}

