# Middleware Best Practices

> Production-ready patterns and best practices for using middleware in AgentForge

## Table of Contents

- [Middleware Ordering](#middleware-ordering)
- [Resource Management](#resource-management)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Security](#security)
- [Common Patterns](#common-patterns)

## Middleware Ordering

### Recommended Order

Apply middleware in this order for optimal behavior:

```typescript
const node = compose(
  // 1. Logging/Tracing (outermost - captures everything)
  withLogging({ name: 'node' }),
  withTracing({ name: 'node' }),
  
  // 2. Metrics (track all executions)
  withMetrics({ name: 'node' }),
  
  // 3. Timeout (prevent long-running operations)
  withTimeout({ timeout: 30000 }),
  
  // 4. Validation (fail fast on invalid input)
  withValidation({ inputSchema }),
  
  // 5. Caching (avoid unnecessary work)
  withCache({ ttl: 3600000 }),
  
  // 6. Rate Limiting (control request rate)
  withRateLimit({ maxRequests: 100 }),
  
  // 7. Concurrency Control (manage resources)
  withConcurrency({ maxConcurrent: 5 }),
  
  // 8. Retry (handle transient failures)
  withRetry({ maxAttempts: 3 }),
  
  // 9. Error Handling (innermost - catch all errors)
  withErrorHandler({ onError: handleError }),
  
  myNode
);
```

### Why This Order?

1. **Logging/Tracing First**: Captures all middleware behavior
2. **Metrics Early**: Tracks all attempts including retries
3. **Timeout Early**: Prevents wasting resources on slow operations
4. **Validation Before Cache**: Don't cache invalid inputs
5. **Cache Before Rate Limit**: Cached responses don't count against rate limit
6. **Rate Limit Before Concurrency**: Control incoming rate before queuing
7. **Concurrency Before Retry**: Limit concurrent retries
8. **Retry Before Error Handler**: Let retry attempt before handling
9. **Error Handler Last**: Catch all errors from all middleware

### Anti-Patterns

❌ **Don't cache before validation**:
```typescript
// Bad: Caches invalid inputs
const node = compose(
  withCache({ ttl: 3600000 }),
  withValidation({ inputSchema }),
  myNode
);
```

✅ **Do validate before caching**:
```typescript
// Good: Only caches valid inputs
const node = compose(
  withValidation({ inputSchema }),
  withCache({ ttl: 3600000 }),
  myNode
);
```

❌ **Don't rate limit before caching**:
```typescript
// Bad: Cached responses count against rate limit
const node = compose(
  withRateLimit({ maxRequests: 100 }),
  withCache({ ttl: 3600000 }),
  myNode
);
```

✅ **Do cache before rate limiting**:
```typescript
// Good: Cached responses bypass rate limit
const node = compose(
  withCache({ ttl: 3600000 }),
  withRateLimit({ maxRequests: 100 }),
  myNode
);
```

## Resource Management

### Share Resources Across Nodes

✅ **Use shared caches**:
```typescript
const cache = createSharedCache({ ttl: 3600000, maxSize: 1000 });

const searchNode = cache.withCache(search);
const fetchNode = cache.withCache(fetch);
const processNode = cache.withCache(process);
```

✅ **Use shared rate limiters**:
```typescript
const limiter = createSharedRateLimiter({
  maxRequests: 100,
  windowMs: 60000,
});

const apiNode1 = limiter.withRateLimit(callAPI1);
const apiNode2 = limiter.withRateLimit(callAPI2);
```

✅ **Use shared concurrency controllers**:
```typescript
const controller = createSharedConcurrencyController({
  maxConcurrent: 10,
});

const dbNode1 = controller.withConcurrency(queryDB1);
const dbNode2 = controller.withConcurrency(queryDB2);
```

### Memory Management

Set appropriate cache sizes:

```typescript
// ✅ Good: Reasonable cache size
const cache = createSharedCache({
  maxSize: 1000,
  evictionStrategy: 'lru',
});

// ❌ Bad: Unbounded cache
const cache = createSharedCache({
  maxSize: Infinity, // Memory leak!
});
```

### Cleanup

Clean up resources when done:

```typescript
const cache = createSharedCache({ ttl: 3600000 });

// Use cache...

// Cleanup
cache.clear();
```

## Error Handling

### Always Handle Errors in Production

```typescript
const productionNode = compose(
  withErrorHandler({
    onError: (error, state) => {
      // Log error
      logger.error('Node failed', { error, state });
      
      // Return fallback
      return {
        ...state,
        error: error.message,
        fallback: true,
      };
    },
    rethrow: false, // Don't crash the application
  }),
  myNode
);
```

### Retry Transient Errors Only

```typescript
const isTransientError = (error: Error): boolean => {
  return (
    error.message.includes('ECONNRESET') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('503') ||
    error.message.includes('429')
  );
};

const node = withRetry(myNode, {
  maxAttempts: 3,
  shouldRetry: isTransientError,
  backoff: 'exponential',
});
```

### Combine Retry with Error Handling

```typescript
const node = compose(
  withRetry({
    maxAttempts: 3,
    shouldRetry: isTransientError,
  }),
  withErrorHandler({
    onError: (error, state) => ({
      ...state,
      error: error.message,
    }),
    rethrow: false,
  }),
  myNode
);
```

## Performance Optimization

### Use Appropriate Cache Keys

✅ **Include all relevant state**:
```typescript
const node = withCache(myNode, {
  keyGenerator: (state) =>
    `${state.userId}:${state.query}:${JSON.stringify(state.filters)}`,
});
```

❌ **Don't use incomplete keys**:
```typescript
// Bad: Missing userId and filters
const node = withCache(myNode, {
  keyGenerator: (state) => state.query,
});
```

### Set Appropriate TTLs

```typescript
// Short-lived data (1 minute)
const realtimeNode = withCache(fetchRealtime, {
  ttl: 60000,
});

// Medium-lived data (1 hour)
const searchNode = withCache(search, {
  ttl: 3600000,
});

// Long-lived data (24 hours)
const staticNode = withCache(fetchStatic, {
  ttl: 86400000,
});
```

### Use LRU Eviction for Hot Data

```typescript
const cache = createSharedCache({
  maxSize: 1000,
  evictionStrategy: 'lru', // Keep frequently accessed items
});
```

### Avoid Caching Errors

```typescript
const node = withCache(myNode, {
  cacheErrors: false, // Don't cache error responses
});
```

### Use Concurrency Control for Resource-Intensive Operations

```typescript
// Limit concurrent database queries
const dbNode = withConcurrency(queryDB, {
  maxConcurrent: 10,
});

// Limit concurrent API calls
const apiNode = withConcurrency(callAPI, {
  maxConcurrent: 5,
});
```

## Testing

### Use Testing Preset for Unit Tests

```typescript
import { testingPreset } from '@agentforge/core/middleware';

describe('myNode', () => {
  it('should process input correctly', async () => {
    const testNode = testingPreset(myNode, {
      mock: { response: { result: 'test' } },
      track: true,
    });

    const result = await testNode({ input: 'test' });

    expect(result.result).toBe('test');
    expect(testNode.invocations).toHaveLength(1);
    expect(testNode.invocations[0].input).toEqual({ input: 'test' });
  });
});
```

### Test Error Scenarios

```typescript
it('should handle errors gracefully', async () => {
  const testNode = testingPreset(myNode, {
    mock: { error: new Error('Test error') },
  });

  await expect(testNode({ input: 'test' })).rejects.toThrow('Test error');
});
```

### Test Middleware Composition

```typescript
it('should apply middleware in correct order', async () => {
  const calls: string[] = [];

  const middleware1 = createMiddleware((node) => async (state) => {
    calls.push('m1-before');
    const result = await node(state);
    calls.push('m1-after');
    return result;
  });

  const middleware2 = createMiddleware((node) => async (state) => {
    calls.push('m2-before');
    const result = await node(state);
    calls.push('m2-after');
    return result;
  });

  const node = compose(middleware1, middleware2, myNode);
  await node({ input: 'test' });

  expect(calls).toEqual([
    'm1-before',
    'm2-before',
    'm2-after',
    'm1-after',
  ]);
});
```

## Monitoring

### Track Metrics in Production

```typescript
const node = withMetrics(myNode, {
  name: 'my-node',
  onMetric: (metric) => {
    // Send to monitoring service
    monitoring.record(metric);
  },
});
```

### Log Important Events

```typescript
const node = withLogging({
  name: 'my-node',
  level: 'info',
  onStart: (state) => {
    logger.info('Node started', { state });
  },
  onComplete: (state, result) => {
    logger.info('Node completed', { state, result });
  },
  onError: (state, error) => {
    logger.error('Node failed', { state, error });
  },
})(myNode);
```

### Use Tracing for Debugging

```typescript
const node = withTracing(myNode, {
  name: 'my-node',
  onSpanStart: (span) => {
    tracer.startSpan(span);
  },
  onSpanEnd: (span) => {
    tracer.endSpan(span);
  },
});
```

### Monitor Cache Hit Rates

```typescript
let hits = 0;
let misses = 0;

const node = withCache(myNode, {
  onCacheHit: () => hits++,
  onCacheMiss: () => misses++,
});

// Periodically log hit rate
setInterval(() => {
  const total = hits + misses;
  const hitRate = total > 0 ? (hits / total) * 100 : 0;
  logger.info(`Cache hit rate: ${hitRate.toFixed(2)}%`);
}, 60000);
```

## Security

### Validate All Inputs

```typescript
import { z } from 'zod';

const inputSchema = z.object({
  userId: z.string().uuid(),
  query: z.string().min(1).max(1000),
  filters: z.record(z.string()).optional(),
}).strict();

const node = withValidation(myNode, {
  inputSchema,
  mode: 'input',
  throwOnError: true,
});
```

### Use Per-User Rate Limiting

```typescript
const node = withRateLimit(myNode, {
  maxRequests: 100,
  windowMs: 60000,
  keyGenerator: (state) => state.userId, // Per-user limits
});
```

### Sanitize Logged Data

```typescript
const node = withLogging({
  name: 'my-node',
  extractData: (state) => ({
    userId: state.userId,
    query: state.query,
    // Don't log sensitive data like passwords, tokens, etc.
  }),
})(myNode);
```

### Set Timeouts to Prevent DoS

```typescript
const node = withTimeout(myNode, {
  timeout: 30000, // Prevent long-running operations
});
```

## Common Patterns

### API Client Pattern

```typescript
const apiClient = compose(
  withLogging({ name: 'api-client', level: 'info' }),
  withMetrics({ name: 'api-client' }),
  withTimeout({ timeout: 10000 }),
  withRetry({ maxAttempts: 3, backoff: 'exponential' }),
  withRateLimit({ maxRequests: 100, windowMs: 60000 }),
  withCache({ ttl: 300000 }),
  callAPI
);
```

### Database Query Pattern

```typescript
const dbQuery = compose(
  withLogging({ name: 'db-query', level: 'info' }),
  withMetrics({ name: 'db-query' }),
  withValidation({ inputSchema: querySchema }),
  withConcurrency({ maxConcurrent: 10 }),
  withCache({ ttl: 60000 }),
  executeQuery
);
```

### LLM Node Pattern

```typescript
const llmNode = productionPreset(callLLM, {
  logging: { name: 'llm', level: 'info' },
  metrics: { name: 'llm' },
  timeout: { timeout: 30000 },
  retry: { maxAttempts: 3 },
  rateLimit: { maxRequests: 50, windowMs: 60000 },
  cache: { ttl: 3600000 },
  validation: { inputSchema: llmInputSchema },
});
```

### Background Job Pattern

```typescript
const backgroundJob = compose(
  withLogging({ name: 'job', level: 'info' }),
  withMetrics({ name: 'job' }),
  withConcurrency({ maxConcurrent: 5, priority: 'low' }),
  withRetry({ maxAttempts: 5, backoff: 'exponential' }),
  withErrorHandler({
    onError: (error, state) => {
      // Log and continue
      logger.error('Job failed', { error, state });
      return state;
    },
    rethrow: false,
  }),
  processJob
);
```

## Summary

Key takeaways for production-ready middleware:

1. **Order middleware correctly** - Logging first, error handling last
2. **Share resources** - Use shared caches, rate limiters, and concurrency controllers
3. **Handle errors gracefully** - Always include error handling in production
4. **Optimize performance** - Use appropriate cache keys, TTLs, and eviction strategies
5. **Test thoroughly** - Use testing preset and test error scenarios
6. **Monitor everything** - Track metrics, log events, and use tracing
7. **Secure your nodes** - Validate inputs, use per-user rate limiting, sanitize logs
8. **Follow patterns** - Use established patterns for common scenarios

For more details, see:
- [Middleware Guide](./middleware-guide.md)
- [API Documentation](../api/middleware.md)
- [Phase 4 Complete](../PHASE_4_COMPLETE.md)

