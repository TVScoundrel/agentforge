/**
 * Example: Tool Composition
 *
 * Demonstrates composing tools into complex workflows:
 * - Sequential execution
 * - Parallel execution
 * - Conditional execution
 * - Retry, timeout, and caching wrappers
 */

import {
  sequential,
  parallel,
  conditional,
  composeTool,
  retry,
  timeout,
  cache,
} from '../../src/tools/composition.js';

// Mock tools for demonstration
const fetchTool = {
  name: 'fetch',
  description: 'Fetch data from URL',
  invoke: async (url: string) => {
    console.log(`  📥 Fetching: ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { url, content: `Content from ${url}`, timestamp: Date.now() };
  },
};

const parseTool = {
  name: 'parse',
  description: 'Parse fetched content',
  invoke: async (data: any) => {
    console.log(`  🔍 Parsing content from: ${data.url}`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ...data, parsed: true, items: ['item1', 'item2', 'item3'] };
  },
};

const validateTool = {
  name: 'validate',
  description: 'Validate parsed data',
  invoke: async (data: any) => {
    console.log(`  ✓ Validating data...`);
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { ...data, valid: true };
  },
};

const saveTool = {
  name: 'save',
  description: 'Save data to database',
  invoke: async (data: any) => {
    console.log(`  💾 Saving data...`);
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { ...data, saved: true, id: Math.random().toString(36).substring(7) };
  },
};

const searchTool = {
  name: 'search',
  description: 'Search for information',
  invoke: async (query: string) => {
    console.log(`  🔎 Searching for: ${query}`);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { query, results: [`Result 1 for ${query}`, `Result 2 for ${query}`] };
  },
};

const cacheTool = {
  name: 'cache',
  description: 'Get from cache',
  invoke: async (key: string) => {
    console.log(`  📦 Getting from cache: ${key}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { cached: true, key, value: `Cached value for ${key}` };
  },
};

async function main() {
  console.log('=== Tool Composition Example ===\n');

  // Example 1: Sequential execution
  console.log('1. Sequential execution (fetch -> parse -> validate -> save):');
  const pipeline = sequential([fetchTool, parseTool, validateTool, saveTool]);
  const result1 = await pipeline.invoke('https://example.com/data');
  console.log('Result:', result1);
  console.log();

  // Example 2: Parallel execution
  console.log('2. Parallel execution (search + fetch + cache):');
  const gather = parallel([searchTool, fetchTool, cacheTool]);
  const result2 = await gather.invoke('TypeScript');
  console.log('Results:', result2);
  console.log();

  // Example 3: Conditional execution
  console.log('3. Conditional execution (cache if available, else fetch):');
  const smartFetch = conditional({
    condition: (input) => input.cached === true,
    onTrue: cacheTool,
    onFalse: fetchTool,
  });

  console.log('  With cache:');
  const result3a = await smartFetch.invoke({ cached: true, url: 'test' });
  console.log('  Result:', result3a);

  console.log('  Without cache:');
  const result3b = await smartFetch.invoke({ cached: false, url: 'https://example.com' });
  console.log('  Result:', result3b);
  console.log();

  // Example 4: Complex composition
  console.log('4. Complex composition (parallel fetch + sequential process):');
  const researchTool = composeTool({
    name: 'research',
    description: 'Research and save information',
    steps: [
      // Step 1: Gather data in parallel
      parallel([searchTool, fetchTool]),
      // Step 2: Process sequentially
      sequential([parseTool, validateTool]),
      // Step 3: Conditional save
      conditional({
        condition: (result) => result.valid === true,
        onTrue: saveTool,
        onFalse: {
          name: 'skip',
          description: 'Skip saving',
          invoke: async (data) => ({ ...data, skipped: true }),
        },
      }),
    ],
  });

  const result4 = await researchTool.invoke('AI agents');
  console.log('Result:', result4);
  console.log();

  // Example 5: Retry wrapper
  console.log('5. Retry wrapper (unstable tool):');
  let attempts = 0;
  const unstableTool = {
    name: 'unstable',
    description: 'Unstable tool that fails sometimes',
    invoke: async (input: any) => {
      attempts++;
      console.log(`  Attempt ${attempts}...`);
      if (attempts < 3) {
        throw new Error('Random failure');
      }
      return { success: true, attempts };
    },
  };

  const reliableTool = retry(unstableTool, {
    maxAttempts: 5,
    delay: 500,
    backoff: 'exponential',
  });

  const result5 = await reliableTool.invoke({ test: 'data' });
  console.log('Result:', result5);
  console.log();

  // Example 6: Timeout wrapper
  console.log('6. Timeout wrapper (slow tool):');
  const slowTool = {
    name: 'slow',
    description: 'Slow tool',
    invoke: async (input: any) => {
      console.log('  Starting slow operation...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { done: true };
    },
  };

  const fastTool = timeout(slowTool, 1000);
  try {
    await fastTool.invoke({ test: 'data' });
  } catch (error) {
    console.log('  ❌ Timeout:', (error as Error).message);
  }
  console.log();

  // Example 7: Cache wrapper
  console.log('7. Cache wrapper (expensive operation):');
  let callCount = 0;
  const expensiveTool = {
    name: 'expensive',
    description: 'Expensive operation',
    invoke: async (input: any) => {
      callCount++;
      console.log(`  🔄 Expensive call #${callCount}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { result: `Computed for ${JSON.stringify(input)}`, callCount };
    },
  };

  const cachedTool = cache(expensiveTool, 5000); // 5 second TTL

  console.log('  First call (cache miss):');
  const result7a = await cachedTool.invoke({ query: 'test' });
  console.log('  Result:', result7a);

  console.log('  Second call (cache hit):');
  const result7b = await cachedTool.invoke({ query: 'test' });
  console.log('  Result:', result7b);

  console.log('  Third call with different input (cache miss):');
  const result7c = await cachedTool.invoke({ query: 'different' });
  console.log('  Result:', result7c);
}

main().catch(console.error);

