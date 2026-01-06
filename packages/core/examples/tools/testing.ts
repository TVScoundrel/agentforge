/**
 * Example: Tool Mocking & Testing
 *
 * Demonstrates testing tools with:
 * - Mock tool factory
 * - Deterministic responses
 * - Latency simulation
 * - Error injection
 * - Invocation tracking
 */

import { createMockTool, createToolSimulator } from '../../src/tools/testing.js';

async function main() {
  console.log('=== Tool Mocking & Testing Example ===\n');

  // Example 1: Basic mock tool
  console.log('1. Basic mock tool with predefined responses:');
  const mockSearch = createMockTool({
    name: 'search',
    description: 'Mock search tool',
    responses: [
      { input: { query: 'TypeScript' }, output: { results: ['TS result 1', 'TS result 2'] } },
      { input: { query: 'JavaScript' }, output: { results: ['JS result 1', 'JS result 2'] } },
      { input: { query: 'error' }, error: new Error('Search failed') },
    ],
    defaultResponse: { results: [] },
  });

  const result1 = await mockSearch.invoke({ query: 'TypeScript' });
  console.log('TypeScript search:', result1);

  const result2 = await mockSearch.invoke({ query: 'JavaScript' });
  console.log('JavaScript search:', result2);

  const result3 = await mockSearch.invoke({ query: 'unknown' });
  console.log('Unknown search (default):', result3);

  try {
    await mockSearch.invoke({ query: 'error' });
  } catch (error) {
    console.log('Error search:', (error as Error).message);
  }
  console.log();

  // Example 2: Mock tool with latency simulation
  console.log('2. Mock tool with latency simulation:');
  const slowMock = createMockTool({
    name: 'slow-api',
    description: 'Slow API mock',
    defaultResponse: { data: 'response' },
    latency: { min: 500, max: 1500 }, // Random latency between 500-1500ms
  });

  console.log('  Calling slow API...');
  const start = Date.now();
  await slowMock.invoke({ test: 'data' });
  const duration = Date.now() - start;
  console.log(`  Completed in ${duration}ms`);
  console.log();

  // Example 3: Mock tool with error rate
  console.log('3. Mock tool with random error injection:');
  const unstableMock = createMockTool({
    name: 'unstable-api',
    description: 'Unstable API mock',
    defaultResponse: { success: true },
    errorRate: 0.3, // 30% error rate
  });

  let successes = 0;
  let failures = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await unstableMock.invoke({ attempt: i + 1 });
      successes++;
    } catch (error) {
      failures++;
    }
  }
  console.log(`  Successes: ${successes}, Failures: ${failures}`);
  console.log();

  // Example 4: Invocation tracking
  console.log('4. Invocation tracking:');
  const trackedMock = createMockTool({
    name: 'tracked-tool',
    description: 'Tool with invocation tracking',
    defaultResponse: { data: 'response' },
    latency: 100,
  });

  await trackedMock.invoke({ query: 'first' });
  await trackedMock.invoke({ query: 'second' });
  await trackedMock.invoke({ query: 'third' });

  const invocations = trackedMock.getInvocations();
  console.log(`  Total invocations: ${invocations.length}`);
  invocations.forEach((inv, i) => {
    console.log(`  ${i + 1}. Input:`, inv.input, `Duration: ${inv.duration}ms`);
  });

  trackedMock.clearInvocations();
  console.log(`  After clear: ${trackedMock.getInvocations().length} invocations`);
  console.log();

  // Example 5: Tool simulator
  console.log('5. Tool simulator with multiple tools:');
  const simulator = createToolSimulator({
    tools: [
      {
        name: 'search',
        invoke: async (query: string) => ({ results: [`Result for ${query}`] }),
      },
      {
        name: 'fetch',
        invoke: async (url: string) => ({ content: `Content from ${url}` }),
      },
      {
        name: 'process',
        invoke: async (data: any) => ({ processed: data }),
      },
    ],
    errorRate: 0.1, // 10% error rate
    latency: { mean: 200, stddev: 50 }, // Normal distribution
    recordInvocations: true,
  });

  // Execute tools through simulator
  console.log('  Executing tools...');
  try {
    await simulator.execute('search', 'TypeScript');
    await simulator.execute('fetch', 'https://example.com');
    await simulator.execute('process', { data: 'test' });
    await simulator.execute('search', 'LangGraph');
  } catch (error) {
    console.log('  Some executions failed (expected with 10% error rate)');
  }

  // Get invocation statistics
  const searchInvocations = simulator.getInvocations('search');
  console.log(`  Search tool invocations: ${searchInvocations.length}`);

  const allInvocations = simulator.getAllInvocations();
  console.log('  All invocations:');
  Object.entries(allInvocations).forEach(([name, invs]) => {
    const successful = invs.filter((inv) => !inv.error).length;
    const failed = invs.filter((inv) => inv.error).length;
    const avgDuration = invs.reduce((sum, inv) => sum + inv.duration, 0) / invs.length;
    console.log(`    ${name}: ${invs.length} total (${successful} success, ${failed} failed, avg ${avgDuration.toFixed(0)}ms)`);
  });
  console.log();

  // Example 6: Testing with mock tools
  console.log('6. Testing workflow with mocks:');

  // Create mocks for a workflow
  const mockFetch = createMockTool({
    name: 'fetch',
    responses: [
      { input: { url: 'https://api.example.com/data' }, output: { data: 'raw data' } },
    ],
    latency: 100,
  });

  const mockParse = createMockTool({
    name: 'parse',
    responses: [
      { input: { data: 'raw data' }, output: { parsed: ['item1', 'item2'] } },
    ],
    latency: 50,
  });

  const mockSave = createMockTool({
    name: 'save',
    responses: [
      { input: { parsed: ['item1', 'item2'] }, output: { saved: true, id: '123' } },
    ],
    latency: 150,
  });

  // Simulate workflow
  console.log('  Running workflow: fetch -> parse -> save');
  const fetchResult = await mockFetch.invoke({ url: 'https://api.example.com/data' });
  console.log('  Fetched:', fetchResult);

  const parseResult = await mockParse.invoke(fetchResult);
  console.log('  Parsed:', parseResult);

  const saveResult = await mockSave.invoke(parseResult);
  console.log('  Saved:', saveResult);

  // Verify invocations
  console.log('  Verification:');
  console.log(`    Fetch called ${mockFetch.getInvocations().length} time(s)`);
  console.log(`    Parse called ${mockParse.getInvocations().length} time(s)`);
  console.log(`    Save called ${mockSave.getInvocations().length} time(s)`);

  console.log('\n✨ All examples completed!');
}

main().catch(console.error);

