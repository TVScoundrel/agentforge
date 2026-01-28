# Web Search Tool - Testing Guide

This document describes how to test the web-search tool in various scenarios.

## Unit Tests

Run the unit test suite:

```bash
# From packages/tools directory
pnpm test web-search

# With coverage
pnpm test:coverage web-search
```

**Test Coverage:**
- ✅ 45 unit tests passing
- ✅ DuckDuckGo provider tests (11 tests)
- ✅ Serper provider tests (10 tests)
- ✅ Index/integration tests (14 tests)
- ✅ Utility tests (10 tests)
- ✅ Fallback mechanism tests
- ✅ Error handling tests
- ✅ Schema validation tests

## Performance Tests

Run performance tests:

```bash
# From packages/tools directory
npx tsx scripts/test-performance.ts
```

**Performance Benchmarks:**
- ✅ Typical query (10 results): ~280ms
- ✅ Large query (50 results): ~100ms
- ✅ Custom timeout: ~110ms
- ✅ Concurrent queries (5x): ~250ms total, ~50ms avg

All queries complete well under the 5-second threshold.

## Playground Tests

### Basic Tool Testing

Test the tool directly without an agent:

```bash
# From playground directory
pnpm tsx apps/test-web-search.ts
```

**Tests:**
1. Basic search with DuckDuckGo
2. Premium search with Serper (requires SERPER_API_KEY)
3. Fallback behavior
4. Custom timeout (NEW)
5. Large result sets (NEW)
6. Concurrent requests (NEW)

### Agent Workflow Testing

Test the tool integrated with a ReAct agent:

```bash
# From playground directory
# Requires OPENAI_API_KEY in .env
pnpm tsx apps/test-web-search-agent.ts
```

**Tests:**
1. Simple web search query
2. Multi-step reasoning (web search + calculator)
3. Current events query

## Environment Setup

### Required Environment Variables

```bash
# Optional: For premium search
SERPER_API_KEY=your-serper-api-key

# Optional: For agent workflow tests
OPENAI_API_KEY=your-openai-api-key
```

### Getting API Keys

- **Serper API**: Get your key at [https://serper.dev](https://serper.dev)
- **OpenAI API**: Get your key at [https://platform.openai.com](https://platform.openai.com)

## Test Scenarios

### Scenario 1: Free Tier (No API Keys)

```typescript
import { webSearch } from '@agentforge/tools';

const result = await webSearch.execute({
  query: 'TypeScript programming language',
  maxResults: 10,
});

console.log(result.source); // 'duckduckgo'
console.log(result.results.length); // Number of results
```

### Scenario 2: Premium Search (Serper)

```typescript
import { webSearch } from '@agentforge/tools';

const result = await webSearch.execute({
  query: 'Latest AI developments 2026',
  maxResults: 10,
  preferSerper: true, // Use Serper if available
});

console.log(result.source); // 'serper' or 'duckduckgo'
```

### Scenario 3: Custom Timeout

```typescript
import { webSearch } from '@agentforge/tools';

const result = await webSearch.execute({
  query: 'Python programming',
  maxResults: 5,
  timeout: 5000, // 5 second timeout
});
```

### Scenario 4: Large Result Sets

```typescript
import { webSearch } from '@agentforge/tools';

const result = await webSearch.execute({
  query: 'JavaScript frameworks',
  maxResults: 50, // Request up to 50 results
});
```

### Scenario 5: Concurrent Requests

```typescript
import { webSearch } from '@agentforge/tools';

const queries = ['TypeScript', 'Rust', 'Go'];
const results = await Promise.all(
  queries.map((query) =>
    webSearch.execute({
      query,
      maxResults: 5,
    })
  )
);
```

## Expected Results

### Success Response

```typescript
{
  success: true,
  source: 'duckduckgo' | 'serper',
  query: 'sanitized query',
  results: [
    {
      title: 'Result Title',
      link: 'https://example.com',
      snippet: 'Result description...',
      position: 1
    }
  ],
  totalResults: 10,
  metadata: {
    responseTime: 283, // milliseconds
    fallbackUsed: false
  }
}
```

### Error Response

```typescript
{
  success: false,
  source: 'duckduckgo' | 'serper',
  query: 'sanitized query',
  results: [],
  error: 'Error message'
}
```

## Troubleshooting

### No Results Returned

- DuckDuckGo works best with factual queries (people, places, concepts)
- Try using Serper for better results on current events
- Check if fallback is working (metadata.fallbackUsed)

### Timeout Errors

- Increase timeout: `timeout: 60000` (60 seconds)
- Check network connection
- Retry mechanism will automatically retry transient failures

### API Key Errors

- Verify SERPER_API_KEY is set correctly
- Check API key is valid at https://serper.dev
- Tool will fallback to DuckDuckGo if Serper fails

## Performance Optimization

The tool includes several performance optimizations:

1. **Configurable Timeout**: Default 30s, adjustable 1-60s
2. **Retry Logic**: Automatic retry with exponential backoff (3 retries)
3. **Optimized Parsing**: Early returns, minimal processing
4. **Concurrent Support**: Handle multiple requests efficiently

All optimizations are tested and verified in the performance test suite.

