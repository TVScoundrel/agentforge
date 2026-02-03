/**
 * URL Validator Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { UrlValidatorSimpleSchema } from '../types.js';

/**
 * Create URL validator tool
 */
export function createUrlValidatorSimpleTool() {
  return toolBuilder()
    .name('url-validator-simple')
    .description('Validate if a string is a valid URL format.')
    .category(ToolCategory.UTILITY)
    .tags(['validation', 'url', 'validate'])
    .schema(UrlValidatorSimpleSchema)
    .implement(async (input) => {
      try {
        new URL(input.url);
        return {
          valid: true,
          url: input.url,
          message: 'Valid URL',
        };
      } catch {
        return {
          valid: false,
          url: input.url,
          message: 'Invalid URL format',
        };
      }
    })
    .build();
}

