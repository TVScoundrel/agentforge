/**
 * Basic Streaming Example
 * 
 * Demonstrates basic stream transformers and aggregators:
 * - Chunking streams into fixed sizes
 * - Batching items by size or time
 * - Throttling stream processing
 * - Collecting and reducing streams
 */

import { chunk, batch, throttle, collect, reduce, filter, map, take } from '../../src/streaming';

// Helper to create an async iterable from an array
async function* createStream<T>(items: T[], delayMs = 100): AsyncIterable<T> {
  for (const item of items) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    yield item;
  }
}

// Example 1: Chunking - Split stream into fixed-size chunks
async function chunkingExample() {
  console.log('\n=== Chunking Example ===');
  console.log('Splitting stream of 10 numbers into chunks of 3...\n');

  const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
  const stream = createStream(numbers, 50);
  const chunked = chunk(stream, 3);

  for await (const chunkData of chunked) {
    console.log('Chunk:', chunkData);
  }
}

// Example 2: Batching - Batch items by size or time
async function batchingExample() {
  console.log('\n=== Batching Example ===');
  console.log('Batching stream with max size 4 and 500ms timeout...\n');

  const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
  const stream = createStream(numbers, 100);
  const batched = batch(stream, { maxSize: 4, maxWaitMs: 500 });

  for await (const batchData of batched) {
    console.log('Batch:', batchData);
  }
}

// Example 3: Throttling - Rate-limit stream processing
async function throttlingExample() {
  console.log('\n=== Throttling Example ===');
  console.log('Throttling stream to 2 items per second...\n');

  const numbers = Array.from({ length: 6 }, (_, i) => i + 1);
  const stream = createStream(numbers, 50);
  const throttled = throttle(stream, { rate: 2, per: 1000 });

  const startTime = Date.now();
  for await (const item of throttled) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${elapsed}s] Item:`, item);
  }
}

// Example 4: Collecting - Collect all items into an array
async function collectingExample() {
  console.log('\n=== Collecting Example ===');
  console.log('Collecting all items from stream...\n');

  const numbers = Array.from({ length: 5 }, (_, i) => i + 1);
  const stream = createStream(numbers, 50);
  const collected = await collect(stream);

  console.log('Collected:', collected);
}

// Example 5: Reducing - Reduce stream to a single value
async function reducingExample() {
  console.log('\n=== Reducing Example ===');
  console.log('Summing all numbers in stream...\n');

  const numbers = Array.from({ length: 5 }, (_, i) => i + 1);
  const stream = createStream(numbers, 50);
  const sum = await reduce(stream, (acc, val) => acc + val, 0);

  console.log('Sum:', sum);
}

// Example 6: Filtering - Filter stream items
async function filteringExample() {
  console.log('\n=== Filtering Example ===');
  console.log('Filtering even numbers from stream...\n');

  const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
  const stream = createStream(numbers, 50);
  const filtered = filter(stream, (n) => n % 2 === 0);

  for await (const item of filtered) {
    console.log('Even number:', item);
  }
}

// Example 7: Mapping - Transform stream items
async function mappingExample() {
  console.log('\n=== Mapping Example ===');
  console.log('Squaring numbers in stream...\n');

  const numbers = Array.from({ length: 5 }, (_, i) => i + 1);
  const stream = createStream(numbers, 50);
  const mapped = map(stream, (n) => n * n);

  for await (const item of mapped) {
    console.log('Squared:', item);
  }
}

// Example 8: Taking - Take first N items
async function takingExample() {
  console.log('\n=== Taking Example ===');
  console.log('Taking first 3 items from stream...\n');

  const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
  const stream = createStream(numbers, 50);
  const taken = take(stream, 3);

  for await (const item of taken) {
    console.log('Item:', item);
  }
}

// Example 9: Combining transformers
async function combiningExample() {
  console.log('\n=== Combining Transformers Example ===');
  console.log('Filter even numbers, square them, take first 3, and collect...\n');

  const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
  const stream = createStream(numbers, 50);
  
  const result = await collect(
    take(
      map(
        filter(stream, (n) => n % 2 === 0),
        (n) => n * n
      ),
      3
    )
  );

  console.log('Result:', result);
}

// Run all examples
async function main() {
  console.log('🌊 AgentForge Streaming Examples\n');
  
  await chunkingExample();
  await batchingExample();
  await throttlingExample();
  await collectingExample();
  await reducingExample();
  await filteringExample();
  await mappingExample();
  await takingExample();
  await combiningExample();
  
  console.log('\n✅ All examples completed!\n');
}

main().catch(console.error);

