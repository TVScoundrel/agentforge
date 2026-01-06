import { describe, it, expect } from 'vitest';
import { collect, reduce, merge, filter, map, take } from '../aggregators';

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

describe('Stream Aggregators', () => {
  describe('collect', () => {
    it('should collect all items from stream', async () => {
      const stream = createStream([1, 2, 3, 4, 5]);
      const result = await collect(stream);

      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle empty stream', async () => {
      const stream = createStream([]);
      const result = await collect(stream);

      expect(result).toEqual([]);
    });
  });

  describe('reduce', () => {
    it('should reduce stream to single value', async () => {
      const stream = createStream([1, 2, 3, 4, 5]);
      const result = await reduce(stream, (acc, val) => acc + val, 0);

      expect(result).toBe(15);
    });

    it('should work with complex reducers', async () => {
      const stream = createStream([1, 2, 3, 4, 5]);
      const result = await reduce(
        stream,
        (acc, val) => {
          acc.sum += val;
          acc.count += 1;
          return acc;
        },
        { sum: 0, count: 0 }
      );

      expect(result).toEqual({ sum: 15, count: 5 });
    });

    it('should handle empty stream', async () => {
      const stream = createStream<number>([]);
      const result = await reduce(stream, (acc, val) => acc + val, 10);

      expect(result).toBe(10);
    });
  });

  describe('merge', () => {
    it('should merge multiple streams', async () => {
      const stream1 = createStream([1, 2, 3]);
      const stream2 = createStream([4, 5, 6]);
      const stream3 = createStream([7, 8, 9]);

      const merged = merge([stream1, stream2, stream3]);
      const result = await collectStream(merged);

      // All items should be present (order may vary)
      expect(result.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should handle empty streams', async () => {
      const stream1 = createStream([]);
      const stream2 = createStream([1, 2]);
      const stream3 = createStream([]);

      const merged = merge([stream1, stream2, stream3]);
      const result = await collectStream(merged);

      expect(result).toEqual([1, 2]);
    });

    it('should handle no streams', async () => {
      const merged = merge([]);
      const result = await collectStream(merged);

      expect(result).toEqual([]);
    });
  });

  describe('filter', () => {
    it('should filter stream items', async () => {
      const stream = createStream([1, 2, 3, 4, 5, 6]);
      const filtered = filter(stream, (item) => item % 2 === 0);
      const result = await collectStream(filtered);

      expect(result).toEqual([2, 4, 6]);
    });

    it('should handle async predicates', async () => {
      const stream = createStream([1, 2, 3, 4, 5]);
      const filtered = filter(stream, async (item) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return item > 3;
      });
      const result = await collectStream(filtered);

      expect(result).toEqual([4, 5]);
    });

    it('should handle empty stream', async () => {
      const stream = createStream([]);
      const filtered = filter(stream, (item) => true);
      const result = await collectStream(filtered);

      expect(result).toEqual([]);
    });
  });

  describe('map', () => {
    it('should map stream items', async () => {
      const stream = createStream([1, 2, 3, 4, 5]);
      const mapped = map(stream, (item) => item * 2);
      const result = await collectStream(mapped);

      expect(result).toEqual([2, 4, 6, 8, 10]);
    });

    it('should handle async mappers', async () => {
      const stream = createStream([1, 2, 3]);
      const mapped = map(stream, async (item) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return item.toString();
      });
      const result = await collectStream(mapped);

      expect(result).toEqual(['1', '2', '3']);
    });

    it('should handle empty stream', async () => {
      const stream = createStream([]);
      const mapped = map(stream, (item) => item);
      const result = await collectStream(mapped);

      expect(result).toEqual([]);
    });
  });

  describe('take', () => {
    it('should take first N items', async () => {
      const stream = createStream([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const taken = take(stream, 5);
      const result = await collectStream(taken);

      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle count larger than stream', async () => {
      const stream = createStream([1, 2, 3]);
      const taken = take(stream, 10);
      const result = await collectStream(taken);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle zero count', async () => {
      const stream = createStream([1, 2, 3]);
      const taken = take(stream, 0);
      const result = await collectStream(taken);

      expect(result).toEqual([]);
    });
  });
});

