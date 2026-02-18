/**
 * URL Validator Types
 * 
 * Type definitions for URL validation and manipulation tools.
 */

import { z } from 'zod';

/**
 * URL validation result
 */
export interface UrlValidationResult {
  url: string;
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
}

/**
 * URL validator tools configuration
 */
export type UrlValidatorToolsConfig = Record<string, never>;

/**
 * URL validator input schema
 */
export const urlValidatorSchema = z.object({
  url: z.string().describe('The URL to validate and parse'),
});

/**
 * URL builder input schema
 */
export const urlBuilderSchema = z.object({
  protocol: z.string().default('https').describe('Protocol (http, https, etc.)'),
  hostname: z.string().describe('Hostname or domain name'),
  port: z.string().optional().describe('Optional port number'),
  pathname: z.string().default('/').describe('URL path'),
  query: z.record(z.string()).optional().describe('Query parameters as key-value pairs'),
  hash: z.string().optional().describe('URL hash/fragment'),
});

/**
 * URL query parser input schema
 */
export const urlQueryParserSchema = z.object({
  input: z.string().describe('URL or query string to parse (e.g., "?foo=bar&baz=qux" or full URL)'),
});
