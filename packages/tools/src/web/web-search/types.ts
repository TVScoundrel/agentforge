/**
 * Web Search Tool - Type Definitions
 */

/**
 * Individual search result
 */
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

/**
 * Web search input parameters
 */
export interface WebSearchInput {
  query: string;
  maxResults?: number;
  preferSerper?: boolean;
  timeout?: number; // Request timeout in milliseconds (default: 30000)
}

/**
 * Web search output
 */
export interface WebSearchOutput {
  success: boolean;
  source: 'duckduckgo' | 'serper';
  query: string;
  results: SearchResult[];
  totalResults?: number;
  error?: string;
  metadata?: {
    responseTime?: number;
    fallbackUsed?: boolean;
  };
}

/**
 * Search provider interface
 */
export interface SearchProvider {
  name: 'duckduckgo' | 'serper';
  search(query: string, maxResults: number, timeout?: number): Promise<SearchResult[]>;
  isAvailable(): boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

