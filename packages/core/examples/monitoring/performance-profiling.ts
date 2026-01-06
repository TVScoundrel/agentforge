/**
 * Performance Profiling Example
 *
 * Demonstrates:
 * - Execution time profiling
 * - Memory usage tracking
 * - Statistical analysis (p50, p95, p99)
 * - Bottleneck detection
 * - Profile reports
 */

import { createProfiler } from '../../src/monitoring';

// Simulated operations with varying performance
async function fastOperation(input: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 20));
  return input.toUpperCase();
}

async function slowOperation(input: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
  // Simulate some memory allocation
  const data = new Array(1000).fill(input);
  return data.join('');
}

async function variableOperation(input: number): Promise<number> {
  const delay = input % 2 === 0 ? 10 : 100;
  await new Promise((resolve) => setTimeout(resolve, delay + Math.random() * 50));
  return input * 2;
}

async function main() {
  console.log('=== Performance Profiling Example ===\n');

  // Example 1: Basic profiling
  console.log('1. Basic Profiling');
  const profiler = createProfiler({
    enabled: true,
    sampleRate: 1.0, // Profile 100% of calls
    includeMemory: true,
    includeStack: false,
  });

  const profiledFast = profiler.profile('fastOperation', fastOperation);
  const profiledSlow = profiler.profile('slowOperation', slowOperation);
  const profiledVariable = profiler.profile('variableOperation', variableOperation);

  // Run operations multiple times
  console.log('Running operations...');
  for (let i = 0; i < 20; i++) {
    await profiledFast(`test-${i}`);
    await profiledSlow(`data-${i}`);
    await profiledVariable(i);
  }

  // Get profiling report
  const report = profiler.getReport();
  console.log('\nProfiling Report:');
  for (const [name, stats] of Object.entries(report)) {
    console.log(`\n${name}:`);
    console.log(`  Calls: ${(stats as any).calls}`);
    console.log(`  Total Time: ${(stats as any).totalTime.toFixed(2)}ms`);
    console.log(`  Avg Time: ${(stats as any).avgTime.toFixed(2)}ms`);
    console.log(`  Min Time: ${(stats as any).minTime.toFixed(2)}ms`);
    console.log(`  Max Time: ${(stats as any).maxTime.toFixed(2)}ms`);
    console.log(`  P50: ${(stats as any).p50.toFixed(2)}ms`);
    console.log(`  P95: ${(stats as any).p95.toFixed(2)}ms`);
    console.log(`  P99: ${(stats as any).p99.toFixed(2)}ms`);

    if ((stats as any).memory) {
      console.log(`  Avg Heap: ${((stats as any).memory.avgHeapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Max Heap: ${((stats as any).memory.maxHeapUsed / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  // Example 2: Sampling profiler
  console.log('\n\n2. Sampling Profiler (10% sample rate)');
  const samplingProfiler = createProfiler({
    enabled: true,
    sampleRate: 0.1, // Profile only 10% of calls
    includeMemory: false,
  });

  const sampledOperation = samplingProfiler.profile('sampledOperation', async (n: number) => {
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));
    return n * 2;
  });

  console.log('Running 100 operations with 10% sampling...');
  for (let i = 0; i < 100; i++) {
    await sampledOperation(i);
  }

  const samplingReport = samplingProfiler.getReport();
  const sampledStats = samplingReport.sampledOperation as any;
  console.log(`\nSampled ${sampledStats.calls} out of 100 calls (${(sampledStats.calls / 100 * 100).toFixed(1)}%)`);
  console.log(`Avg Time: ${sampledStats.avgTime.toFixed(2)}ms`);

  // Example 3: Promise wrapping
  console.log('\n\n3. Promise Wrapping');
  const wrapProfiler = createProfiler({
    enabled: true,
    includeMemory: true,
  });

  async function complexOperation() {
    const promise1 = wrapProfiler.wrap('step1', fastOperation('test'));
    const promise2 = wrapProfiler.wrap('step2', slowOperation('data'));
    const promise3 = wrapProfiler.wrap('step3', variableOperation(5));

    await Promise.all([promise1, promise2, promise3]);
  }

  console.log('Running complex operation with wrapped promises...');
  await complexOperation();
  await complexOperation();
  await complexOperation();

  const wrapReport = wrapProfiler.getReport();
  console.log('\nWrapped Operations Report:');
  for (const [name, stats] of Object.entries(wrapReport)) {
    console.log(`${name}: ${(stats as any).avgTime.toFixed(2)}ms avg (${(stats as any).calls} calls)`);
  }

  // Example 4: Bottleneck identification
  console.log('\n\n4. Bottleneck Identification');
  const bottleneckProfiler = createProfiler({
    enabled: true,
    includeMemory: true,
  });

  const step1 = bottleneckProfiler.profile('step1', async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  const step2 = bottleneckProfiler.profile('step2', async () => {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Bottleneck!
  });

  const step3 = bottleneckProfiler.profile('step3', async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  console.log('Running pipeline with bottleneck...');
  for (let i = 0; i < 10; i++) {
    await step1();
    await step2();
    await step3();
  }

  const bottleneckReport = bottleneckProfiler.getReport();
  const totalTime = Object.values(bottleneckReport).reduce((sum, stats) => sum + (stats as any).totalTime, 0) as number;

  console.log('\nPipeline Analysis:');
  for (const [name, stats] of Object.entries(bottleneckReport)) {
    const percentage = ((stats as any).totalTime / totalTime * 100).toFixed(1);
    const icon = parseFloat(percentage) > 50 ? '🔴' : parseFloat(percentage) > 30 ? '🟡' : '🟢';
    console.log(`${icon} ${name}: ${(stats as any).totalTime.toFixed(2)}ms (${percentage}% of total)`);
  }

  // Example 5: Export report
  console.log('\n\n5. Export Report');
  profiler.export('./profile-report.json');

  console.log('\n✅ Profiling complete');
}

main().catch(console.error);

