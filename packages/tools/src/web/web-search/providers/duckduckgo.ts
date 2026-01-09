/**
 * DuckDuckGo Search Provider
 * 
 * Free search provider using DuckDuckGo's Instant Answer API.
 * No API key required.
 */

import axios from 'axios';
import type { SearchProvider, SearchResult } from '../types.js';

/**
 * DuckDuckGo API response structure
 */
interface DuckDuckGoResponse {
  Abstract?: string;
  AbstractText?: string;
  AbstractSource?: string;
  AbstractURL?: string;
  Heading?: string;
  RelatedTopics?: Array<{
    Text?: string;
    FirstURL?: string;
  }>;
  Results?: Array<{
    Text?: string;
    FirstURL?: string;
  }>;
}

/**
 * DuckDuckGo search provider implementation
 */
export class DuckDuckGoProvider implements SearchProvider {
  name = 'duckduckgo' as const;

  /**
   * DuckDuckGo is always available (no API key required)
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Search using DuckDuckGo Instant Answer API
   */
  async search(query: string, maxResults: number): Promise<SearchResult[]> {
    try {
      const response = await axios.get<DuckDuckGoResponse>(
        'https://api.duckduckgo.com/',
        {
          params: {
            q: query,
            format: 'json',
          },
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; AgentForge/1.0; +https://github.com/agentforge)',
          },
          timeout: 10000,
        }
      );

      return this.normalizeResults(response.data, maxResults);
    } catch (error: any) {
      throw new Error(`DuckDuckGo search failed: ${error.message}`);
    }
  }

  /**
   * Normalize DuckDuckGo response to SearchResult[]
   */
  private normalizeResults(
    data: DuckDuckGoResponse,
    maxResults: number
  ): SearchResult[] {
    const results: SearchResult[] = [];

    // Add abstract as first result if available
    if (data.Abstract && data.AbstractURL) {
      results.push({
        title: data.Heading || 'Result',
        link: data.AbstractURL,
        snippet: data.Abstract,
        position: 1,
      });
    }

    // Add related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics) {
        if (results.length >= maxResults) break;

        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            link: topic.FirstURL,
            snippet: topic.Text,
            position: results.length + 1,
          });
        }
      }
    }

    // Add regular results
    if (data.Results) {
      for (const result of data.Results) {
        if (results.length >= maxResults) break;

        if (result.Text && result.FirstURL) {
          results.push({
            title: result.Text.split(' - ')[0] || result.Text,
            link: result.FirstURL,
            snippet: result.Text,
            position: results.length + 1,
          });
        }
      }
    }

    return results.slice(0, maxResults);
  }
}

/**
 * Create a new DuckDuckGo provider instance
 */
export function createDuckDuckGoProvider(): DuckDuckGoProvider {
  return new DuckDuckGoProvider();
}

