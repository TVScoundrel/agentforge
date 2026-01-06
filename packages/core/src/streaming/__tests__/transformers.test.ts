import { describe, it, expect, vi } from 'vitest';
import { chunk, batch, throttle } from '../transformers';

// Helper to create async iterable from array
async function* createStream<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) {
    yield item;
  }
}

// Helper to collect stream items
async function collectStream<T>(stream: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of stream) {
    items.push(item);
  }
  return items;
}

describe('Stream Transformers', () => {
  describe('chunk', () => {
    it('should chunk stream into arrays of specified size', async () => {
      const stream = createStream([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const chunked = chunk(stream, { size: 3 });
      const result = await collectStream(chunked);

      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    });

    it('should handle exact multiples', async () => {
      const stream = createStream([1, 2, 3, 4, 5, 6]);
      const chunked = chunk(stream, { size: 2 });
      const result = await collectStream(chunked);

      expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('should handle empty stream', async () => {
      const stream = createStream([]);
      const chunked = chunk(stream, { size: 3 });
      const result = await collectStream(chunked);

      expect(result).toEqual([]);
    });

    it('should throw error for invalid chunk size', async () => {
      const stream = createStream([1, 2, 3]);

      await expect(async () => {
        const chunked = chunk(stream, { size: 0 });
        await collectStream(chunked);
      }).rejects.toThrow('Chunk size must be greater than 0');
    });
  });

  describe('batch', () => {
    it('should batch by size', async () => {
      const stream = createStream([1, 2, 3, 4, 5]);
      const batched = batch(stream, { maxSize: 2, maxWait: 1000 });
      const result = await collectStream(batched);

      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should batch by time', async () => {
      const stream = createStream([1, 2, 3, 4, 5]);
      const batched = batch(stream, { maxSize: 10, maxWait: 100 });
      const result = await collectStream(batched);

      // With maxSize of 10, all items should be in one batch
      // (since stream completes before timeout)
      expect(result).toEqual([[1, 2, 3, 4, 5]]);
    });

    it('should handle empty stream', async () => {
      const stream = createStream([]);
      const batched = batch(stream, { maxSize: 3, maxWait: 100 });
      const result = await collectStream(batched);

      expect(result).toEqual([]);
    });

    it('should throw error for invalid maxSize', async () => {
      const stream = createStream([1, 2, 3]);

      await expect(async () => {
        const batched = batch(stream, { maxSize: 0, maxWait: 100 });
        await collectStream(batched);
      }).rejects.toThrow('Batch maxSize must be greater than 0');
    });

    it('should throw error for invalid maxWait', async () => {
      const stream = createStream([1, 2, 3]);

      await expect(async () => {
        const batched = batch(stream, { maxSize: 3, maxWait: 0 });
        await collectStream(batched);
      }).rejects.toThrow('Batch maxWait must be greater than 0');
    });
  });

  describe('throttle', () => {
    it('should throttle stream to specified rate', async () => {
      const stream = createStream([1, 2, 3, 4, 5]);
      const startTime = Date.now();

      const throttled = throttle(stream, { rate: 10, per: 1000 }); // 10 items per second
      const result = await collectStream(throttled);

      const elapsed = Date.now() - startTime;

      expect(result).toEqual([1, 2, 3, 4, 5]);
      // Should take at least 400ms for 5 items at 10/sec (100ms between items)
      expect(elapsed).toBeGreaterThanOrEqual(400);
    });

    it('should handle empty stream', async () => {
      const stream = createStream([]);
      const throttled = throttle(stream, { rate: 10, per: 1000 });
      const result = await collectStream(throttled);

      expect(result).toEqual([]);
    });

    it('should throw error for invalid rate', async () => {
      const stream = createStream([1, 2, 3]);

      await expect(async () => {
        const throttled = throttle(stream, { rate: 0, per: 1000 });
        await collectStream(throttled);
      }).rejects.toThrow('Throttle rate must be greater than 0');
    });

    it('should throw error for invalid per', async () => {
      const stream = createStream([1, 2, 3]);

      await expect(async () => {
        const throttled = throttle(stream, { rate: 10, per: 0 });
        await collectStream(throttled);
      }).rejects.toThrow('Throttle per must be greater than 0');
    });
  });
});

