/**
 * Tests for Shared Deduplication Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateToolCallCacheKey,
  calculateDeduplicationSavings,
  buildDeduplicationMetrics,
} from '../../src/shared/deduplication.js';

describe('Deduplication Utilities', () => {
  describe('generateToolCallCacheKey', () => {
    it('should generate consistent keys for same arguments in different order', () => {
      const key1 = generateToolCallCacheKey('search', { query: 'test', limit: 10 });
      const key2 = generateToolCallCacheKey('search', { limit: 10, query: 'test' });

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different tool names', () => {
      const key1 = generateToolCallCacheKey('search', { query: 'test' });
      const key2 = generateToolCallCacheKey('fetch', { query: 'test' });

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different arguments', () => {
      const key1 = generateToolCallCacheKey('search', { query: 'test1' });
      const key2 = generateToolCallCacheKey('search', { query: 'test2' });

      expect(key1).not.toBe(key2);
    });

    it('should handle nested objects with different key order', () => {
      const key1 = generateToolCallCacheKey('search', {
        filters: { type: 'article', status: 'published' },
        query: 'test',
      });
      const key2 = generateToolCallCacheKey('search', {
        query: 'test',
        filters: { status: 'published', type: 'article' },
      });

      expect(key1).toBe(key2);
    });

    it('should handle deeply nested objects', () => {
      const key1 = generateToolCallCacheKey('search', {
        filters: {
          metadata: { author: 'John', date: '2024-01-01' },
          type: 'article',
        },
        query: 'test',
      });
      const key2 = generateToolCallCacheKey('search', {
        query: 'test',
        filters: {
          type: 'article',
          metadata: { date: '2024-01-01', author: 'John' },
        },
      });

      expect(key1).toBe(key2);
    });

    it('should handle arrays correctly', () => {
      const key1 = generateToolCallCacheKey('search', {
        tags: ['tag1', 'tag2'],
        query: 'test',
      });
      const key2 = generateToolCallCacheKey('search', {
        query: 'test',
        tags: ['tag1', 'tag2'],
      });

      expect(key1).toBe(key2);
    });

    it('should distinguish between different array orders', () => {
      const key1 = generateToolCallCacheKey('search', {
        tags: ['tag1', 'tag2'],
      });
      const key2 = generateToolCallCacheKey('search', {
        tags: ['tag2', 'tag1'],
      });

      // Arrays with different order should produce different keys
      expect(key1).not.toBe(key2);
    });

    it('should handle null and undefined values', () => {
      const key1 = generateToolCallCacheKey('search', {
        query: 'test',
        filter: null,
      });
      const key2 = generateToolCallCacheKey('search', {
        filter: null,
        query: 'test',
      });

      expect(key1).toBe(key2);
    });

    it('should handle empty objects', () => {
      const key1 = generateToolCallCacheKey('search', {});
      const key2 = generateToolCallCacheKey('search', {});

      expect(key1).toBe(key2);
    });

    it('should handle complex nested structures', () => {
      const key1 = generateToolCallCacheKey('search', {
        filters: {
          categories: ['tech', 'science'],
          metadata: {
            author: { name: 'John', id: 123 },
            tags: ['ai', 'ml'],
          },
        },
        query: 'test',
        options: { limit: 10, offset: 0 },
      });
      const key2 = generateToolCallCacheKey('search', {
        options: { offset: 0, limit: 10 },
        query: 'test',
        filters: {
          metadata: {
            tags: ['ai', 'ml'],
            author: { id: 123, name: 'John' },
          },
          categories: ['tech', 'science'],
        },
      });

      expect(key1).toBe(key2);
    });
  });

  describe('calculateDeduplicationSavings', () => {
    it('should calculate savings correctly', () => {
      expect(calculateDeduplicationSavings(3, 1)).toBe('75%');
      expect(calculateDeduplicationSavings(1, 1)).toBe('50%');
      expect(calculateDeduplicationSavings(0, 1)).toBe('0%');
    });
  });

  describe('buildDeduplicationMetrics', () => {
    it('should build metrics with correct savings', () => {
      const metrics = buildDeduplicationMetrics(1, 3, 4);
      expect(metrics.toolsExecuted).toBe(1);
      expect(metrics.duplicatesSkipped).toBe(3);
      expect(metrics.totalObservations).toBe(4);
      expect(metrics.deduplicationSavings).toBe('75%');
    });
  });
});

