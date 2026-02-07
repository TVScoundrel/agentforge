# Middleware

Middleware are composable functions that wrap agent nodes to add cross-cutting concerns like logging, caching, validation, and error handling. They enable you to enhance agent behavior without modifying core logic.

::: tip Related Concepts
- **[Middleware Examples](/examples/middleware)** - See middleware in action
- **[Testing Strategies](/tutorials/testing)** - Learn how to test middleware
- **[Advanced Patterns](/tutorials/advanced-patterns)** - Combine middleware with patterns
:::

## What is Middleware?

Middleware is a function that wraps a node function to add additional behavior:

```typescript
type Middleware<State> = (
  node: NodeFunction<State>,
  options?: any
) => NodeFunction<State>;
```

### How It Works

```
Request → Middleware 1 → Middleware 2 → Node → Middleware 2 → Middleware 1 → Response
```

Middleware forms an "onion" around your node:
1. **Before** - Middleware can inspect/modify input
2. **Execute** - Node runs with enhanced behavior
3. **After** - Middleware can inspect/modify output

## Built-in Middleware

AgentForge provides 10+ production-ready middleware:

### Caching

Cache node results to avoid redundant computations:

```typescript
import { withCache } from '@agentforge/core';

const cachedNode = withCache(myNode, {
  ttl: 3600000, // 1 hour in milliseconds
  maxSize: 100, // Max cache entries
  evictionStrategy: 'lru', // Least Recently Used
  keyGenerator: (state) => JSON.stringify(state.query),
});
```

**Options:**
- `ttl` - Time to live in milliseconds
- `maxSize` - Maximum cache entries
- `evictionStrategy` - `'lru'` | `'fifo'` | `'lfu'`
- `keyGenerator` - Function to generate cache key from state

### Rate Limiting

Control request rate to prevent overload:

```typescript
import { withRateLimit } from '@agentforge/core';

const rateLimitedNode = withRateLimit(myNode, {
  maxRequests: 100, // Max requests
  windowMs: 60000, // Per minute
  strategy: 'sliding-window', // or 'token-bucket', 'fixed-window'
});
```

**Strategies:**
- `sliding-window` - Smooth rate limiting
- `token-bucket` - Burst tolerance
- `fixed-window` - Simple time windows

### Validation

Validate inputs and outputs with Zod schemas:

```typescript
import { withValidation } from '@agentforge/core';
import { z } from 'zod';

const inputSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().positive().optional(),
});

const outputSchema = z.object({
  results: z.array(z.string()),
  count: z.number(),
});

const validatedNode = withValidation(myNode, {
  inputSchema,
  outputSchema,
  strict: true, // Throw on validation errors
});
```

### Retry Logic

Automatically retry failed operations:

```typescript
import { withRetry } from '@agentforge/core';

const resilientNode = withRetry(myNode, {
  maxAttempts: 3,
  backoff: 'exponential', // or 'linear', 'constant'
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryIf: (error) => error.code === 'RATE_LIMIT',
});
```

**Backoff Strategies:**
- `exponential` - Delay doubles each retry (1s, 2s, 4s, 8s...)
- `linear` - Delay increases linearly (1s, 2s, 3s, 4s...)
- `constant` - Same delay each time

### Timeout

Prevent long-running operations:

```typescript
import { withTimeout } from '@agentforge/core';

const timedNode = withTimeout(myNode, {
  timeout: 30000, // 30 seconds
  onTimeout: (state) => {
    return { ...state, error: 'Operation timed out' };
  },
});
```

### Logging

Structured logging for observability:

```typescript
import { withLogging } from '@agentforge/core';

const loggedNode = withLogging({
  name: 'search-node',
  level: 'info', // 'debug' | 'info' | 'warn' | 'error'
  logInput: true,
  logOutput: true,
  logDuration: true,
  logErrors: true,
})(myNode);
```

### Error Handling

Graceful error handling with fallbacks:

```typescript
import { withErrorHandler } from '@agentforge/core';

const safeNode = withErrorHandler(myNode, {
  onError: (error, state) => {
    console.error('Node failed:', error);
    return { ...state, error: error.message };
  },
  rethrow: false, // Don't propagate errors
});
```

### Metrics

Collect performance metrics:

```typescript
import { withMetrics, createMetrics } from '@agentforge/core';

// Create a shared metrics collector
const metrics = createMetrics('my-agent');

const monitoredNode = withMetrics(myNode, {
  name: 'search-node',
  metrics, // Use shared metrics collector
  trackDuration: true,
  trackErrors: true,
  trackInvocations: true,
});

// Access collected metrics
const allMetrics = metrics.getMetrics();
console.log('Metrics:', allMetrics);
```

### Tracing

Distributed tracing support:

```typescript
import { withTracing } from '@agentforge/core';

const tracedNode = withTracing(myNode, {
  name: 'search-node',
  metadata: { service: 'search-api' },
  onSpanStart: (span) => console.log('Started:', span.id),
  onSpanEnd: (span) => console.log('Ended:', span.id),
});
```

### Concurrency Control

Limit concurrent executions:

```typescript
import { withConcurrency } from '@agentforge/core';

const throttledNode = withConcurrency(myNode, {
  maxConcurrent: 5, // Max 5 concurrent executions
  queueSize: 100, // Max 100 queued requests
  timeout: 30000, // Queue timeout
});
```

## Composing Middleware

### Using `compose()`

Apply multiple middleware to a node:

```typescript
import { compose, withCache, withValidation, withLogging } from '@agentforge/core';
import { z } from 'zod';

const schema = z.object({ query: z.string() });

const enhancedNode = compose(
  (node) => withLogging({ name: 'search', level: 'info' })(node),
  (node) => withValidation(node, { inputSchema: schema }),
  (node) => withCache(node, { ttl: 3600000 }),
)(myNode);
```

**Execution Order:** Middleware are applied left to right, so:
1. Logging happens first (outermost)
2. Then validation
3. Then caching
4. Finally the node executes

### Using `MiddlewareChain`

Fluent API for building middleware stacks:

```typescript
import { MiddlewareChain } from '@agentforge/core';

const enhancedNode = new MiddlewareChain()
  .use((node) => withLogging({ name: 'search' })(node))
  .use((node) => withValidation(node, { inputSchema: schema }))
  .use((node) => withCache(node, { ttl: 3600000 }))
  .use((node) => withRetry(node, { maxAttempts: 3 }))
  .build(myNode);
```

### Conditional Middleware

Apply middleware based on conditions:

```typescript
const enhancedNode = new MiddlewareChain()
  .use((node) => withLogging({ name: 'search' })(node))
  .useIf(
    process.env.NODE_ENV === 'production',
    (node) => withCache(node, { ttl: 3600000 })
  )
  .useIf(
    process.env.ENABLE_METRICS === 'true',
    (node) => withMetrics(node, { name: 'search' })
  )
  .build(myNode);
```

## Middleware Presets

Pre-configured middleware stacks for common scenarios.

### Production Preset

Optimized for production with comprehensive error handling:

```typescript
import { production } from '@agentforge/core';

const productionNode = production(myNode, {
  nodeName: 'search-node',
  enableMetrics: true,
  enableTracing: true,
  enableRetry: true,
  timeout: 30000,
  retryOptions: { maxAttempts: 3 }
});
```

**Includes:**
- ✅ Logging (info level)
- ✅ Metrics tracking
- ✅ Timeout protection (30s)
- ✅ Retry logic (3 attempts)
- ✅ Error handling
- ✅ Distributed tracing

### Development Preset

Optimized for development with verbose logging:

```typescript
import { development } from '@agentforge/core';

const devNode = development(myNode, {
  nodeName: 'search-node',
  verbose: true
});
```

**Includes:**
- ✅ Verbose logging (debug level)
- ✅ Input/output logging
- ✅ Error details
- ✅ Performance timing

### Testing Preset

Optimized for testing with mocks and tracking:

```typescript
import { testing } from '@agentforge/core';

const testNode = testing(myNode, {
  nodeName: 'search-node',
  mockResponse: { results: ['mocked'] },
  trackInvocations: true,
  simulateError: false,
});

// Access invocations
console.log(testNode.invocations);
```

## Custom Middleware

Create your own middleware:

```typescript
import { Middleware, NodeFunction } from '@agentforge/core';

interface TimingOptions {
  name: string;
  threshold?: number; // Warn if execution exceeds this
}

export const withTiming: Middleware<any, TimingOptions> = (node, options) => {
  return async (state) => {
    const start = Date.now();

    try {
      const result = await node(state);
      const duration = Date.now() - start;

      console.log(`[${options.name}] Executed in ${duration}ms`);

      if (options.threshold && duration > options.threshold) {
        console.warn(`[${options.name}] Slow execution: ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[${options.name}] Failed after ${duration}ms`);
      throw error;
    }
  };
};

// Use it
const timedNode = withTiming(myNode, {
  name: 'search',
  threshold: 1000, // Warn if > 1s
});
```

## Best Practices

### 1. Order Matters

Place middleware in the right order:

```typescript
// ✅ Good - logging outermost for visibility
compose(
  (node) => withLogging({ name: 'node' })(node),      // 1. Log everything
  (node) => withErrorHandler(node, { ... }),          // 2. Handle errors
  (node) => withRetry(node, { maxAttempts: 3 }),      // 3. Retry on failure
  (node) => withValidation(node, { inputSchema }),    // 4. Validate input
  (node) => withCache(node, { ttl: 3600 }),           // 5. Cache results
)(myNode);

// ❌ Bad - cache before validation
compose(
  (node) => withCache(node, { ttl: 3600 }),           // Caches invalid inputs!
  (node) => withValidation(node, { inputSchema }),
)(myNode);
```

### 2. Use Presets for Common Scenarios

Don't reinvent the wheel:

```typescript
// ✅ Good - use preset
const node = production(myNode, { nodeName: 'search' });

// ❌ Bad - manual composition of common stack
const node = compose(
  (node) => withLogging({ ... })(node),
  (node) => withMetrics(node, { ... }),
  (node) => withRetry(node, { ... }),
  (node) => withTimeout(node, { ... }),
  (node) => withErrorHandler(node, { ... }),
)(myNode);
```

### 3. Keep Middleware Focused

Each middleware should do one thing well:

```typescript
// ✅ Good - focused middleware
const withLogging = (node, options) => { /* just logging */ };
const withMetrics = (node, options) => { /* just metrics */ };

// ❌ Bad - does too much
const withLoggingAndMetricsAndRetry = (node, options) => { /* ... */ };
```

### 4. Make Middleware Configurable

Provide sensible defaults but allow customization:

```typescript
export const withCache: Middleware<any, CacheOptions> = (node, options = {}) => {
  const {
    ttl = 3600000,           // Default 1 hour
    maxSize = 100,           // Default 100 entries
    evictionStrategy = 'lru', // Default LRU
    keyGenerator = (state) => JSON.stringify(state),
  } = options;

  // Implementation...
};
```

### 5. Handle Errors Gracefully

Middleware should not crash the application:

```typescript
export const withSafeMiddleware: Middleware<any> = (node, options) => {
  return async (state) => {
    try {
      // Middleware logic
      return await node(state);
    } catch (error) {
      console.error('Middleware error:', error);
      // Decide: rethrow, return fallback, or continue
      throw error;
    }
  };
};
```

## Common Patterns

### Pattern 1: API Client

```typescript
const apiClient = compose(
  (node) => withTimeout(node, { timeout: 10000 }),
  (node) => withRetry(node, { maxAttempts: 3, backoff: 'exponential' }),
  (node) => withRateLimit(node, { maxRequests: 100, windowMs: 60000 }),
  (node) => withCache(node, { ttl: 300000 }),
)(fetchData);
```

### Pattern 2: Database Query

```typescript
const dbQuery = compose(
  (node) => withLogging({ name: 'db-query', level: 'debug' })(node),
  (node) => withMetrics(node, { name: 'db-query' }),
  (node) => withTimeout(node, { timeout: 5000 }),
  (node) => withRetry(node, { maxAttempts: 2 }),
  (node) => withCache(node, { ttl: 60000 }),
)(executeQuery);
```

### Pattern 3: LLM Call

```typescript
const llmCall = compose(
  (node) => withLogging({ name: 'llm', level: 'info' })(node),
  (node) => withMetrics(node, { name: 'llm' }),
  (node) => withTimeout(node, { timeout: 30000 }),
  (node) => withRetry(node, { maxAttempts: 2, retryIf: (e) => e.code === 'RATE_LIMIT' }),
  (node) => withRateLimit(node, { maxRequests: 10, windowMs: 60000 }),
)(callLLM);
```

## Next Steps

- [API Reference](/api/core#middleware) - Complete middleware API
- [Middleware Examples](/examples/middleware) - Working examples
- [Testing Strategies](/tutorials/testing) - Testing with middleware
- [Advanced Patterns](/tutorials/advanced-patterns) - Combining middleware with patterns


