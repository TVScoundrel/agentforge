# Middleware Guide

> Comprehensive guide to using middleware in AgentForge

## Table of Contents

- [Introduction](#introduction)
- [Core Concepts](#core-concepts)
- [Built-in Middleware](#built-in-middleware)
- [Composition](#composition)
- [Presets](#presets)
- [Creating Custom Middleware](#creating-custom-middleware)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Introduction

Middleware in AgentForge provides a powerful way to add cross-cutting concerns to your LangGraph nodes. Middleware can:

- **Cache** expensive operations
- **Validate** inputs and outputs
- **Rate limit** API calls
- **Control concurrency** for resource management
- **Log** execution details
- **Trace** operations for debugging
- **Retry** failed operations
- **Handle errors** gracefully
- **Measure** performance metrics
- **Set timeouts** for long-running operations

## Core Concepts

### What is Middleware?

Middleware is a function that wraps a node function to add additional behavior. It follows this pattern:

```typescript
type Middleware<State, Options> = (
  node: NodeFunction<State>,
  options: Options
) => NodeFunction<State>;
```

### Middleware Execution Order

Middleware executes in a nested fashion, like an onion:

```
Request → Middleware 1 → Middleware 2 → Node → Middleware 2 → Middleware 1 → Response
```

The first middleware in the chain is the outermost layer.

### Node Functions

A node function is the basic unit that middleware wraps:

```typescript
type NodeFunction<State> = (state: State) => Promise<State | Partial<State>>;
```

## Built-in Middleware

AgentForge provides several production-ready middleware implementations:

### Caching Middleware

Cache node results to avoid redundant computations.

```typescript
import { withCache } from '@agentforge/core/middleware';

const cachedNode = withCache(myNode, {
  ttl: 3600000, // 1 hour
  maxSize: 100,
  evictionStrategy: 'lru',
  keyGenerator: (state) => JSON.stringify(state),
});
```

**Options**:
- `ttl`: Time to live in milliseconds (default: 1 hour)
- `maxSize`: Maximum cache entries (default: 100)
- `evictionStrategy`: 'lru', 'fifo', or 'lfu' (default: 'lru')
- `keyGenerator`: Function to generate cache keys
- `cacheErrors`: Whether to cache error results (default: false)
- `onCacheHit`: Callback when cache hit occurs
- `onCacheMiss`: Callback when cache miss occurs
- `onEviction`: Callback when entry is evicted

**Shared Cache**:

```typescript
import { createSharedCache } from '@agentforge/core/middleware';

const cache = createSharedCache({ ttl: 3600000 });

const node1 = cache.withCache(myNode1);
const node2 = cache.withCache(myNode2);
// Both nodes share the same cache
```

### Rate Limiting Middleware

Control the rate of node execution to prevent overwhelming external services.

```typescript
import { withRateLimit } from '@agentforge/core/middleware';

const rateLimitedNode = withRateLimit(myNode, {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  strategy: 'token-bucket',
});
```

**Options**:
- `maxRequests`: Maximum requests per window
- `windowMs`: Time window in milliseconds
- `strategy`: 'token-bucket', 'sliding-window', or 'fixed-window'
- `keyGenerator`: Function to generate rate limit keys (for per-user limits)
- `onRateLimitExceeded`: Callback when rate limit is exceeded
- `onRateLimitReset`: Callback when rate limit resets

**Strategies**:
- **Token Bucket**: Smooth rate limiting with burst capacity
- **Sliding Window**: Precise rate limiting over rolling time window
- **Fixed Window**: Simple rate limiting with periodic reset

**Shared Rate Limiter**:

```typescript
import { createSharedRateLimiter } from '@agentforge/core/middleware';

const limiter = createSharedRateLimiter({
  maxRequests: 100,
  windowMs: 60000,
});

const node1 = limiter.withRateLimit(myNode1);
const node2 = limiter.withRateLimit(myNode2);
// Both nodes share the same rate limiter
```

### Validation Middleware

Validate node inputs and outputs using Zod schemas or custom validators.

```typescript
import { withValidation } from '@agentforge/core/middleware';
import { z } from 'zod';

const inputSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().int().positive().optional(),
}).strict();

const validatedNode = withValidation(myNode, {
  inputSchema,
  mode: 'input',
  throwOnError: true,
});
```

**Options**:
- `inputSchema`: Zod schema for input validation
- `outputSchema`: Zod schema for output validation
- `inputValidator`: Custom validation function for input
- `outputValidator`: Custom validation function for output
- `mode`: 'input', 'output', or 'both' (default: 'both')
- `throwOnError`: Whether to throw on validation error (default: true)
- `onValidationError`: Callback when validation fails
- `onValidationSuccess`: Callback when validation succeeds
- `stripUnknown`: Strip unknown properties (default: false)

**Custom Validator**:

```typescript
const validatedNode = withValidation(myNode, {
  inputValidator: async (state) => {
    return state.query && state.query.length > 0;
  },
  throwOnError: true,
});
```

### Concurrency Control Middleware

Limit the number of concurrent executions to manage resources.

```typescript
import { withConcurrency } from '@agentforge/core/middleware';

const concurrentNode = withConcurrency(myNode, {
  maxConcurrent: 5,
  queueSize: 100,
  priority: 'normal',
});
```

**Options**:
- `maxConcurrent`: Maximum concurrent executions (default: 10)
- `queueSize`: Maximum queue size (default: Infinity)
- `priority`: 'high', 'normal', or 'low' (default: 'normal')
- `timeout`: Queue timeout in milliseconds
- `onQueued`: Callback when execution is queued
- `onExecutionStart`: Callback when execution starts
- `onExecutionEnd`: Callback when execution ends

**Shared Concurrency Controller**:

```typescript
import { createSharedConcurrencyController } from '@agentforge/core/middleware';

const controller = createSharedConcurrencyController({
  maxConcurrent: 5,
});

const node1 = controller.withConcurrency(myNode1);
const node2 = controller.withConcurrency(myNode2);
// Both nodes share the same concurrency limit
```

### Logging Middleware

Add structured logging to your nodes.

```typescript
import { withLogging } from '@agentforge/core/middleware';

const loggedNode = withLogging({
  name: 'my-node',
  level: 'info',
  logInput: true,
  logOutput: true,
  logDuration: true,
  logErrors: true,
});
```

**Options**:
- `name`: Node name for logging
- `level`: Log level ('debug', 'info', 'warn', 'error')
- `logger`: Custom logger instance
- `logInput`: Log input state (default: true)
- `logOutput`: Log output state (default: true)
- `logDuration`: Log execution duration (default: true)
- `logErrors`: Log errors (default: true)
- `extractData`: Function to extract data for logging
- `onStart`: Callback when execution starts
- `onComplete`: Callback when execution completes
- `onError`: Callback when error occurs

### Retry Middleware

Automatically retry failed operations with configurable backoff.

```typescript
import { withRetry } from '@agentforge/core/middleware';

const retriedNode = withRetry(myNode, {
  maxAttempts: 3,
  backoff: 'exponential',
  initialDelay: 1000,
  maxDelay: 10000,
});
```

**Options**:
- `maxAttempts`: Maximum retry attempts (default: 3)
- `backoff`: 'exponential', 'linear', or 'constant'
- `initialDelay`: Initial delay in milliseconds (default: 1000)
- `maxDelay`: Maximum delay in milliseconds
- `shouldRetry`: Function to determine if error should be retried
- `onRetry`: Callback when retry occurs

### Error Handling Middleware

Handle errors gracefully with custom error handlers.

```typescript
import { withErrorHandler } from '@agentforge/core/middleware';

const errorHandledNode = withErrorHandler(myNode, {
  onError: (error, state) => {
    console.error('Node failed:', error);
    return { ...state, error: error.message };
  },
  rethrow: false,
});
```

**Options**:
- `onError`: Error handler function
- `rethrow`: Whether to rethrow after handling (default: false)
- `transformError`: Function to transform error before handling

### Timeout Middleware

Set execution timeouts for long-running operations.

```typescript
import { withTimeout } from '@agentforge/core/middleware';

const timedNode = withTimeout(myNode, {
  timeout: 30000, // 30 seconds
  onTimeout: (state) => {
    return { ...state, timedOut: true };
  },
});
```

**Options**:
- `timeout`: Timeout in milliseconds (default: 30000)
- `onTimeout`: Callback when timeout occurs

### Metrics Middleware

Collect performance metrics for your nodes.

```typescript
import { withMetrics } from '@agentforge/core/middleware';

const metricNode = withMetrics(myNode, {
  name: 'my-node',
  trackDuration: true,
  trackErrors: true,
  trackInvocations: true,
});
```

**Options**:
- `name`: Metric name
- `trackDuration`: Track execution duration (default: true)
- `trackErrors`: Track error count (default: true)
- `trackInvocations`: Track invocation count (default: true)
- `onMetric`: Callback when metric is recorded

### Tracing Middleware

Add distributed tracing to your nodes.

```typescript
import { withTracing } from '@agentforge/core/middleware';

const tracedNode = withTracing(myNode, {
  name: 'my-node',
  metadata: { version: '1.0' },
});
```

**Options**:
- `name`: Trace name
- `metadata`: Additional metadata for trace
- `onSpanStart`: Callback when span starts
- `onSpanEnd`: Callback when span ends

## Composition

### Using `compose()`

The `compose()` function allows you to apply multiple middleware to a node:

```typescript
import { compose, withCache, withValidation, withLogging } from '@agentforge/core/middleware';
import { z } from 'zod';

const schema = z.object({ query: z.string() }).strict();

const enhancedNode = compose(
  withLogging({ name: 'search' }),
  withValidation({ inputSchema: schema }),
  withCache({ ttl: 3600000 }),
  myNode
);
```

**Execution Order**: Middleware are applied from left to right, so logging happens first, then validation, then caching, then the node.

### Using `MiddlewareChain`

For a more fluent API, use `MiddlewareChain`:

```typescript
import { MiddlewareChain, withCache, withValidation, withLogging } from '@agentforge/core/middleware';
import { z } from 'zod';

const schema = z.object({ query: z.string() }).strict();

const enhancedNode = new MiddlewareChain()
  .use(withLogging({ name: 'search' }))
  .use(withValidation({ inputSchema: schema }))
  .use(withCache({ ttl: 3600000 }))
  .build(myNode);
```

### Middleware Context

Middleware can share data through the middleware context:

```typescript
import { compose, createMiddleware } from '@agentforge/core/middleware';

const authMiddleware = createMiddleware<State>((node) => {
  return async (state, context) => {
    context.set('userId', state.userId);
    return node(state, context);
  };
});

const loggingMiddleware = createMiddleware<State>((node) => {
  return async (state, context) => {
    const userId = context.get('userId');
    console.log(`User ${userId} executing node`);
    return node(state, context);
  };
});

const enhancedNode = compose(
  authMiddleware,
  loggingMiddleware,
  myNode
);
```

## Presets

AgentForge provides pre-configured middleware stacks for common scenarios.

### Production Preset

Optimized for production with caching, rate limiting, retries, and error handling:

```typescript
import { productionPreset } from '@agentforge/core/middleware';

const productionNode = productionPreset(myNode, {
  cache: { ttl: 3600000 },
  rateLimit: { maxRequests: 100, windowMs: 60000 },
  retry: { maxAttempts: 3 },
  timeout: { timeout: 30000 },
  logging: { name: 'my-node', level: 'info' },
  metrics: { name: 'my-node' },
});
```

**Included Middleware**:
- Logging (info level)
- Metrics tracking
- Timeout (30s default)
- Retry (3 attempts with exponential backoff)
- Error handling (logs and rethrows)
- Rate limiting (optional)
- Caching (optional)

### Development Preset

Optimized for development with verbose logging and debugging:

```typescript
import { developmentPreset } from '@agentforge/core/middleware';

const devNode = developmentPreset(myNode, {
  logging: { name: 'my-node', level: 'debug' },
  tracing: { name: 'my-node' },
  validation: { inputSchema, outputSchema },
});
```

**Included Middleware**:
- Logging (debug level with full state)
- Tracing (with detailed spans)
- Validation (optional, strict mode)
- Error handling (detailed error messages)

### Testing Preset

Optimized for testing with mocking and tracking:

```typescript
import { testingPreset } from '@agentforge/core/middleware';

const testNode = testingPreset(myNode, {
  mock: { response: { result: 'mocked' } },
  track: true,
});

// Execute
await testNode(state);

// Check invocations
console.log(testNode.invocations); // Array of { input, output, duration }
```

**Included Middleware**:
- Mock responses (optional)
- Invocation tracking
- Error simulation (optional)
- Deterministic behavior

## Creating Custom Middleware

### Basic Middleware

Create a simple middleware function:

```typescript
import { Middleware, NodeFunction } from '@agentforge/core/middleware';

function withCustomBehavior<State>(
  node: NodeFunction<State>,
  options: { prefix: string }
): NodeFunction<State> {
  return async (state) => {
    console.log(`${options.prefix}: Starting`);
    const result = await node(state);
    console.log(`${options.prefix}: Complete`);
    return result;
  };
}
```

### Middleware with Context

Use middleware context to share data:

```typescript
import { createMiddleware } from '@agentforge/core/middleware';

const withTiming = createMiddleware<State>((node) => {
  return async (state, context) => {
    const start = Date.now();
    const result = await node(state, context);
    const duration = Date.now() - start;
    context.set('duration', duration);
    return result;
  };
});
```

### Middleware Factory

Create a factory for configurable middleware:

```typescript
interface CustomOptions {
  enabled: boolean;
  callback?: (state: any) => void;
}

function createCustomMiddleware<State>(options: CustomOptions) {
  return (node: NodeFunction<State>): NodeFunction<State> => {
    if (!options.enabled) {
      return node;
    }

    return async (state) => {
      options.callback?.(state);
      return node(state);
    };
  };
}

// Usage
const middleware = createCustomMiddleware({ enabled: true });
const enhancedNode = middleware(myNode);
```

## Best Practices

### 1. Order Matters

Place middleware in the correct order for optimal behavior:

```typescript
// ✅ Good: Logging → Validation → Cache → Rate Limit → Node
const node = compose(
  withLogging({ name: 'search' }),
  withValidation({ inputSchema }),
  withCache({ ttl: 3600000 }),
  withRateLimit({ maxRequests: 100 }),
  myNode
);

// ❌ Bad: Cache before validation (caches invalid inputs)
const node = compose(
  withCache({ ttl: 3600000 }),
  withValidation({ inputSchema }),
  myNode
);
```

**Recommended Order**:
1. Logging/Tracing (outermost)
2. Metrics
3. Timeout
4. Validation
5. Caching
6. Rate Limiting
7. Concurrency Control
8. Retry
9. Error Handling (innermost)

### 2. Use Shared Resources

Share caches, rate limiters, and concurrency controllers across nodes:

```typescript
// ✅ Good: Shared cache across related nodes
const cache = createSharedCache({ ttl: 3600000 });
const node1 = cache.withCache(searchNode);
const node2 = cache.withCache(fetchNode);

// ❌ Bad: Separate caches (wastes memory)
const node1 = withCache(searchNode, { ttl: 3600000 });
const node2 = withCache(fetchNode, { ttl: 3600000 });
```

### 3. Use Presets for Common Patterns

Start with presets and customize as needed:

```typescript
// ✅ Good: Use preset as base
const node = productionPreset(myNode, {
  cache: { ttl: 3600000 },
  rateLimit: { maxRequests: 100 },
});

// ❌ Bad: Manually compose everything
const node = compose(
  withLogging({ name: 'node', level: 'info' }),
  withMetrics({ name: 'node' }),
  withTimeout({ timeout: 30000 }),
  withRetry({ maxAttempts: 3 }),
  withErrorHandler({ rethrow: true }),
  myNode
);
```

### 4. Validate Early

Validate inputs before expensive operations:

```typescript
// ✅ Good: Validate before cache/rate limit
const node = compose(
  withValidation({ inputSchema }),
  withCache({ ttl: 3600000 }),
  withRateLimit({ maxRequests: 100 }),
  expensiveNode
);
```

### 5. Handle Errors Gracefully

Always include error handling in production:

```typescript
// ✅ Good: Error handling with fallback
const node = compose(
  withErrorHandler({
    onError: (error, state) => ({
      ...state,
      error: error.message,
      fallback: true,
    }),
    rethrow: false,
  }),
  myNode
);
```

### 6. Use Appropriate Cache Keys

Generate cache keys that capture all relevant state:

```typescript
// ✅ Good: Include all relevant fields
const node = withCache(myNode, {
  keyGenerator: (state) =>
    `${state.userId}:${state.query}:${state.filters}`,
});

// ❌ Bad: Missing important fields
const node = withCache(myNode, {
  keyGenerator: (state) => state.query,
});
```

### 7. Set Reasonable Timeouts

Set timeouts based on expected execution time:

```typescript
// ✅ Good: Appropriate timeout for operation
const quickNode = withTimeout(fastOperation, { timeout: 5000 });
const slowNode = withTimeout(slowOperation, { timeout: 60000 });

// ❌ Bad: Same timeout for all operations
const node1 = withTimeout(fastOperation, { timeout: 30000 });
const node2 = withTimeout(slowOperation, { timeout: 30000 });
```

### 8. Monitor and Measure

Always include metrics in production:

```typescript
// ✅ Good: Track metrics for monitoring
const node = compose(
  withMetrics({ name: 'search-node' }),
  withLogging({ name: 'search-node' }),
  myNode
);
```

## Examples

### Example 1: API Client Node

```typescript
import { compose, withCache, withRateLimit, withRetry, withTimeout } from '@agentforge/core/middleware';

interface APIState {
  endpoint: string;
  params: Record<string, any>;
  response?: any;
}

async function apiClient(state: APIState): Promise<APIState> {
  const response = await fetch(state.endpoint, {
    method: 'POST',
    body: JSON.stringify(state.params),
  });
  return { ...state, response: await response.json() };
}

const enhancedAPIClient = compose(
  withTimeout({ timeout: 10000 }),
  withRetry({ maxAttempts: 3, backoff: 'exponential' }),
  withRateLimit({ maxRequests: 100, windowMs: 60000 }),
  withCache({ ttl: 300000, keyGenerator: (s) => `${s.endpoint}:${JSON.stringify(s.params)}` }),
  apiClient
);
```

### Example 2: Database Query Node

```typescript
import { compose, withCache, withConcurrency, withMetrics, withLogging } from '@agentforge/core/middleware';
import { z } from 'zod';

interface DBState {
  query: string;
  params: any[];
  results?: any[];
}

const querySchema = z.object({
  query: z.string().min(1),
  params: z.array(z.any()),
}).strict();

async function dbQuery(state: DBState): Promise<DBState> {
  const results = await db.query(state.query, state.params);
  return { ...state, results };
}

const enhancedDBQuery = compose(
  withLogging({ name: 'db-query', level: 'info' }),
  withMetrics({ name: 'db-query' }),
  withValidation({ inputSchema: querySchema }),
  withConcurrency({ maxConcurrent: 10 }),
  withCache({ ttl: 60000, keyGenerator: (s) => `${s.query}:${JSON.stringify(s.params)}` }),
  dbQuery
);
```

### Example 3: LLM Node with Full Stack

```typescript
import { productionPreset } from '@agentforge/core/middleware';
import { z } from 'zod';

interface LLMState {
  prompt: string;
  model: string;
  response?: string;
}

const inputSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.enum(['gpt-4', 'gpt-3.5-turbo']),
}).strict();

async function llmNode(state: LLMState): Promise<LLMState> {
  const response = await openai.chat.completions.create({
    model: state.model,
    messages: [{ role: 'user', content: state.prompt }],
  });
  return { ...state, response: response.choices[0].message.content };
}

const productionLLMNode = productionPreset(llmNode, {
  logging: { name: 'llm-node', level: 'info' },
  metrics: { name: 'llm-node' },
  timeout: { timeout: 30000 },
  retry: { maxAttempts: 3, backoff: 'exponential' },
  rateLimit: { maxRequests: 50, windowMs: 60000 },
  cache: { ttl: 3600000, keyGenerator: (s) => `${s.model}:${s.prompt}` },
  validation: { inputSchema, mode: 'input' },
});
```

### Example 4: Testing with Mocks

```typescript
import { testingPreset } from '@agentforge/core/middleware';

const mockNode = testingPreset(myNode, {
  mock: { response: { result: 'test-result' } },
  track: true,
});

// Test
const result = await mockNode({ input: 'test' });
expect(result.result).toBe('test-result');
expect(mockNode.invocations).toHaveLength(1);
expect(mockNode.invocations[0].input).toEqual({ input: 'test' });
```

## Summary

Middleware in AgentForge provides a powerful, composable way to add cross-cutting concerns to your LangGraph nodes. Key takeaways:

- **Use built-in middleware** for common patterns (caching, rate limiting, validation, etc.)
- **Compose middleware** in the correct order for optimal behavior
- **Share resources** (caches, rate limiters) across nodes
- **Use presets** for common scenarios (production, development, testing)
- **Create custom middleware** when needed
- **Follow best practices** for production-ready applications

For more details, see:
- [API Documentation](../api/middleware.md)
- [Best Practices Guide](./middleware-best-practices.md)
- [Phase 4 Complete](../PHASE_4_COMPLETE.md)
```

