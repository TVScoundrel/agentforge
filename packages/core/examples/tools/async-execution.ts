/**
 * Example: Async Tool Execution
 *
 * Demonstrates parallel tool execution with:
 * - Concurrency limits
 * - Priority-based scheduling
 * - Retry policies
 * - Execution metrics
 */

import { createToolExecutor } from '../../src/tools/executor.js';

// Mock tools for demonstration
const searchTool = {
  name: 'search',
  invoke: async (query: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { results: [`Result for: ${query}`] };
  },
};

const fetchTool = {
  name: 'fetch',
  invoke: async (url: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { content: `Content from ${url}` };
  },
};

const processTool = {
  name: 'process',
  invoke: async (data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { processed: data };
  },
};

const unstableTool = {
  name: 'unstable',
  invoke: async (input: any) => {
    // Fails 50% of the time
    if (Math.random() < 0.5) {
      throw new Error('Random failure');
    }
    return { success: true, input };
  },
};

async function main() {
  console.log('=== Async Tool Execution Example ===\n');

  // Create executor with configuration
  const executor = createToolExecutor({
    maxConcurrent: 3,
    timeout: 5000,
    retryPolicy: {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 500,
    },
    priorityFn: (tool) => {
      // Assign priorities based on tool name
      if (tool.name === 'search') return 'high';
      if (tool.name === 'fetch') return 'normal';
      return 'low';
    },
    onExecutionStart: (tool, input) => {
      console.log(`▶️  Starting ${tool.name} with input:`, input);
    },
    onExecutionComplete: (tool, input, result, duration) => {
      console.log(`✅ Completed ${tool.name} in ${duration}ms`);
    },
    onExecutionError: (tool, input, error, duration) => {
      console.log(`❌ Failed ${tool.name} after ${duration}ms:`, error.message);
    },
  });

  // Example 1: Execute single tool
  console.log('1. Single tool execution:');
  const result1 = await executor.execute(searchTool, 'TypeScript');
  console.log('Result:', result1);
  console.log();

  // Example 2: Execute multiple tools in parallel
  console.log('2. Parallel execution:');
  const results = await executor.executeParallel([
    { tool: searchTool, input: 'LangGraph' },
    { tool: fetchTool, input: 'https://example.com' },
    { tool: processTool, input: { data: 'test' } },
  ]);
  console.log('Results:', results);
  console.log();

  // Example 3: Priority-based execution
  console.log('3. Priority-based execution:');
  const promises = [
    executor.execute(processTool, { data: 'low priority' }, { priority: 'low' }),
    executor.execute(searchTool, 'high priority', { priority: 'high' }),
    executor.execute(fetchTool, 'normal priority', { priority: 'normal' }),
    executor.execute(searchTool, 'critical', { priority: 'critical' }),
  ];
  await Promise.all(promises);
  console.log();

  // Example 4: Retry on failure
  console.log('4. Retry on failure:');
  try {
    const result = await executor.execute(unstableTool, { test: 'data' });
    console.log('Unstable tool succeeded:', result);
  } catch (error) {
    console.log('Unstable tool failed after retries');
  }
  console.log();

  // Example 5: Get execution metrics
  console.log('5. Execution metrics:');
  const metrics = executor.getMetrics();
  console.log('Total executions:', metrics.totalExecutions);
  console.log('Successful:', metrics.successfulExecutions);
  console.log('Failed:', metrics.failedExecutions);
  console.log('Average duration:', metrics.averageDuration.toFixed(2), 'ms');
  console.log('By priority:', metrics.byPriority);
  console.log();

  // Example 6: Queue status
  console.log('6. Queue status:');
  const status = executor.getQueueStatus();
  console.log('Queue length:', status.queueLength);
  console.log('Active executions:', status.activeExecutions);
  console.log('Max concurrent:', status.maxConcurrent);
}

main().catch(console.error);

