/**
 * Example: Memory Management
 *
 * Demonstrates memory tracking and management with:
 * - Memory usage monitoring
 * - Threshold alerts
 * - Cleanup handlers
 * - Leak detection
 * - Automatic cleanup
 */

import { createMemoryManager } from '../../src/resources/index.js';

// Simulated cache for demonstration
const cache = new Map<string, any>();

async function main() {
  console.log('=== Memory Management Example ===\n');

  // Example 1: Basic memory monitoring
  console.log('1. Basic Memory Monitoring:');
  const memoryManager = createMemoryManager({
    maxMemory: 512 * 1024 * 1024, // 512 MB
    checkInterval: 5000, // Check every 5s
    thresholdPercentage: 80, // Alert at 80%
    onThreshold: (stats) => {
      console.log(`  ⚠️  Memory threshold reached: ${stats.percentage.toFixed(2)}%`);
      console.log(`     Used: ${(stats.used / 1024 / 1024).toFixed(2)} MB`);
      console.log(`     Total: ${(stats.total / 1024 / 1024).toFixed(2)} MB`);
    },
    onLimit: async (stats) => {
      console.log(`  🚨 Memory limit exceeded: ${stats.percentage.toFixed(2)}%`);
      console.log('     Triggering cleanup...');
      // Cleanup will be triggered automatically
    },
  });

  // Get initial memory stats
  const initialStats = memoryManager.getStats();
  console.log('  Initial Memory:');
  console.log(`    Heap Used: ${(initialStats.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Heap Total: ${(initialStats.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    External: ${(initialStats.external / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Percentage: ${initialStats.percentage.toFixed(2)}%`);
  console.log();

  // Example 2: Cleanup handlers
  console.log('2. Cleanup Handlers:');

  // Register cleanup handlers
  memoryManager.registerCleanup('cache', async () => {
    console.log('  Clearing cache...');
    cache.clear();
    console.log(`  Cache cleared (was ${cache.size} items)`);
  });

  memoryManager.registerCleanup('temp-files', async () => {
    console.log('  Removing temporary files...');
    // Simulate file cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log('  Temporary files removed');
  });

  memoryManager.registerCleanup('connections', async () => {
    console.log('  Closing idle connections...');
    // Simulate connection cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log('  Idle connections closed');
  });

  // Populate cache to use memory
  console.log('\n  Populating cache...');
  for (let i = 0; i < 1000; i++) {
    cache.set(`key-${i}`, { data: new Array(1000).fill(i) });
  }
  console.log(`  Cache populated with ${cache.size} items`);

  // Trigger cleanup
  console.log('\n  Triggering cleanup...');
  await memoryManager.cleanup('cache');
  console.log();

  // Example 3: Memory leak detection
  console.log('3. Memory Leak Detection:');
  const leakDetector = createMemoryManager({
    checkInterval: 2000,
    leakDetection: {
      enabled: true,
      sampleInterval: 3000,
      growthThreshold: 5, // Alert if memory grows by 5%
    },
    onLeak: (stats) => {
      console.log('  🔍 Potential memory leak detected!');
      console.log(`     Current usage: ${(stats.used / 1024 / 1024).toFixed(2)} MB`);
      console.log(`     Heap used: ${(stats.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    },
  });

  leakDetector.start();
  console.log('  Leak detector started');

  // Simulate memory leak
  console.log('  Simulating memory growth...');
  const leakyArray: any[] = [];
  for (let i = 0; i < 3; i++) {
    // Add data to simulate leak
    for (let j = 0; j < 10000; j++) {
      leakyArray.push({ data: new Array(100).fill(j) });
    }
    console.log(`  Added ${leakyArray.length} items to array`);
    await new Promise((resolve) => setTimeout(resolve, 3500));
  }

  leakDetector.stop();
  console.log('  Leak detector stopped');
  console.log();

  // Example 4: Automatic cleanup on threshold
  console.log('4. Automatic Cleanup on Threshold:');
  const autoCleanup = createMemoryManager({
    maxMemory: 256 * 1024 * 1024, // 256 MB
    checkInterval: 2000,
    thresholdPercentage: 70,
    onThreshold: async (stats) => {
      console.log(`  Memory at ${stats.percentage.toFixed(2)}%, triggering cleanup...`);
    },
  });

  // Register cleanup handlers
  const largeCache = new Map<string, any>();
  autoCleanup.registerCleanup('large-cache', async () => {
    console.log('  Clearing large cache...');
    largeCache.clear();
    // Force garbage collection if available
    autoCleanup.forceGC();
    console.log('  Large cache cleared');
  });

  autoCleanup.start();
  console.log('  Auto-cleanup manager started');

  // Populate cache
  console.log('  Populating large cache...');
  for (let i = 0; i < 5000; i++) {
    largeCache.set(`item-${i}`, { data: new Array(1000).fill(i) });
  }
  console.log(`  Large cache populated with ${largeCache.size} items`);

  // Wait for monitoring
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Cleanup
  await autoCleanup.cleanup();
  autoCleanup.stop();
  console.log('  Auto-cleanup manager stopped');
  console.log();

  // Example 5: Manual cleanup and stats
  console.log('5. Manual Cleanup and Stats:');
  const manualManager = createMemoryManager({
    maxMemory: 512 * 1024 * 1024,
  });

  // Get current stats
  const currentStats = manualManager.getStats();
  console.log('  Current Memory Stats:');
  console.log(`    Used: ${(currentStats.used / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Total: ${(currentStats.total / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Percentage: ${currentStats.percentage.toFixed(2)}%`);
  console.log(`    Heap Used: ${(currentStats.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Heap Total: ${(currentStats.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    External: ${(currentStats.external / 1024 / 1024).toFixed(2)} MB`);

  // Force garbage collection
  console.log('\n  Forcing garbage collection...');
  manualManager.forceGC();
  console.log('  Garbage collection triggered (if --expose-gc flag is set)');

  console.log('\n✨ All examples completed!');
}

main().catch(console.error);

