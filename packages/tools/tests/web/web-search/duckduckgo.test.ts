/**
 * DuckDuckGo Provider Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { DuckDuckGoProvider } from '../../../src/web/web-search/providers/duckduckgo.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('DuckDuckGo Provider', () => {
  let provider: DuckDuckGoProvider;

  beforeEach(() => {
    provider = new DuckDuckGoProvider();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isAvailable()', () => {
    it('should always return true (no API key required)', () => {
      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('search()', () => {
    it('should return search results with abstract', async () => {
      const mockResponse = {
        data: {
          Abstract: 'TypeScript is a strongly typed programming language',
          AbstractURL: 'https://www.typescriptlang.org/',
          Heading: 'TypeScript',
          RelatedTopics: [],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const results = await provider.search('TypeScript', 10);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        title: 'TypeScript',
        link: 'https://www.typescriptlang.org/',
        snippet: 'TypeScript is a strongly typed programming language',
        position: 1,
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.duckduckgo.com/',
        expect.objectContaining({
          params: {
            q: 'TypeScript',
            format: 'json',
          },
        })
      );
    });

    it('should return search results from RelatedTopics', async () => {
      const mockResponse = {
        data: {
          Abstract: '',
          RelatedTopics: [
            {
              Text: 'JavaScript - A programming language',
              FirstURL: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
            },
            {
              Text: 'Python - Another programming language',
              FirstURL: 'https://www.python.org/',
            },
          ],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const results = await provider.search('programming languages', 10);

      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('JavaScript');
      expect(results[0].link).toBe('https://developer.mozilla.org/en-US/docs/Web/JavaScript');
      expect(results[1].title).toBe('Python');
    });

    it('should respect maxResults parameter', async () => {
      const mockResponse = {
        data: {
          Abstract: 'First result',
          AbstractURL: 'https://example.com/1',
          Heading: 'Result 1',
          RelatedTopics: [
            { Text: 'Second result', FirstURL: 'https://example.com/2' },
            { Text: 'Third result', FirstURL: 'https://example.com/3' },
            { Text: 'Fourth result', FirstURL: 'https://example.com/4' },
          ],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const results = await provider.search('test query', 2);

      expect(results).toHaveLength(2);
    });

    it('should return empty array when no results', async () => {
      const mockResponse = {
        data: {
          Abstract: '',
          RelatedTopics: [],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const results = await provider.search('nonexistent query', 10);

      expect(results).toEqual([]);
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.search('test', 10)).rejects.toThrow(
        'DuckDuckGo search failed: Network error'
      );
    });

    it('should include User-Agent header', async () => {
      const mockResponse = {
        data: {
          Abstract: '',
          RelatedTopics: [],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await provider.search('test', 10);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.duckduckgo.com/',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('AgentForge'),
          }),
        })
      );
    });

    it('should return search results from Results array', async () => {
      const mockResponse = {
        data: {
          Abstract: '',
          RelatedTopics: [],
          Results: [
            {
              Text: 'TypeScript Documentation - Official Docs',
              FirstURL: 'https://www.typescriptlang.org/docs/',
            },
            {
              Text: 'TypeScript Handbook - Learn TypeScript',
              FirstURL: 'https://www.typescriptlang.org/docs/handbook/',
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const results = await provider.search('TypeScript docs', 10);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        title: 'TypeScript Documentation',
        link: 'https://www.typescriptlang.org/docs/',
        snippet: 'TypeScript Documentation - Official Docs',
        position: 1,
      });
      expect(results[1]).toEqual({
        title: 'TypeScript Handbook',
        link: 'https://www.typescriptlang.org/docs/handbook/',
        snippet: 'TypeScript Handbook - Learn TypeScript',
        position: 2,
      });
    });

    it('should combine Abstract, RelatedTopics, and Results', async () => {
      const mockResponse = {
        data: {
          Abstract: 'TypeScript is a typed superset of JavaScript',
          AbstractURL: 'https://www.typescriptlang.org/',
          Heading: 'TypeScript',
          RelatedTopics: [
            {
              Text: 'JavaScript - The base language',
              FirstURL: 'https://developer.mozilla.org/JavaScript',
            },
          ],
          Results: [
            {
              Text: 'TypeScript Tutorial - Learn TS',
              FirstURL: 'https://www.typescriptlang.org/tutorial',
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const results = await provider.search('TypeScript', 10);

      expect(results).toHaveLength(3);
      expect(results[0].title).toBe('TypeScript');
      expect(results[1].title).toBe('JavaScript');
      expect(results[2].title).toBe('TypeScript Tutorial');
    });

    it('should use fallback title when Heading is missing', async () => {
      const mockResponse = {
        data: {
          Abstract: 'Some abstract text',
          AbstractURL: 'https://example.com',
          Heading: '', // Empty heading
          RelatedTopics: [],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const results = await provider.search('test', 10);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Result'); // Fallback title
    });

    it('should handle topic text without separator', async () => {
      const mockResponse = {
        data: {
          Abstract: '',
          RelatedTopics: [
            {
              Text: 'Simple topic without separator',
              FirstURL: 'https://example.com',
            },
          ],
          Results: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const results = await provider.search('test', 10);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Simple topic without separator');
    });
  });
});

