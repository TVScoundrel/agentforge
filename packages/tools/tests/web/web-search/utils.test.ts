/**
 * Web Search Utility Functions Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSerperApiKey, isSerperAvailable, measureTime } from '../../../src/web/web-search/utils.js';

describe('Web Search Utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getSerperApiKey()', () => {
    it('should return API key when SERPER_API_KEY is set', () => {
      process.env.SERPER_API_KEY = 'test-api-key-123';
      expect(getSerperApiKey()).toBe('test-api-key-123');
    });

    it('should return undefined when SERPER_API_KEY is not set', () => {
      delete process.env.SERPER_API_KEY;
      expect(getSerperApiKey()).toBeUndefined();
    });

    it('should return empty string when SERPER_API_KEY is empty', () => {
      process.env.SERPER_API_KEY = '';
      expect(getSerperApiKey()).toBe('');
    });
  });

  describe('isSerperAvailable()', () => {
    it('should return true when API key is set', () => {
      process.env.SERPER_API_KEY = 'test-api-key';
      expect(isSerperAvailable()).toBe(true);
    });

    it('should return false when API key is not set', () => {
      delete process.env.SERPER_API_KEY;
      expect(isSerperAvailable()).toBe(false);
    });

    it('should return false when API key is empty string', () => {
      process.env.SERPER_API_KEY = '';
      expect(isSerperAvailable()).toBe(false);
    });
  });

  describe('measureTime()', () => {
    it('should measure execution time of async function', async () => {
      const testFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'test result';
      };

      const { result, duration } = await measureTime(testFn);

      expect(result).toBe('test result');
      expect(duration).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(200); // Allow some margin
    });

    it('should measure time for fast functions', async () => {
      const testFn = async () => {
        return 42;
      };

      const { result, duration } = await measureTime(testFn);

      expect(result).toBe(42);
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(50);
    });

    it('should propagate errors from the function', async () => {
      const testFn = async () => {
        throw new Error('Test error');
      };

      await expect(measureTime(testFn)).rejects.toThrow('Test error');
    });

    it('should handle functions that return objects', async () => {
      const testFn = async () => {
        return { foo: 'bar', baz: 123 };
      };

      const { result, duration } = await measureTime(testFn);

      expect(result).toEqual({ foo: 'bar', baz: 123 });
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });
});

