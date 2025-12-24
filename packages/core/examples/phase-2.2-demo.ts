/**
 * Phase 2.2 Demo: LangGraph Workflow Builders & Error Handling
 *
 * This example demonstrates the new workflow builders and error handling patterns.
 */

import { Annotation } from '@langchain/langgraph';
import {
  createSequentialWorkflow,
  createParallelWorkflow,
  createConditionalRouter,
  createSubgraph,
  withRetry,
  withErrorHandler,
  withTimeout,
} from '../src/langgraph/index.js';

// Define state
const AgentState = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  data: Annotation<Record<string, any>>({
    reducer: (left, right) => ({ ...left, ...right }),
    default: () => ({}),
  }),
  errors: Annotation<string[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
});

type State = typeof AgentState.State;

// Example 1: Sequential Workflow
console.log('\n=== Example 1: Sequential Workflow ===\n');

const sequentialWorkflow = createSequentialWorkflow<State>(AgentState, [
  {
    name: 'step1',
    node: (state) => {
      console.log('Step 1: Fetching data...');
      return { messages: ['Fetched data'], data: { fetched: true } };
    },
  },
  {
    name: 'step2',
    node: (state) => {
      console.log('Step 2: Processing data...');
      return { messages: ['Processed data'], data: { processed: true } };
    },
  },
  {
    name: 'step3',
    node: (state) => {
      console.log('Step 3: Saving results...');
      return { messages: ['Saved results'], data: { saved: true } };
    },
  },
]);

const sequentialApp = sequentialWorkflow.compile();
const sequentialResult = await sequentialApp.invoke({
  messages: [],
  data: {},
  errors: [],
});

console.log('Result:', sequentialResult);

// Example 2: Parallel Workflow
console.log('\n=== Example 2: Parallel Workflow ===\n');

const parallelWorkflow = createParallelWorkflow<State>(AgentState, {
  parallel: [
    {
      name: 'fetch_news',
      node: (state) => {
        console.log('Fetching news...');
        return { messages: ['News fetched'], data: { news: ['Article 1', 'Article 2'] } };
      },
    },
    {
      name: 'fetch_weather',
      node: (state) => {
        console.log('Fetching weather...');
        return { messages: ['Weather fetched'], data: { weather: 'Sunny' } };
      },
    },
    {
      name: 'fetch_stocks',
      node: (state) => {
        console.log('Fetching stocks...');
        return { messages: ['Stocks fetched'], data: { stocks: { AAPL: 150 } } };
      },
    },
  ],
  aggregate: {
    name: 'combine',
    node: (state) => {
      console.log('Combining results...');
      return { messages: ['All data combined'] };
    },
  },
});

const parallelApp = parallelWorkflow.compile();
const parallelResult = await parallelApp.invoke({
  messages: [],
  data: {},
  errors: [],
});

console.log('Result:', parallelResult);

// Example 3: Error Handling Patterns
console.log('\n=== Example 3: Error Handling Patterns ===\n');

// Flaky node that fails sometimes
let attempts = 0;
const flakyNode = (state: State) => {
  attempts++;
  console.log(`Attempt ${attempts}...`);
  if (attempts < 3) {
    throw new Error('Temporary failure');
  }
  return { messages: ['Success after retries'] };
};

// Wrap with retry
const robustNode = withRetry(flakyNode, {
  maxAttempts: 5,
  backoff: 'exponential',
  initialDelay: 100,
  onRetry: (error, attempt) => {
    console.log(`  Retry ${attempt}: ${error.message}`);
  },
});

// Wrap with error handler
const safeNode = withErrorHandler(robustNode, {
  onError: (error, state) => ({
    ...state,
    errors: [error.message],
    messages: ['Handled error gracefully'],
  }),
  logError: (error) => console.error('  Error logged:', error.message),
});

// Wrap with timeout
const timedNode = withTimeout(safeNode, {
  timeout: 10000,
  onTimeout: (state) => ({
    ...state,
    errors: ['Operation timed out'],
  }),
});

const result = await timedNode({ messages: [], data: {}, errors: [] });
console.log('Result:', result);

console.log('\n=== All examples completed! ===\n');

