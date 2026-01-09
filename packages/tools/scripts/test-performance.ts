/**
 * Manual performance test script
 * Run with: tsx scripts/test-performance.ts
 */

import { webSearch } from '../src/web/web-search/index.js';

async function testPerformance() {
  console.log('🚀 Starting performance tests...\n');

  // Test 1: Typical query
  console.log('Test 1: Typical query (10 results)');
  const start1 = Date.now();
  const result1 = await webSearch.execute({
    query: 'TypeScript programming language',
    maxResults: 10,
  });
  const duration1 = Date.now() - start1;
  console.log(`✅ Completed in ${duration1}ms`);
  console.log(`   API response time: ${result1.metadata?.responseTime}ms`);
  console.log(`   Results: ${result1.results.length}`);
  console.log(`   Source: ${result1.source}`);
  console.log(`   Success: ${result1.success}\n`);

  // Test 2: Large result set
  console.log('Test 2: Large result set (50 results)');
  const start2 = Date.now();
  const result2 = await webSearch.execute({
    query: 'JavaScript frameworks 2026',
    maxResults: 50,
  });
  const duration2 = Date.now() - start2;
  console.log(`✅ Completed in ${duration2}ms`);
  console.log(`   API response time: ${result2.metadata?.responseTime}ms`);
  console.log(`   Results: ${result2.results.length}`);
  console.log(`   Source: ${result2.source}\n`);

  // Test 3: Custom timeout
  console.log('Test 3: Custom timeout (5s)');
  const start3 = Date.now();
  const result3 = await webSearch.execute({
    query: 'Python programming',
    maxResults: 5,
    timeout: 5000,
  });
  const duration3 = Date.now() - start3;
  console.log(`✅ Completed in ${duration3}ms`);
  console.log(`   API response time: ${result3.metadata?.responseTime}ms`);
  console.log(`   Results: ${result3.results.length}\n`);

  // Test 4: Multiple concurrent queries
  console.log('Test 4: Concurrent queries (5 queries)');
  const queries = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go'];
  const start4 = Date.now();
  const results4 = await Promise.all(
    queries.map((query) =>
      webSearch.execute({
        query,
        maxResults: 5,
      })
    )
  );
  const duration4 = Date.now() - start4;
  console.log(`✅ All completed in ${duration4}ms`);
  console.log(`   Average per query: ${(duration4 / 5).toFixed(0)}ms`);
  console.log(`   All successful: ${results4.every((r) => r.success)}\n`);

  // Summary
  console.log('📊 Performance Summary:');
  console.log(`   Typical query (10 results): ${duration1}ms ${duration1 < 5000 ? '✅' : '❌'}`);
  console.log(`   Large query (50 results): ${duration2}ms ${duration2 < 10000 ? '✅' : '❌'}`);
  console.log(`   Custom timeout: ${duration3}ms ✅`);
  console.log(`   Concurrent queries: ${duration4}ms ✅`);
  
  const allPassed = duration1 < 5000 && duration2 < 10000;
  console.log(`\n${allPassed ? '✅ All performance tests passed!' : '❌ Some tests failed'}`);
}

testPerformance().catch(console.error);

