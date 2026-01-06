/**
 * Stream aggregators for LangGraph applications
 * @module streaming/aggregators
 */

import type { ReducerFunction } from './types.js';

/**
 * Collect all items from a stream into an array
 *
 * @example
 * ```typescript
 * const items = await collect(stream);
 * console.log(items); // Array of all items
 * ```
 */
export async function collect<T>(stream: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];

  for await (const item of stream) {
    items.push(item);
  }

  return items;
}

/**
 * Reduce a stream to a single value
 *
 * @example
 * ```typescript
 * const sum = await reduce(stream, (acc, val) => acc + val, 0);
 * console.log(sum); // Sum of all values
 * ```
 */
export async function reduce<T, R>(
  stream: AsyncIterable<T>,
  reducer: ReducerFunction<T, R>,
  initialValue: R
): Promise<R> {
  let accumulator = initialValue;

  for await (const item of stream) {
    accumulator = reducer(accumulator, item);
  }

  return accumulator;
}

/**
 * Merge multiple streams into a single stream
 *
 * Items are emitted as they arrive from any stream.
 *
 * @example
 * ```typescript
 * const merged = merge([stream1, stream2, stream3]);
 * for await (const item of merged) {
 *   console.log(item); // Items from any stream
 * }
 * ```
 */
export async function* merge<T>(streams: AsyncIterable<T>[]): AsyncIterable<T> {
  if (streams.length === 0) {
    return;
  }

  // Create iterators for all streams
  const iterators = streams.map((stream) => stream[Symbol.asyncIterator]());

  // Track active iterators
  const active = new Set(iterators);

  // Create promises for all iterators
  const promises = new Map<
    AsyncIterator<T>,
    Promise<{ iterator: AsyncIterator<T>; result: IteratorResult<T> }>
  >();

  const createPromise = (iterator: AsyncIterator<T>) => {
    return iterator.next().then((result) => ({ iterator, result }));
  };

  // Initialize promises
  for (const iterator of iterators) {
    promises.set(iterator, createPromise(iterator));
  }

  // Process items as they arrive
  while (active.size > 0) {
    // Wait for the first promise to resolve
    const { iterator, result } = await Promise.race(promises.values());

    if (result.done) {
      // Remove completed iterator
      active.delete(iterator);
      promises.delete(iterator);
    } else {
      // Yield the value
      yield result.value;

      // Create new promise for this iterator
      promises.set(iterator, createPromise(iterator));
    }
  }
}

/**
 * Filter stream items based on a predicate
 *
 * @example
 * ```typescript
 * const filtered = filter(stream, (item) => item.value > 10);
 * for await (const item of filtered) {
 *   console.log(item); // Only items with value > 10
 * }
 * ```
 */
export async function* filter<T>(
  stream: AsyncIterable<T>,
  predicate: (item: T) => boolean | Promise<boolean>
): AsyncIterable<T> {
  for await (const item of stream) {
    if (await predicate(item)) {
      yield item;
    }
  }
}

/**
 * Map stream items to new values
 *
 * @example
 * ```typescript
 * const mapped = map(stream, (item) => item.value * 2);
 * for await (const item of mapped) {
 *   console.log(item); // Transformed items
 * }
 * ```
 */
export async function* map<T, R>(
  stream: AsyncIterable<T>,
  mapper: (item: T) => R | Promise<R>
): AsyncIterable<R> {
  for await (const item of stream) {
    yield await mapper(item);
  }
}

/**
 * Take only the first N items from a stream
 *
 * @example
 * ```typescript
 * const first10 = take(stream, 10);
 * for await (const item of first10) {
 *   console.log(item); // Only first 10 items
 * }
 * ```
 */
export async function* take<T>(stream: AsyncIterable<T>, count: number): AsyncIterable<T> {
  if (count <= 0) {
    return;
  }

  let taken = 0;

  for await (const item of stream) {
    yield item;
    taken++;

    if (taken >= count) {
      break;
    }
  }
}

