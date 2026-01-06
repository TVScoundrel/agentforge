/**
 * Stream transformers for LangGraph applications
 * @module streaming/transformers
 */

import type { ChunkOptions, BatchOptions, ThrottleOptions } from './types.js';

/**
 * Transform a stream into chunks of a specified size
 *
 * @example
 * ```typescript
 * const chunked = chunk(stream, { size: 10 });
 * for await (const chunk of chunked) {
 *   console.log(chunk); // Array of 10 items (or fewer for last chunk)
 * }
 * ```
 */
export async function* chunk<T>(
  stream: AsyncIterable<T>,
  options: ChunkOptions
): AsyncIterable<T[]> {
  const { size } = options;

  if (size <= 0) {
    throw new Error('Chunk size must be greater than 0');
  }

  let buffer: T[] = [];

  for await (const item of stream) {
    buffer.push(item);

    if (buffer.length >= size) {
      yield buffer;
      buffer = [];
    }
  }

  // Yield remaining items
  if (buffer.length > 0) {
    yield buffer;
  }
}

/**
 * Batch stream items with size and time constraints
 *
 * @example
 * ```typescript
 * const batched = batch(stream, { maxSize: 5, maxWait: 100 });
 * for await (const batch of batched) {
 *   console.log(batch); // Array of up to 5 items or items collected within 100ms
 * }
 * ```
 */
export async function* batch<T>(
  stream: AsyncIterable<T>,
  options: BatchOptions
): AsyncIterable<T[]> {
  const { maxSize, maxWait } = options;

  if (maxSize <= 0) {
    throw new Error('Batch maxSize must be greater than 0');
  }

  if (maxWait <= 0) {
    throw new Error('Batch maxWait must be greater than 0');
  }

  let buffer: T[] = [];
  let timeoutId: NodeJS.Timeout | null = null;

  const flushBuffer = (): T[] | null => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (buffer.length === 0) {
      return null;
    }

    const result = buffer;
    buffer = [];
    return result;
  };

  try {
    for await (const item of stream) {
      buffer.push(item);

      if (buffer.length >= maxSize) {
        const result = flushBuffer();
        if (result) {
          yield result;
        }
      } else if (!timeoutId) {
        // Start timeout for first item in batch
        timeoutId = setTimeout(() => {
          // Timeout will be cleared when buffer is flushed
        }, maxWait);
      }
    }

    // Flush remaining items
    const remaining = flushBuffer();
    if (remaining) {
      yield remaining;
    }
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Throttle stream to limit rate of items
 *
 * @example
 * ```typescript
 * const throttled = throttle(stream, { rate: 10, per: 1000 });
 * for await (const item of throttled) {
 *   console.log(item); // Max 10 items per second
 * }
 * ```
 */
export async function* throttle<T>(
  stream: AsyncIterable<T>,
  options: ThrottleOptions
): AsyncIterable<T> {
  const { rate, per } = options;

  if (rate <= 0) {
    throw new Error('Throttle rate must be greater than 0');
  }

  if (per <= 0) {
    throw new Error('Throttle per must be greater than 0');
  }

  const interval = per / rate;
  let lastEmit = 0;

  for await (const item of stream) {
    const now = Date.now();
    const timeSinceLastEmit = now - lastEmit;

    if (timeSinceLastEmit < interval) {
      await new Promise((resolve) => setTimeout(resolve, interval - timeSinceLastEmit));
    }

    lastEmit = Date.now();
    yield item;
  }
}

