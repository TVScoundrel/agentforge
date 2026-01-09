/**
 * Performance tests for web-search tool
 * 
 * Tests performance with various result set sizes and timeout configurations
 */

import { describe, it, expect } from 'vitest';
import { webSearch } from '../index.js';

describe('Web Search Performance Tests', () => {
  // Skip these tests in CI to avoid rate limiting
  const skipInCI = process.env.CI === 'true';

  it('should complete typical query within 5 seconds', async () => {
    if (skipInCI) {
      console.log('Skipping performance test in CI');
      return;
    }

    const startTime = Date.now();
    
    const result = await webSearch.invoke({
      query: 'TypeScript programming language',
      maxResults: 10,
    });

    const duration = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    expect(result.metadata?.responseTime).toBeDefined();
    
    console.log(`Query completed in ${duration}ms (API response: ${result.metadata?.responseTime}ms)`);
  });

  it('should handle large result sets efficiently (maxResults=50)', async () => {
    if (skipInCI) {
      console.log('Skipping performance test in CI');
      return;
    }

    const startTime = Date.now();
    
    const result = await webSearch.invoke({
      query: 'JavaScript frameworks 2026',
      maxResults: 50,
    });

    const duration = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds even for large sets
    
    console.log(`Large query (50 results) completed in ${duration}ms`);
    console.log(`Actual results returned: ${result.results.length}`);
  });

  it('should respect custom timeout', async () => {
    if (skipInCI) {
      console.log('Skipping performance test in CI');
      return;
    }

    const result = await webSearch.invoke({
      query: 'Python programming',
      maxResults: 5,
      timeout: 5000, // 5 second timeout
    });

    expect(result.success).toBe(true);
    expect(result.metadata?.responseTime).toBeLessThan(5000);
    
    console.log(`Custom timeout test completed in ${result.metadata?.responseTime}ms`);
  });

  it('should handle timeout gracefully', async () => {
    if (skipInCI) {
      console.log('Skipping performance test in CI');
      return;
    }

    // Set a very short timeout to test timeout handling
    const result = await webSearch.invoke({
      query: 'Machine learning algorithms',
      maxResults: 10,
      timeout: 1, // 1ms timeout - should fail
    });

    // Should either fail or succeed with retry
    expect(result).toBeDefined();
    
    if (!result.success) {
      expect(result.error).toBeDefined();
      console.log(`Timeout test failed as expected: ${result.error}`);
    } else {
      console.log('Timeout test succeeded with retry mechanism');
    }
  });

  it('should measure response time accurately', async () => {
    if (skipInCI) {
      console.log('Skipping performance test in CI');
      return;
    }

    const startTime = Date.now();
    
    const result = await webSearch.invoke({
      query: 'React hooks tutorial',
      maxResults: 10,
    });

    const totalDuration = Date.now() - startTime;
    const apiDuration = result.metadata?.responseTime || 0;

    expect(result.success).toBe(true);
    expect(apiDuration).toBeGreaterThan(0);
    expect(apiDuration).toBeLessThanOrEqual(totalDuration);
    
    console.log(`Total duration: ${totalDuration}ms, API duration: ${apiDuration}ms`);
    console.log(`Overhead: ${totalDuration - apiDuration}ms`);
  });

  it('should handle concurrent requests efficiently', async () => {
    if (skipInCI) {
      console.log('Skipping performance test in CI');
      return;
    }

    const queries = [
      'TypeScript',
      'JavaScript',
      'Python',
      'Rust',
      'Go',
    ];

    const startTime = Date.now();
    
    const results = await Promise.all(
      queries.map((query) =>
        webSearch.invoke({
          query,
          maxResults: 5,
        })
      )
    );

    const duration = Date.now() - startTime;

    expect(results).toHaveLength(5);
    results.forEach((result) => {
      expect(result.success).toBe(true);
    });
    
    console.log(`5 concurrent queries completed in ${duration}ms`);
    console.log(`Average per query: ${duration / 5}ms`);
  });
});

