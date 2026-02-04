/**
 * Web Search Tool Integration Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { webSearch } from '../../../src/web/web-search/index.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Web Search Tool', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Tool Metadata', () => {
    it('should have correct name', () => {
      expect(webSearch.metadata.name).toBe('web-search');
    });

    it('should have description', () => {
      expect(webSearch.metadata.description).toBeDefined();
      expect(webSearch.metadata.description).toContain('Search the web');
    });

    it('should have correct category', () => {
      expect(webSearch.metadata.category).toBe('web');
    });

    it('should have appropriate tags', () => {
      expect(webSearch.metadata.tags).toContain('search');
      expect(webSearch.metadata.tags).toContain('web');
      expect(webSearch.metadata.tags).toContain('duckduckgo');
      expect(webSearch.metadata.tags).toContain('serper');
    });
  });

  describe('DuckDuckGo (Default)', () => {
    beforeEach(() => {
      delete process.env.SERPER_API_KEY;
    });

    it('should search using DuckDuckGo when no API key', async () => {
      const mockResponse = {
        data: {
          Abstract: 'Test result',
          AbstractURL: 'https://example.com',
          Heading: 'Test',
          RelatedTopics: [],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await webSearch.invoke({
        query: 'test query',
        maxResults: 10,
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('duckduckgo');
      expect(result.results).toHaveLength(1);
      expect(result.metadata?.fallbackUsed).toBe(false);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.duckduckgo.com/',
        expect.any(Object)
      );
    });

    it('should track response time', async () => {
      const mockResponse = {
        data: {
          Abstract: 'Test',
          AbstractURL: 'https://example.com',
          Heading: 'Test',
          RelatedTopics: [],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await webSearch.invoke({
        query: 'test',
      });

      expect(result.metadata?.responseTime).toBeDefined();
      expect(typeof result.metadata?.responseTime).toBe('number');
      expect(result.metadata?.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty results', async () => {
      const mockResponse = {
        data: {
          Abstract: '',
          RelatedTopics: [],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await webSearch.invoke({
        query: 'nonexistent query',
      });

      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
      expect(result.totalResults).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await webSearch.invoke({
        query: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('Serper (Premium)', () => {
    beforeEach(() => {
      process.env.SERPER_API_KEY = 'test-api-key';
    });

    it('should use Serper when preferSerper=true', async () => {
      const mockResponse = {
        data: {
          organic: [
            {
              title: 'Test Result',
              link: 'https://example.com',
              snippet: 'Test snippet',
              position: 1,
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await webSearch.invoke({
        query: 'test query',
        preferSerper: true,
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('serper');
      expect(result.results).toHaveLength(1);
      expect(result.metadata?.fallbackUsed).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://google.serper.dev/search',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('Fallback Logic', () => {
    beforeEach(() => {
      process.env.SERPER_API_KEY = 'test-api-key';
    });

    it('should fallback to Serper when DuckDuckGo returns empty', async () => {
      // DuckDuckGo returns empty
      const duckduckgoResponse = {
        data: {
          Abstract: '',
          RelatedTopics: [],
          Results: [],
        },
      };

      // Serper returns results
      const serperResponse = {
        data: {
          organic: [
            {
              title: 'Fallback Result',
              link: 'https://example.com',
              snippet: 'Found via Serper',
              position: 1,
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(duckduckgoResponse);
      mockedAxios.post.mockResolvedValueOnce(serperResponse);

      const result = await webSearch.invoke({
        query: 'test query',
        preferSerper: false, // Prefer DuckDuckGo, but will fallback
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('serper');
      expect(result.results).toHaveLength(1);
      expect(result.metadata?.fallbackUsed).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalled(); // DuckDuckGo tried first
      expect(mockedAxios.post).toHaveBeenCalled(); // Serper used as fallback
    });

    it('should not fallback when DuckDuckGo has results', async () => {
      const duckduckgoResponse = {
        data: {
          Abstract: 'DuckDuckGo result',
          AbstractURL: 'https://example.com',
          Heading: 'Test',
          RelatedTopics: [],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(duckduckgoResponse);

      const result = await webSearch.invoke({
        query: 'test query',
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('duckduckgo');
      expect(result.metadata?.fallbackUsed).toBe(false);
      expect(mockedAxios.get).toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled(); // Serper not called
    });

    it('should not fallback when Serper API key is not available', async () => {
      delete process.env.SERPER_API_KEY;

      const duckduckgoResponse = {
        data: {
          Abstract: '',
          RelatedTopics: [],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(duckduckgoResponse);

      const result = await webSearch.invoke({
        query: 'test query',
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('duckduckgo');
      expect(result.results).toEqual([]);
      expect(result.metadata?.fallbackUsed).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    it('should sanitize query', async () => {
      const mockResponse = {
        data: {
          Abstract: 'Test',
          AbstractURL: 'https://example.com',
          Heading: 'Test',
          RelatedTopics: [],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await webSearch.invoke({
        query: '  test   query  ',
      });

      expect(result.query).toBe('test query');
    });

    it('should use default maxResults', async () => {
      const mockResponse = {
        data: {
          Abstract: '',
          RelatedTopics: [],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await webSearch.invoke({
        query: 'test',
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.duckduckgo.com/',
        expect.any(Object)
      );
    });
  });
});

