/**
 * Web Search Tool
 * 
 * Search the web using DuckDuckGo (free) or Serper (optional upgrade).
 * Provides smart fallback and normalized results.
 * 
 * @example
 * ```ts
 * // Basic usage (no API key needed)
 * const result = await webSearch.invoke({
 *   query: 'What is TypeScript?'
 * });
 * 
 * // With Serper API key (set SERPER_API_KEY env var)
 * const result = await webSearch.invoke({
 *   query: 'Best restaurants in SF 2026',
 *   preferSerper: true
 * });
 * ```
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { webSearchSchema } from './schemas.js';
import { createDuckDuckGoProvider } from './providers/duckduckgo.js';
import { createSerperProvider } from './providers/serper.js';
import { measureTime, sanitizeQuery } from './utils.js';
import type { WebSearchInput, WebSearchOutput, SearchProvider } from './types.js';

/**
 * Web search tool implementation
 */
export const webSearch = toolBuilder()
  .name('web-search')
  .description(
    'Search the web for information using DuckDuckGo (free) or Serper API (optional). ' +
    'Returns structured search results with titles, links, and snippets. ' +
    'Automatically falls back to Serper if DuckDuckGo returns no results and API key is available.'
  )
  .category(ToolCategory.WEB)
  .tags(['search', 'web', 'google', 'duckduckgo', 'serper', 'internet'])
  .schema(webSearchSchema)
  .implement(async (input: WebSearchInput): Promise<WebSearchOutput> => {
    const { query, maxResults = 10, preferSerper = false } = input;

    // Sanitize query
    const sanitizedQuery = sanitizeQuery(query);

    // Initialize providers
    const duckduckgo = createDuckDuckGoProvider();
    const serper = createSerperProvider();

    // Determine which provider to use
    let primaryProvider: SearchProvider;
    let fallbackProvider: SearchProvider | null = null;

    if (preferSerper && serper.isAvailable()) {
      primaryProvider = serper;
      fallbackProvider = duckduckgo;
    } else {
      primaryProvider = duckduckgo;
      fallbackProvider = serper.isAvailable() ? serper : null;
    }

    try {
      // Try primary provider
      const { result: results, duration } = await measureTime(() =>
        primaryProvider.search(sanitizedQuery, maxResults)
      );

      // If primary provider returns results, return them
      if (results.length > 0) {
        return {
          success: true,
          source: primaryProvider.name,
          query: sanitizedQuery,
          results,
          totalResults: results.length,
          metadata: {
            responseTime: duration,
            fallbackUsed: false,
          },
        };
      }

      // If no results and fallback is available, try fallback
      if (fallbackProvider) {
        const { result: fallbackResults, duration: fallbackDuration } =
          await measureTime(() =>
            fallbackProvider!.search(sanitizedQuery, maxResults)
          );

        return {
          success: true,
          source: fallbackProvider.name,
          query: sanitizedQuery,
          results: fallbackResults,
          totalResults: fallbackResults.length,
          metadata: {
            responseTime: fallbackDuration,
            fallbackUsed: true,
          },
        };
      }

      // No results from either provider
      return {
        success: true,
        source: primaryProvider.name,
        query: sanitizedQuery,
        results: [],
        totalResults: 0,
        metadata: {
          responseTime: duration,
          fallbackUsed: false,
        },
      };
    } catch (error: any) {
      // Error occurred
      return {
        success: false,
        source: primaryProvider.name,
        query: sanitizedQuery,
        results: [],
        error: error.message,
      };
    }
  })
  .build();

// Export types and schemas for external use
export * from './types.js';
export * from './schemas.js';
export * from './providers/duckduckgo.js';
export * from './providers/serper.js';

