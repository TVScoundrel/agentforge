# Middleware

Middleware are composable functions that wrap agent nodes to add cross-cutting concerns like logging, caching, validation, and error handling. They enable you to enhance agent behavior without modifying core logic.

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
import { withCache } from '@agentforge/core/middleware';

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
import { withRateLimit } from '@agentforge/core/middleware';

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
import { withValidation } from '@agentforge/core/middleware';
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
import { withRetry } from '@agentforge/core/middleware';

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
import { withTimeout } from '@agentforge/core/middleware';

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
import { withLogging } from '@agentforge/core/middleware';

const loggedNode = withLogging(myNode, {
  name: 'search-node',
  level: 'info', // 'debug' | 'info' | 'warn' | 'error'
  logInput: true,
  logOutput: true,
  logDuration: true,
  logErrors: true,
});
```

### Error Handling

Graceful error handling with fallbacks:

```typescript
import { withErrorHandler } from '@agentforge/core/middleware';

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
import { withMetrics } from '@agentforge/core/middleware';

const monitoredNode = withMetrics(myNode, {
  name: 'search-node',
  onMetric: (metric) => {
    console.log(`${metric.name}: ${metric.duration}ms`);
  },
});
```

### Tracing

Distributed tracing support:

```typescript
import { withTracing } from '@agentforge/core/middleware';

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
import { withConcurrencyLimit } from '@agentforge/core/middleware';

const throttledNode = withConcurrencyLimit(myNode, {
  maxConcurrent: 5, // Max 5 concurrent executions
  queueSize: 100, // Max 100 queued requests
  timeout: 30000, // Queue timeout
});
```

## Composing Middleware

### Using `compose()`

Apply multiple middleware to a node:

```typescript
import { compose, withCache, withValidation, withLogging } from '@agentforge/core/middleware';
import { z } from 'zod';

const schema = z.object({ query: z.string() });

const enhancedNode = compose(
  withLogging({ name: 'search', level: 'info' }),
  withValidation({ inputSchema: schema }),
  withCache({ ttl: 3600000 }),
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
import { MiddlewareChain } from '@agentforge/core/middleware';

const enhancedNode = new MiddlewareChain()
  .use(withLogging({ name: 'search' }))
  .use(withValidation({ inputSchema: schema }))
  .use(withCache({ ttl: 3600000 }))
  .use(withRetry({ maxAttempts: 3 }))
  .build(myNode);
```

### Conditional Middleware

Apply middleware based on conditions:

```typescript
const enhancedNode = new MiddlewareChain()
  .use(withLogging({ name: 'search' }))
  .useIf(
    process.env.NODE_ENV === 'production',
    withCache({ ttl: 3600000 })
  )
  .useIf(
    process.env.ENABLE_METRICS === 'true',
    withMetrics({ name: 'search' })
  )
  .build(myNode);
```

## Middleware Presets

Pre-configured middleware stacks for common scenarios.

### Production Preset

Optimized for production with comprehensive error handling:

```typescript
import { productionPreset } from '@agentforge/core/middleware';

const productionNode = productionPreset(myNode, {
  nodeName: 'search-node',
  cache: { ttl: 3600000 },
  rateLimit: { maxRequests: 100, windowMs: 60000 },
  retry: { maxAttempts: 3 },
  timeout: { timeout: 30000 },
  logging: { level: 'info' },
  metrics: { enabled: true },
});
```

**Includes:**
- ✅ Logging (info level)
- ✅ Metrics tracking
- ✅ Timeout protection (30s)
- ✅ Retry logic (3 attempts)
- ✅ Error handling
- ✅ Rate limiting (optional)
- ✅ Caching (optional)

### Development Preset

Optimized for development with verbose logging:

```typescript
import { developmentPreset } from '@agentforge/core/middleware';

const devNode = developmentPreset(myNode, {
  nodeName: 'search-node',
  logging: { level: 'debug' },
  tracing: { enabled: true },
  validation: { inputSchema, outputSchema },
});
```

**Includes:**
- ✅ Verbose logging (debug level)
- ✅ Distributed tracing
- ✅ Input/output validation
- ✅ Error details
- ✅ Performance timing

### Testing Preset

Optimized for testing with mocks and tracking:

```typescript
import { testingPreset } from '@agentforge/core/middleware';

const testNode = testingPreset(myNode, {
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
import { Middleware, NodeFunction } from '@agentforge/core/middleware';

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
  withLogging({ name: 'node' }),      // 1. Log everything
  withErrorHandler({ ... }),          // 2. Handle errors
  withRetry({ maxAttempts: 3 }),      // 3. Retry on failure
  withValidation({ inputSchema }),    // 4. Validate input
  withCache({ ttl: 3600 }),           // 5. Cache results
)(myNode);

// ❌ Bad - cache before validation
compose(
  withCache({ ttl: 3600 }),           // Caches invalid inputs!
  withValidation({ inputSchema }),
)(myNode);
```

### 2. Use Presets for Common Scenarios

Don't reinvent the wheel:

```typescript
// ✅ Good - use preset
const node = productionPreset(myNode, { nodeName: 'search' });

// ❌ Bad - manual composition of common stack
const node = compose(
  withLogging({ ... }),
  withMetrics({ ... }),
  withRetry({ ... }),
  withTimeout({ ... }),
  withErrorHandler({ ... }),
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
  withTimeout({ timeout: 10000 }),
  withRetry({ maxAttempts: 3, backoff: 'exponential' }),
  withRateLimit({ maxRequests: 100, windowMs: 60000 }),
  withCache({ ttl: 300000 }),
)(fetchData);
```

### Pattern 2: Database Query

```typescript
const dbQuery = compose(
  withLogging({ name: 'db-query', level: 'debug' }),
  withMetrics({ name: 'db-query' }),
  withTimeout({ timeout: 5000 }),
  withRetry({ maxAttempts: 2 }),
  withCache({ ttl: 60000 }),
)(executeQuery);
```

### Pattern 3: LLM Call

```typescript
const llmCall = compose(
  withLogging({ name: 'llm', level: 'info' }),
  withMetrics({ name: 'llm' }),
  withTimeout({ timeout: 30000 }),
  withRetry({ maxAttempts: 2, retryIf: (e) => e.code === 'RATE_LIMIT' }),
  withRateLimit({ maxRequests: 10, windowMs: 60000 }),
)(callLLM);
```

## Next Steps

- [API Reference](/api/core#middleware) - Complete middleware API
- [Custom Middleware Tutorial](/tutorials/custom-middleware) - Build your own
- [Middleware Examples](/examples/middleware) - Working examples
- [Testing Guide](/guide/testing) - Testing with middleware


