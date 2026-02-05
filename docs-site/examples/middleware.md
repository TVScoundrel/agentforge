# Middleware Example

This example demonstrates how to create custom middleware and compose middleware stacks for your agents.

## Overview

Middleware allows you to add cross-cutting concerns to your agent nodes:

- Logging and monitoring
- Caching and performance optimization
- Error handling and retries
- Input/output validation
- Rate limiting and concurrency control

## Example 1: Using Built-in Middleware

### Caching Middleware

Cache expensive operations to improve performance:

```typescript
import { withCache } from '@agentforge/core';

interface SearchState {
  query: string;
  results?: string[];
}

async function searchNode(state: SearchState): Promise<SearchState> {
  // Expensive search operation
  const results = await performSearch(state.query);
  return { ...state, results };
}

// Add caching with 1-hour TTL
const cachedSearch = withCache(searchNode, {
  ttl: 3600000, // 1 hour in milliseconds
  keyGenerator: (state) => `search:${state.query}`,
  onCacheHit: () => console.log('Cache hit!'),
  onCacheMiss: () => console.log('Cache miss - executing search')
});
```

### Rate Limiting Middleware

Protect your APIs from overuse:

```typescript
import { withRateLimit } from '@agentforge/core';

// Limit to 100 requests per minute
const rateLimitedSearch = withRateLimit(searchNode, {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  strategy: 'token-bucket',
  onRateLimitExceeded: () => {
    console.warn('Rate limit exceeded!');
  }
});
```

### Validation Middleware

Validate inputs and outputs with Zod schemas:

```typescript
import { withValidation } from '@agentforge/core';
import { z } from 'zod';

const inputSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
}).strict();

const outputSchema = z.object({
  query: z.string(),
  results: z.array(z.string()),
}).strict();

const validatedSearch = withValidation(searchNode, {
  inputSchema,
  outputSchema,
  onValidationError: (error) => {
    console.error('Validation failed:', error.message);
  }
});
```

### Retry Middleware

Automatically retry failed operations:

```typescript
import { withRetry } from '@agentforge/core';

const resilientSearch = withRetry(searchNode, {
  maxAttempts: 3,
  backoff: 'exponential',
  initialDelay: 1000,
  maxDelay: 10000,
  retryIf: (error) => {
    // Only retry on network errors
    return error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
  },
  onRetry: (attempt, error) => {
    console.log(`Retry attempt ${attempt} after error: ${error.message}`);
  }
});
```

## Example 2: Composing Middleware

### Using `compose()`

Apply multiple middleware to a single node:

```typescript
import { compose, withCache, withValidation, withRateLimit, withLogging } from '@agentforge/core';
import { z } from 'zod';

const schema = z.object({
  query: z.string().min(1),
}).strict();

// Compose multiple middleware
const enhancedSearch = compose(
  withLogging({ name: 'search', level: 'info' }),
  (n) => withValidation(n, { inputSchema: schema }),
  (n) => withRateLimit(n, { maxRequests: 100, windowMs: 60000 }),
  (n) => withCache(n, { ttl: 3600000 })
)(searchNode);
```

**Execution Order:** Middleware are applied left to right:
1. Logging (outermost)
2. Validation
3. Rate limiting
4. Caching
5. Node execution

### Using `MiddlewareChain`

Fluent API for building middleware stacks:

```typescript
import { MiddlewareChain } from '@agentforge/core';

const enhancedSearch = new MiddlewareChain()
  .use(withLogging({ name: 'search', level: 'info' }))
  .use((n) => withValidation(n, { inputSchema: schema }))
  .use((n) => withRateLimit(n, { maxRequests: 100, windowMs: 60000 }))
  .use((n) => withCache(n, { ttl: 3600000 }))
  .build(searchNode);
```

## Example 3: Middleware Presets

### Production Preset

Optimized for production with error handling, retries, and monitoring:

```typescript
import { production } from '@agentforge/core';

const productionSearch = production(searchNode, {
  nodeName: 'search-node',
  enableRetry: true,
  retryOptions: {
    maxAttempts: 3,
    backoff: 'exponential'
  },
  errorOptions: {
    rethrow: false,
    onError: (error, state) => {
      console.error('Search failed:', error);
      return { ...state, results: [] };
    }
  }
});
```

### Development Preset

Optimized for development with verbose logging and tracing:

```typescript
import { development } from '@agentforge/core';

const devSearch = development(searchNode, {
  nodeName: 'search-node',
  verbose: true
});
```

### Testing Preset

Optimized for testing with mocks and invocation tracking:

```typescript
import { testing } from '@agentforge/core';

const testSearch = testing(searchNode, {
  nodeName: 'search-node',
  mockResponse: { query: 'test', results: ['mocked result'] },
  trackInvocations: true,
  simulateError: false
});

// Access invocations
console.log(testSearch.invocations);
```

## Example 4: Creating Custom Middleware

Create your own middleware for specific needs:

```typescript
import { Middleware, NodeFunction } from '@agentforge/core';

interface TimingOptions {
  name: string;
  threshold?: number; // Warn if execution exceeds this (ms)
}

function withTiming<State>(
  options: TimingOptions
): Middleware<State, TimingOptions> {
  return (node: NodeFunction<State>) => {
    return async (state: State): Promise<State> => {
      const startTime = Date.now();

      try {
        const result = await node(state);
        const duration = Date.now() - startTime;

        console.log(`[${options.name}] Execution time: ${duration}ms`);

        if (options.threshold && duration > options.threshold) {
          console.warn(`[${options.name}] Exceeded threshold of ${options.threshold}ms`);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[${options.name}] Failed after ${duration}ms`);
        throw error;
      }
    };
  };
}

// Use custom middleware
const timedSearch = withTiming({ name: 'search', threshold: 5000 })(searchNode);
```

## Example 5: Conditional Middleware

Apply middleware based on conditions:

```typescript
function withConditionalCache<State>(
  condition: (state: State) => boolean,
  cacheOptions: CacheOptions
): Middleware<State, CacheOptions> {
  return (node: NodeFunction<State>) => {
    const cachedNode = withCache(node, cacheOptions);

    return async (state: State): Promise<State> => {
      if (condition(state)) {
        return cachedNode(state);
      }
      return node(state);
    };
  };
}

// Only cache queries longer than 3 characters
const conditionalCachedSearch = withConditionalCache(
  (state) => state.query.length > 3,
  { ttl: 3600000 }
)(searchNode);
```

## Example 6: Middleware with Shared Resources

Share resources across multiple nodes:

```typescript
import { createSharedCache, createSharedRateLimiter } from '@agentforge/core';

// Create shared cache
const sharedCache = createSharedCache({
  ttl: 3600000,
  maxSize: 1000,
  evictionStrategy: 'lru'
});

// Create shared rate limiter
const sharedRateLimiter = createSharedRateLimiter({
  maxRequests: 100,
  windowMs: 60000,
  strategy: 'token-bucket'
});

// Apply to multiple nodes
const cachedSearch = sharedCache.withCache(searchNode);
const cachedRecommend = sharedCache.withCache(recommendNode);

const rateLimitedSearch = sharedRateLimiter.withRateLimit(searchNode);
const rateLimitedRecommend = sharedRateLimiter.withRateLimit(recommendNode);
```

## Best Practices

### 1. Order Matters

Apply middleware in the correct order:

```typescript
// ✅ Good - logging first, then validation, then caching
compose(
  withLogging({ name: 'node' }),
  (n) => withValidation(n, { inputSchema }),
  (n) => withCache(n, { ttl: 3600000 })
)(node);

// ❌ Bad - caching before validation
compose(
  (n) => withCache(n, { ttl: 3600000 }),
  (n) => withValidation(n, { inputSchema }),
  withLogging({ name: 'node' })
)(node);
```

### 2. Use Presets for Common Scenarios

```typescript
// ✅ Good - use preset for production
const productionNode = production(node, { nodeName: 'my-node' });

// ❌ Bad - manually composing common middleware
const manualNode = compose(
  withLogging({ name: 'my-node' }),
  (n) => withRetry(n, { maxAttempts: 3 }),
  // ... many more
)(node);
```

### 3. Share Resources When Possible

```typescript
// ✅ Good - shared cache across nodes
const cache = createSharedCache({ ttl: 3600000 });
const node1 = cache.withCache(searchNode);
const node2 = cache.withCache(recommendNode);

// ❌ Bad - separate caches
const node1 = withCache(searchNode, { ttl: 3600000 });
const node2 = withCache(recommendNode, { ttl: 3600000 });
```

## Next Steps

- [Middleware Guide](/guide/concepts/middleware) - Deep dive into middleware
- [API Reference](/api/core#middleware) - Complete middleware API
- [Agent Patterns](/guide/concepts/patterns) - Use middleware with patterns
- [Production Deployment](/tutorials/production-deployment) - Deploy with middleware

