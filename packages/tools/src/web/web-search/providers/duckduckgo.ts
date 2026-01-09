/**
 * DuckDuckGo Search Provider
 * 
 * Free search provider using DuckDuckGo's Instant Answer API.
 * No API key required.
 */

import axios from 'axios';
import type { SearchProvider, SearchResult } from '../types.js';
import { retryWithBackoff, DEFAULT_TIMEOUT } from '../utils.js';

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
   * @param query - Search query
   * @param maxResults - Maximum number of results to return
   * @param timeout - Request timeout in milliseconds (default: 30000)
   */
  async search(
    query: string,
    maxResults: number,
    timeout: number = DEFAULT_TIMEOUT
  ): Promise<SearchResult[]> {
    return retryWithBackoff(async () => {
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
            timeout,
          }
        );

        return this.normalizeResults(response.data, maxResults);
      } catch (error: any) {
        throw new Error(`DuckDuckGo search failed: ${error.message}`);
      }
    });
  }

  /**
   * Normalize DuckDuckGo response to SearchResult[]
   * Optimized for performance with large result sets
   */
  private normalizeResults(
    data: DuckDuckGoResponse,
    maxResults: number
  ): SearchResult[] {
    const results: SearchResult[] = [];

    // Early return if maxResults is 0
    if (maxResults <= 0) {
      return results;
    }

    // Add abstract as first result if available
    if (data.Abstract && data.AbstractURL) {
      results.push({
        title: data.Heading || 'Result',
        link: data.AbstractURL,
        snippet: data.Abstract,
        position: 1,
      });

      // Early return if we've reached maxResults
      if (results.length >= maxResults) {
        return results;
      }
    }

    // Add related topics (optimized: only process what we need)
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const remaining = maxResults - results.length;
      const topicsToProcess = data.RelatedTopics.slice(0, remaining);

      for (const topic of topicsToProcess) {
        if (topic.Text && topic.FirstURL) {
          // Cache split result to avoid redundant operations
          const titleParts = topic.Text.split(' - ');
          results.push({
            title: titleParts[0] || topic.Text,
            link: topic.FirstURL,
            snippet: topic.Text,
            position: results.length + 1,
          });
        }
      }

      // Early return if we've reached maxResults
      if (results.length >= maxResults) {
        return results;
      }
    }

    // Add regular results (optimized: only process what we need)
    if (data.Results && data.Results.length > 0) {
      const remaining = maxResults - results.length;
      const resultsToProcess = data.Results.slice(0, remaining);

      for (const result of resultsToProcess) {
        if (result.Text && result.FirstURL) {
          // Cache split result to avoid redundant operations
          const titleParts = result.Text.split(' - ');
          results.push({
            title: titleParts[0] || result.Text,
            link: result.FirstURL,
            snippet: result.Text,
            position: results.length + 1,
          });
        }
      }
    }

    return results;
  }
}

/**
 * Create a new DuckDuckGo provider instance
 */
export function createDuckDuckGoProvider(): DuckDuckGoProvider {
  return new DuckDuckGoProvider();
}

