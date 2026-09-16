/**
 * Serper Provider Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { SerperProvider } from '../../../src/web/web-search/providers/serper.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Serper Provider', () => {
  let provider: SerperProvider;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('isAvailable()', () => {
    it('should return true when API key is set', () => {
      process.env.SERPER_API_KEY = 'test-api-key';
      provider = new SerperProvider();
      expect(provider.isAvailable()).toBe(true);
    });

    it('should return false when API key is not set', () => {
      delete process.env.SERPER_API_KEY;
      provider = new SerperProvider();
      expect(provider.isAvailable()).toBe(false);
    });
  });

  describe('search()', () => {
    beforeEach(() => {
      process.env.SERPER_API_KEY = 'test-api-key';
      provider = new SerperProvider();
    });

    it('should return search results from Serper API', async () => {
      const mockResponse = {
        data: {
          organic: [
            {
              title: 'TypeScript Documentation',
              link: 'https://www.typescriptlang.org/docs/',
              snippet: 'Official TypeScript documentation and guides',
              position: 1,
            },
            {
              title: 'TypeScript GitHub',
              link: 'https://github.com/microsoft/TypeScript',
              snippet: 'TypeScript is a superset of JavaScript',
              position: 2,
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const results = await provider.search('TypeScript', 10);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        title: 'TypeScript Documentation',
        link: 'https://www.typescriptlang.org/docs/',
        snippet: 'Official TypeScript documentation and guides',
        position: 1,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://google.serper.dev/search',
        {
          q: 'TypeScript',
          num: 10,
        },
        expect.objectContaining({
          headers: {
            'X-API-KEY': 'test-api-key',
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should respect maxResults parameter', async () => {
      const mockResponse = {
        data: {
          organic: [
            { title: 'Result 1', link: 'https://example.com/1', snippet: 'Snippet 1' },
            { title: 'Result 2', link: 'https://example.com/2', snippet: 'Snippet 2' },
            { title: 'Result 3', link: 'https://example.com/3', snippet: 'Snippet 3' },
          ],
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const results = await provider.search('test', 2);

      expect(results).toHaveLength(2);
    });

    it('should return empty array when no results', async () => {
      const mockResponse = {
        data: {
          organic: [],
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const results = await provider.search('nonexistent', 10);

      expect(results).toEqual([]);
    });

    it('should filter out results missing required fields', async () => {
      const mockResponse = {
        data: {
          organic: [
            { title: 'Valid Result', link: 'https://example.com', snippet: 'Valid snippet' },
            { title: 'Missing link', snippet: 'Has snippet' }, // Missing link
            { link: 'https://example.com/2', snippet: 'Missing title' }, // Missing title
            { title: 'Missing snippet', link: 'https://example.com/3' }, // Missing snippet
          ],
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const results = await provider.search('test', 10);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Valid Result');
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.SERPER_API_KEY;
      provider = new SerperProvider();

      await expect(provider.search('test', 10)).rejects.toThrow('Serper API key not found');
    });

    it('should handle 401 authentication errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 401 },
        message: 'Unauthorized',
      });

      await expect(provider.search('test', 10)).rejects.toThrow('Invalid Serper API key');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should retain the Serper rate limit error after exhausting retries', async () => {
      vi.useFakeTimers();
      mockedAxios.post.mockRejectedValue({
        response: { status: 429 },
        message: 'Too Many Requests',
      });

      const result = expect(provider.search('test', 10)).rejects.toThrow(
        'Serper API rate limit exceeded'
      );
      await vi.runAllTimersAsync();

      await result;
      expect(mockedAxios.post).toHaveBeenCalledTimes(4);
    });

    it('should retain the Serper search error after exhausting timeout retries', async () => {
      vi.useFakeTimers();
      mockedAxios.post.mockRejectedValue(new Error('Network timeout'));

      const result = expect(provider.search('test', 10)).rejects.toThrow(
        'Serper search failed: Network timeout'
      );
      await vi.runAllTimersAsync();

      await result;
      expect(mockedAxios.post).toHaveBeenCalledTimes(4);
    });

    it('should retry a connection failure and return normalized results from a later attempt', async () => {
      vi.useFakeTimers();
      mockedAxios.post
        .mockRejectedValueOnce(Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }))
        .mockResolvedValueOnce({
          data: {
            organic: [
              {
                title: 'Recovered',
                link: 'https://example.com/recovered',
                snippet: 'Recovered result',
                position: 1,
              },
            ],
          },
        });

      const search = provider.search('test', 10);
      const result = expect(search).resolves.toEqual([
        {
          title: 'Recovered',
          link: 'https://example.com/recovered',
          snippet: 'Recovered result',
          position: 1,
        },
      ]);
      await vi.runAllTimersAsync();

      await result;
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });
});
