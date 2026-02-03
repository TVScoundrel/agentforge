/**
 * URL Builder Tool
 * 
 * Build URLs from components.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { urlBuilderSchema } from '../types.js';

/**
 * Create a URL builder tool
 * 
 * @returns URL builder tool
 * 
 * @example
 * ```ts
 * const builder = createUrlBuilderTool();
 * const result = await builder.execute({
 *   protocol: 'https',
 *   hostname: 'example.com',
 *   pathname: '/path',
 *   query: { foo: 'bar' }
 * });
 * ```
 */
export function createUrlBuilderTool() {
  return toolBuilder()
    .name('url-builder')
    .description('Build a URL from components (protocol, hostname, path, query parameters, hash).')
    .category(ToolCategory.WEB)
    .tags(['url', 'builder', 'construct'])
    .schema(urlBuilderSchema)
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
}

