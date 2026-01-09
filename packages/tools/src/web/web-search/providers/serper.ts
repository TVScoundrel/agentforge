/**
 * Serper Search Provider
 * 
 * Premium search provider using Serper API (Google results).
 * Requires SERPER_API_KEY environment variable.
 * Get your API key at: https://serper.dev
 */

import axios from 'axios';
import type { SearchProvider, SearchResult } from '../types.js';
import { getSerperApiKey, retryWithBackoff, DEFAULT_TIMEOUT } from '../utils.js';

/**
 * Serper API response structure
 */
interface SerperResponse {
  organic?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    position?: number;
  }>;
  searchParameters?: {
    q?: string;
    num?: number;
  };
}

/**
 * Serper search provider implementation
 */
export class SerperProvider implements SearchProvider {
  name = 'serper' as const;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = getSerperApiKey();
  }

  /**
   * Serper is available if API key is set
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Search using Serper API
   * @param query - Search query
   * @param maxResults - Maximum number of results to return
   * @param timeout - Request timeout in milliseconds (default: 30000)
   */
  async search(
    query: string,
    maxResults: number,
    timeout: number = DEFAULT_TIMEOUT
  ): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error(
        'Serper API key not found. Set SERPER_API_KEY environment variable. Get your key at https://serper.dev'
      );
    }

    return retryWithBackoff(async () => {
      try {
        const response = await axios.post<SerperResponse>(
          'https://google.serper.dev/search',
          {
            q: query,
            num: maxResults,
          },
          {
            headers: {
              'X-API-KEY': this.apiKey,
              'Content-Type': 'application/json',
            },
            timeout,
          }
        );

        return this.normalizeResults(response.data, maxResults);
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new Error(
            'Invalid Serper API key. Get your key at https://serper.dev'
          );
        }
        if (error.response?.status === 429) {
          throw new Error(
            'Serper API rate limit exceeded. Please try again later or upgrade your plan at https://serper.dev'
          );
        }
        throw new Error(`Serper search failed: ${error.message}`);
      }
    });
  }

  /**
   * Normalize Serper response to SearchResult[]
   * Optimized for performance with large result sets
   */
  private normalizeResults(
    data: SerperResponse,
    maxResults: number
  ): SearchResult[] {
    // Early return for empty results
    if (!data.organic || data.organic.length === 0 || maxResults <= 0) {
      return [];
    }

    // Pre-allocate array with expected size for better performance
    const results: SearchResult[] = [];

    // Only process the number of items we need (avoid processing entire array)
    const itemsToProcess = Math.min(data.organic.length, maxResults);

    for (let i = 0; i < itemsToProcess; i++) {
      const item = data.organic[i];

      // Skip items with missing required fields
      if (!item.title || !item.link || !item.snippet) {
        continue;
      }

      results.push({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        position: item.position ?? i + 1,
      });

      // Stop if we've collected enough results
      if (results.length >= maxResults) {
        break;
      }
    }

    return results;
  }
}

/**
 * Create a new Serper provider instance
 */
export function createSerperProvider(): SerperProvider {
  return new SerperProvider();
}

