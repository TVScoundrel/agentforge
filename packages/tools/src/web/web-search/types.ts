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
  search(query: string, maxResults: number): Promise<SearchResult[]>;
  isAvailable(): boolean;
}

