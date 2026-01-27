/**
 * URL Validator and Parser Tool
 * 
 * Validate, parse, and manipulate URLs.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
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
 * URL validator tool
 * 
 * @example
 * ```ts
 * const result = await urlValidator.execute({
 *   url: 'https://example.com/path?query=value#hash'
 * });
 * ```
 */
export const urlValidator = toolBuilder()
  .name('url-validator')
  .description('Validate and parse URLs. Returns detailed information about the URL structure including protocol, hostname, path, query parameters, and hash.')
  .category(ToolCategory.WEB)
  .tags(['url', 'validator', 'parse', 'validate'])
  .schema(z.object({
    url: z.string().describe('The URL to validate and parse'),
  }))
  .implementSafe(async (input): Promise<UrlValidationResult> => {
    const parsed = new URL(input.url);

    return {
      url: parsed.href,
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
      origin: parsed.origin,
    };
  })
  .build();

/**
 * URL builder tool
 */
export const urlBuilder = toolBuilder()
  .name('url-builder')
  .description('Build a URL from components (protocol, hostname, path, query parameters, hash).')
  .category(ToolCategory.WEB)
  .tags(['url', 'builder', 'construct'])
  .schema(z.object({
    protocol: z.string().default('https').describe('Protocol (http, https, etc.)'),
    hostname: z.string().describe('Hostname or domain name'),
    port: z.string().optional().describe('Optional port number'),
    pathname: z.string().default('/').describe('URL path'),
    query: z.record(z.string()).optional().describe('Query parameters as key-value pairs'),
    hash: z.string().optional().describe('URL hash/fragment'),
  }))
  .implement(async (input) => {
    const url = new URL(`${input.protocol}://${input.hostname}`);

    if (input.port) {
      url.port = input.port;
    }

    url.pathname = input.pathname ?? '/';
    
    if (input.query) {
      Object.entries(input.query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    if (input.hash) {
      url.hash = input.hash;
    }
    
    return {
      url: url.href,
      components: {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        origin: url.origin,
      },
    };
  })
  .build();

/**
 * URL query parser tool
 */
export const urlQueryParser = toolBuilder()
  .name('url-query-parser')
  .description('Parse query parameters from a URL or query string into a key-value object.')
  .category(ToolCategory.WEB)
  .tags(['url', 'query', 'parse', 'params'])
  .schema(z.object({
    input: z.string().describe('URL or query string to parse (e.g., "?foo=bar&baz=qux" or full URL)'),
  }))
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

