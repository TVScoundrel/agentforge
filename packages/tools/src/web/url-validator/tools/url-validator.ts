/**
 * URL Validator Tool
 * 
 * Validate and parse URLs.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { urlValidatorSchema, type UrlValidationResult } from '../types.js';

/**
 * Create a URL validator tool
 * 
 * @returns URL validator tool
 * 
 * @example
 * ```ts
 * const validator = createUrlValidatorTool();
 * const result = await validator.execute({
 *   url: 'https://example.com/path?query=value#hash'
 * });
 * ```
 */
export function createUrlValidatorTool() {
  return toolBuilder()
    .name('url-validator')
    .description('Validate and parse URLs. Returns detailed information about the URL structure including protocol, hostname, path, query parameters, and hash.')
    .category(ToolCategory.WEB)
    .tags(['url', 'validator', 'parse', 'validate'])
    .schema(urlValidatorSchema)
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
}

