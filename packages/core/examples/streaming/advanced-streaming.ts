/**
 * Advanced Streaming Example
 * 
 * Demonstrates complex streaming patterns:
 * - Combining multiple transformers
 * - Stream merging and filtering
 * - Error recovery
 * - Backpressure handling
 */

import { 
  chunk, batch, throttle, collect, reduce, filter, map, take, merge 
} from '../../src/streaming';

// Helper to create an async iterable from an array
async function* createStream<T>(items: T[], delayMs = 100): AsyncIterable<T> {
  for (const item of items) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    yield item;
  }
}

// Example 1: Complex transformation pipeline
async function transformationPipelineExample() {
  console.log('\n=== Transformation Pipeline Example ===');
  console.log('Building a complex data processing pipeline...\n');

  const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
  const stream = createStream(numbers, 50);

  // Pipeline: filter odds -> square -> chunk by 3 -> collect
  const result = await collect(
    chunk(
      map(
        filter(stream, n => n % 2 === 1),
        n => n * n
      ),
      3
    )
  );

  console.log('Pipeline result:', result);
  console.log('Explanation: Filtered odd numbers, squared them, chunked into groups of 3\n');
}

// Example 2: Merging multiple streams
async function mergingStreamsExample() {
  console.log('\n=== Merging Streams Example ===');
  console.log('Merging data from multiple sources...\n');

  const stream1 = createStream(['A1', 'A2', 'A3'], 100);
  const stream2 = createStream(['B1', 'B2', 'B3'], 150);
  const stream3 = createStream(['C1', 'C2', 'C3'], 80);

  const merged = merge([stream1, stream2, stream3]);

  console.log('Merged items:');
  for await (const item of merged) {
    console.log('  -', item);
  }
  console.log();
}

// Example 3: Error recovery in streams
async function errorRecoveryExample() {
  console.log('\n=== Error Recovery Example ===');
  console.log('Handling errors gracefully in stream processing...\n');

  async function* errorProneStream(): AsyncIterable<number> {
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      if (i === 5) {
        throw new Error('Simulated error at item 5');
      }
      yield i;
    }
  }

  try {
    const result = await collect(errorProneStream());
    console.log('Result:', result);
  } catch (error) {
    console.log('Error caught:', (error as Error).message);
    console.log('Implementing retry logic...\n');

    // Retry with error handling
    async function* safeStream(): AsyncIterable<number> {
      for (let i = 1; i <= 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        try {
          if (i === 5) {
            throw new Error('Simulated error');
          }
          yield i;
        } catch (err) {
          console.log(`  ⚠️  Error at item ${i}, skipping...`);
          // Continue with next item
        }
      }
    }

    const safeResult = await collect(safeStream());
    console.log('Safe result:', safeResult);
  }
  console.log();
}

// Example 4: Backpressure handling
async function backpressureExample() {
  console.log('\n=== Backpressure Handling Example ===');
  console.log('Managing fast producer with slow consumer...\n');

  // Fast producer
  async function* fastProducer(): AsyncIterable<number> {
    console.log('Producer: Starting fast production...');
    for (let i = 1; i <= 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 10)); // Fast
      console.log(`  Produced: ${i}`);
      yield i;
    }
  }

  // Use batching to handle backpressure
  const stream = fastProducer();
  const batched = batch(stream, { maxSize: 5, maxWaitMs: 200 });

  console.log('\nConsumer: Processing in batches...');
  for await (const batchData of batched) {
    console.log(`  Processing batch of ${batchData.length} items:`, batchData);
    // Simulate slow processing
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  console.log();
}

// Example 5: Real-time data aggregation
async function realTimeAggregationExample() {
  console.log('\n=== Real-time Aggregation Example ===');
  console.log('Aggregating streaming metrics in real-time...\n');

  interface Metric {
    timestamp: number;
    value: number;
    type: 'cpu' | 'memory' | 'network';
  }

  async function* metricsStream(): AsyncIterable<Metric> {
    const types: Array<'cpu' | 'memory' | 'network'> = ['cpu', 'memory', 'network'];
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      yield {
        timestamp: Date.now(),
        value: Math.random() * 100,
        type: types[i % 3]
      };
    }
  }

  const stream = metricsStream();
  
  // Group by type and calculate averages
  const cpuMetrics: number[] = [];
  const memoryMetrics: number[] = [];
  const networkMetrics: number[] = [];

  for await (const metric of stream) {
    if (metric.type === 'cpu') cpuMetrics.push(metric.value);
    else if (metric.type === 'memory') memoryMetrics.push(metric.value);
    else networkMetrics.push(metric.value);

    console.log(`${metric.type.toUpperCase()}: ${metric.value.toFixed(2)}`);
  }

  console.log('\nAggregated Results:');
  console.log(`  CPU avg: ${(cpuMetrics.reduce((a, b) => a + b, 0) / cpuMetrics.length).toFixed(2)}`);
  console.log(`  Memory avg: ${(memoryMetrics.reduce((a, b) => a + b, 0) / memoryMetrics.length).toFixed(2)}`);
  console.log(`  Network avg: ${(networkMetrics.reduce((a, b) => a + b, 0) / networkMetrics.length).toFixed(2)}`);
  console.log();
}

// Example 6: Stream rate limiting with throttle
async function rateLimitingExample() {
  console.log('\n=== Rate Limiting Example ===');
  console.log('Limiting API calls to 3 per second...\n');

  async function* apiCallStream(): AsyncIterable<string> {
    const endpoints = [
      '/api/users', '/api/posts', '/api/comments',
      '/api/likes', '/api/shares', '/api/notifications',
      '/api/messages', '/api/settings', '/api/profile'
    ];
    
    for (const endpoint of endpoints) {
      yield endpoint;
    }
  }

  const stream = apiCallStream();
  const throttled = throttle(stream, { rate: 3, per: 1000 });

  const startTime = Date.now();
  for await (const endpoint of throttled) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${elapsed}s] Calling ${endpoint}`);
  }
  console.log();
}

// Example 7: Windowed aggregation
async function windowedAggregationExample() {
  console.log('\n=== Windowed Aggregation Example ===');
  console.log('Computing rolling averages over time windows...\n');

  const values = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));
  const stream = createStream(values, 50);
  const chunked = chunk(stream, 5); // 5-item windows

  let windowNum = 1;
  for await (const window of chunked) {
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    console.log(`Window ${windowNum}: [${window.join(', ')}] -> Avg: ${avg.toFixed(2)}`);
    windowNum++;
  }
  console.log();
}

// Run all examples
async function main() {
  console.log('🚀 AgentForge Advanced Streaming Examples\n');
  
  await transformationPipelineExample();
  await mergingStreamsExample();
  await errorRecoveryExample();
  await backpressureExample();
  await realTimeAggregationExample();
  await rateLimitingExample();
  await windowedAggregationExample();
  
  console.log('✅ All advanced streaming examples completed!\n');
}

main().catch(console.error);

