/**
 * Serper Search Provider
 * 
 * Premium search provider using Serper API (Google results).
 * Requires SERPER_API_KEY environment variable.
 * Get your API key at: https://serper.dev
 */

import axios from 'axios';
import type { SearchProvider, SearchResult } from '../types.js';
import { getSerperApiKey } from '../utils.js';

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
   */
  async search(query: string, maxResults: number): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error(
        'Serper API key not found. Set SERPER_API_KEY environment variable. Get your key at https://serper.dev'
      );
    }

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
          timeout: 10000,
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
  }

  /**
   * Normalize Serper response to SearchResult[]
   */
  private normalizeResults(
    data: SerperResponse,
    maxResults: number
  ): SearchResult[] {
    if (!data.organic || data.organic.length === 0) {
      return [];
    }

    return data.organic
      .slice(0, maxResults)
      .filter((item) => item.title && item.link && item.snippet)
      .map((item, index) => ({
        title: item.title!,
        link: item.link!,
        snippet: item.snippet!,
        position: item.position ?? index + 1,
      }));
  }
}

/**
 * Create a new Serper provider instance
 */
export function createSerperProvider(): SerperProvider {
  return new SerperProvider();
}

