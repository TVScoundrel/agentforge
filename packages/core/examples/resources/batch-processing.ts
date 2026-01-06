/**
 * Example: Batch Processing
 *
 * Demonstrates request batching with:
 * - Automatic batching
 * - Batch size optimization
 * - Timeout handling
 * - Error handling
 * - Batch statistics
 */

import { createBatchProcessor } from '../../src/resources/index.js';

// Simulated API for demonstration
const mockAPI = {
  async batchQuery(queries: string[]): Promise<any[]> {
    console.log(`  📦 Processing batch of ${queries.length} queries`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return queries.map((query) => ({ query, result: `Result for ${query}` }));
  },

  async batchFetch(urls: string[]): Promise<any[]> {
    console.log(`  📦 Fetching batch of ${urls.length} URLs`);
    await new Promise((resolve) => setTimeout(resolve, 200));
    return urls.map((url) => ({ url, content: `Content from ${url}` }));
  },
};

async function main() {
  console.log('=== Batch Processing Example ===\n');

  // Example 1: Basic batching
  console.log('1. Basic Batching:');
  const queryBatcher = createBatchProcessor({
    maxBatchSize: 5,
    maxWaitTime: 100,
    processor: async (batch) => {
      return mockAPI.batchQuery(batch);
    },
    onBatchComplete: (batch, results) => {
      console.log(`  ✓ Batch completed: ${batch.length} items processed`);
    },
  });

  console.log('  Adding queries to batch...');
  const promises = [
    queryBatcher.add('SELECT * FROM users WHERE id = 1'),
    queryBatcher.add('SELECT * FROM users WHERE id = 2'),
    queryBatcher.add('SELECT * FROM users WHERE id = 3'),
  ];

  const results = await Promise.all(promises);
  console.log('  Results received:');
  results.forEach((result, i) => {
    console.log(`    ${i + 1}. ${result.result}`);
  });

  const stats1 = queryBatcher.getStats();
  console.log('\n  Batch Statistics:');
  console.log(`    Total batches: ${stats1.totalBatches}`);
  console.log(`    Total items: ${stats1.totalItems}`);
  console.log(`    Average batch size: ${stats1.averageBatchSize.toFixed(2)}`);
  console.log(`    Average wait time: ${stats1.averageWaitTime.toFixed(2)}ms`);
  console.log();

  // Example 2: Batch size optimization
  console.log('2. Batch Size Optimization:');
  const optimizedBatcher = createBatchProcessor({
    maxBatchSize: 10,
    maxWaitTime: 50,
    processor: async (batch) => {
      return mockAPI.batchQuery(batch);
    },
    onBatchStart: (batch) => {
      console.log(`  🚀 Starting batch of ${batch.length} items`);
    },
    onBatchComplete: (batch, results) => {
      console.log(`  ✓ Completed batch of ${batch.length} items`);
    },
  });

  console.log('  Adding 25 queries (will create 3 batches)...');
  const manyPromises = Array.from({ length: 25 }, (_, i) =>
    optimizedBatcher.add(`Query ${i + 1}`)
  );

  await Promise.all(manyPromises);
  console.log('  All queries completed');

  const stats2 = optimizedBatcher.getStats();
  console.log('\n  Batch Statistics:');
  console.log(`    Total batches: ${stats2.totalBatches}`);
  console.log(`    Total items: ${stats2.totalItems}`);
  console.log(`    Average batch size: ${stats2.averageBatchSize.toFixed(2)}`);
  console.log(`    Successful batches: ${stats2.successfulBatches}`);
  console.log(`    Failed batches: ${stats2.failedBatches}`);
  console.log();

  // Example 3: Error handling
  console.log('3. Error Handling:');
  const errorBatcher = createBatchProcessor({
    maxBatchSize: 5,
    maxWaitTime: 100,
    processor: async (batch) => {
      // Simulate error for certain items
      if (batch.some((item) => item.includes('error'))) {
        throw new Error('Batch processing failed');
      }
      return mockAPI.batchQuery(batch);
    },
    onBatchError: (batch, error) => {
      console.log(`  ❌ Batch failed: ${error.message}`);
    },
    onItemError: (item, error) => {
      console.log(`  ⚠️  Item failed: ${item}, using fallback`);
      return { query: item, result: 'Fallback result' };
    },
  });

  console.log('  Adding queries (some will fail)...');
  const errorPromises = [
    errorBatcher.add('Query 1'),
    errorBatcher.add('Query with error'),
    errorBatcher.add('Query 3'),
  ];

  const errorResults = await Promise.all(errorPromises);
  console.log('  Results (with fallbacks):');
  errorResults.forEach((result, i) => {
    console.log(`    ${i + 1}. ${result.result}`);
  });
  console.log();

  // Example 4: Manual flushing
  console.log('4. Manual Flushing:');
  const manualBatcher = createBatchProcessor({
    maxBatchSize: 100, // Large batch size
    maxWaitTime: 10000, // Long wait time
    processor: async (batch) => {
      return mockAPI.batchFetch(batch);
    },
  });

  console.log('  Adding URLs...');
  const urlPromises = [
    manualBatcher.add('https://example.com/1'),
    manualBatcher.add('https://example.com/2'),
    manualBatcher.add('https://example.com/3'),
  ];

  console.log(`  Pending items: ${manualBatcher.getPendingCount()}`);
  console.log('  Flushing batch manually...');
  await manualBatcher.flush();

  const urlResults = await Promise.all(urlPromises);
  console.log('  Results:');
  urlResults.forEach((result, i) => {
    console.log(`    ${i + 1}. ${result.url}: ${result.content}`);
  });
  console.log();

  // Example 5: Real-world scenario - Database inserts
  console.log('5. Real-world Scenario - Database Inserts:');
  const insertBatcher = createBatchProcessor({
    maxBatchSize: 50,
    maxWaitTime: 200,
    processor: async (batch) => {
      console.log(`  💾 Inserting ${batch.length} records into database`);
      await new Promise((resolve) => setTimeout(resolve, 150));
      return batch.map((record) => ({ ...record, id: Math.random() }));
    },
    onBatchComplete: (batch, results) => {
      console.log(`  ✓ Inserted ${results.length} records`);
    },
  });

  console.log('  Simulating real-time data ingestion...');
  const records = [];

  // Simulate incoming data
  for (let i = 0; i < 100; i++) {
    records.push(
      insertBatcher.add({
        timestamp: Date.now(),
        value: Math.random() * 100,
        sensor: `sensor-${i % 10}`,
      })
    );

    // Small delay between records
    if (i % 20 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  console.log('  Waiting for all inserts to complete...');
  await Promise.all(records);
  console.log('  All records inserted');

  const stats5 = insertBatcher.getStats();
  console.log('\n  Final Statistics:');
  console.log(`    Total batches: ${stats5.totalBatches}`);
  console.log(`    Total items: ${stats5.totalItems}`);
  console.log(`    Average batch size: ${stats5.averageBatchSize.toFixed(2)}`);
  console.log(`    Average wait time: ${stats5.averageWaitTime.toFixed(2)}ms`);
  console.log(`    Success rate: ${((stats5.successfulBatches / stats5.totalBatches) * 100).toFixed(2)}%`);

  console.log('\n✨ All examples completed!');
}

main().catch(console.error);

