# Middleware API Reference

> Complete API reference for AgentForge middleware system

## Table of Contents

- [Core Types](#core-types)
- [Composition Functions](#composition-functions)
- [Built-in Middleware](#built-in-middleware)
- [Presets](#presets)
- [Utilities](#utilities)

## Core Types

### `NodeFunction<State>`

The basic unit that middleware wraps.

```typescript
type NodeFunction<State> = (
  state: State,
  context?: MiddlewareContext
) => Promise<State | Partial<State>>;
```

**Parameters**:
- `state`: The current state
- `context`: Optional middleware context for sharing data

**Returns**: Promise resolving to new state or partial state update

### `Middleware<State, Options>`

A function that wraps a node to add behavior.

```typescript
type Middleware<State, Options = any> = (
  node: NodeFunction<State>,
  options?: Options
) => NodeFunction<State>;
```

**Parameters**:
- `node`: The node function to wrap
- `options`: Configuration options for the middleware

**Returns**: Enhanced node function

### `MiddlewareContext`

Context object for sharing data between middleware.

```typescript
interface MiddlewareContext {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
}
```

**Methods**:
- `get<T>(key: string)`: Get value by key
- `set<T>(key, value)`: Set value by key
- `has(key)`: Check if key exists
- `delete(key)`: Delete key
- `clear()`: Clear all data

## Composition Functions

### `compose()`

Compose multiple middleware with a node.

```typescript
function compose<State>(
  ...middlewareAndNode: [...Middleware<State>[], NodeFunction<State>]
): NodeFunction<State>;
```

**Parameters**:
- `...middlewareAndNode`: Middleware functions followed by the node function

**Returns**: Composed node function

**Example**:
```typescript
const node = compose(
  withLogging({ name: 'my-node' }),
  withCache({ ttl: 3600000 }),
  myNode
);
```

### `chain()`

Alias for `compose()`.

```typescript
const chain = compose;
```

## Built-in Middleware

### `withCache()`

Add caching to a node.

```typescript
function withCache<State>(
  node: NodeFunction<State>,
  options?: CacheOptions
): NodeFunction<State>;
```

**Options**:
```typescript
interface CacheOptions {
  ttl?: number;                    // Time to live in ms (default: 3600000)
  maxSize?: number;                // Max cache entries (default: 100)
  evictionStrategy?: 'lru' | 'fifo' | 'lfu';  // Default: 'lru'
  keyGenerator?: (state: any) => string;      // Custom key generator
  cacheErrors?: boolean;           // Cache error results (default: false)
  onCacheHit?: (key: string) => void;
  onCacheMiss?: (key: string) => void;
  onEviction?: (key: string, value: any) => void;
}
```

**Returns**: Cached node function

**Example**:
```typescript
const cachedNode = withCache(myNode, {
  ttl: 3600000,
  maxSize: 100,
  keyGenerator: (state) => JSON.stringify(state),
});
```

### `withRateLimit()`

Add rate limiting to a node.

```typescript
function withRateLimit<State>(
  node: NodeFunction<State>,
  options?: RateLimitOptions
): NodeFunction<State>;
```

**Options**:
```typescript
interface RateLimitOptions {
  maxRequests: number;             // Max requests per window
  windowMs: number;                // Time window in ms
  strategy?: 'token-bucket' | 'sliding-window' | 'fixed-window';
  keyGenerator?: (state: any) => string;  // For per-user limits
  onRateLimitExceeded?: (key: string) => void;
  onRateLimitReset?: (key: string) => void;
}
```

**Returns**: Rate-limited node function

**Example**:
```typescript
const limitedNode = withRateLimit(myNode, {
  maxRequests: 100,
  windowMs: 60000,
  strategy: 'token-bucket',
});
```

### `withValidation()`

Add input/output validation to a node.

```typescript
function withValidation<State>(
  node: NodeFunction<State>,
  options?: ValidationOptions
): NodeFunction<State>;
```

**Options**:
```typescript
interface ValidationOptions {
  inputSchema?: z.ZodSchema;       // Zod schema for input
  outputSchema?: z.ZodSchema;      // Zod schema for output
  inputValidator?: (state: any) => Promise<boolean> | boolean;
  outputValidator?: (state: any) => Promise<boolean> | boolean;
  mode?: 'input' | 'output' | 'both';  // Default: 'both'
  throwOnError?: boolean;          // Default: true
  onValidationError?: (error: Error, state: any) => void;
  onValidationSuccess?: (state: any) => void;
  stripUnknown?: boolean;          // Default: false
}
```

**Returns**: Validated node function

**Example**:
```typescript
import { z } from 'zod';

const schema = z.object({
  query: z.string().min(1),
}).strict();

const validatedNode = withValidation(myNode, {
  inputSchema: schema,
  mode: 'input',
});
```

### `withConcurrency()`

Add concurrency control to a node.

```typescript
function withConcurrency<State>(
  node: NodeFunction<State>,
  options?: ConcurrencyOptions
): NodeFunction<State>;
```

**Options**:
```typescript
interface ConcurrencyOptions {
  maxConcurrent?: number;          // Max concurrent executions (default: 10)
  queueSize?: number;              // Max queue size (default: Infinity)
  priority?: 'high' | 'normal' | 'low';  // Default: 'normal'
  timeout?: number;                // Queue timeout in ms
  onQueued?: (state: any) => void;
  onExecutionStart?: (state: any) => void;
  onExecutionEnd?: (state: any) => void;
}
```

**Returns**: Concurrency-controlled node function

**Example**:
```typescript
const concurrentNode = withConcurrency(myNode, {
  maxConcurrent: 5,
  priority: 'high',
});
```

### `withLogging()`

Add logging to a node.

```typescript
function withLogging<State>(options?: LoggingOptions): Middleware<State>;
```

**Options**:
```typescript
interface LoggingOptions {
  name: string;                    // Node name for logging
  level?: 'debug' | 'info' | 'warn' | 'error';  // Default: 'info'
  logger?: Logger;                 // Custom logger instance
  logInput?: boolean;              // Default: true
  logOutput?: boolean;             // Default: true
  logDuration?: boolean;           // Default: true
  logErrors?: boolean;             // Default: true
  extractData?: (state: any) => any;  // Extract data for logging
  onStart?: (state: any) => void;
  onComplete?: (state: any, result: any) => void;
  onError?: (state: any, error: Error) => void;
}
```

**Returns**: Middleware function

**Example**:
```typescript
const loggedNode = withLogging({
  name: 'my-node',
  level: 'info',
  logDuration: true,
})(myNode);
```

### `withRetry()`

Add retry logic to a node.

```typescript
function withRetry<State>(
  node: NodeFunction<State>,
  options?: RetryOptions
): NodeFunction<State>;
```

**Options**:
```typescript
interface RetryOptions {
  maxAttempts?: number;            // Default: 3
  backoff?: 'exponential' | 'linear' | 'constant';  // Default: 'exponential'
  initialDelay?: number;           // Initial delay in ms (default: 1000)
  maxDelay?: number;               // Max delay in ms
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}
```

**Returns**: Retry-enabled node function

**Example**:
```typescript
const retriedNode = withRetry(myNode, {
  maxAttempts: 3,
  backoff: 'exponential',
  initialDelay: 1000,
});
```

### `withErrorHandler()`

Add error handling to a node.

```typescript
function withErrorHandler<State>(
  node: NodeFunction<State>,
  options?: ErrorHandlerOptions
): NodeFunction<State>;
```

**Options**:
```typescript
interface ErrorHandlerOptions {
  onError: (error: Error, state: any) => any;
  rethrow?: boolean;               // Default: false
  transformError?: (error: Error) => Error;
}
```

**Returns**: Error-handled node function

**Example**:
```typescript
const handledNode = withErrorHandler(myNode, {
  onError: (error, state) => ({
    ...state,
    error: error.message,
  }),
  rethrow: false,
});
```

### `withTimeout()`

Add timeout to a node.

```typescript
function withTimeout<State>(
  node: NodeFunction<State>,
  options?: TimeoutOptions
): NodeFunction<State>;
```

**Options**:
```typescript
interface TimeoutOptions {
  timeout?: number;                // Timeout in ms (default: 30000)
  onTimeout?: (state: any) => any;
}
```

**Returns**: Timeout-enabled node function

**Example**:
```typescript
const timedNode = withTimeout(myNode, {
  timeout: 30000,
  onTimeout: (state) => ({ ...state, timedOut: true }),
});
```

### `withMetrics()`

Add metrics collection to a node.

```typescript
function withMetrics<State>(
  node: NodeFunction<State>,
  options?: MetricsOptions
): NodeFunction<State>;
```

**Options**:
```typescript
interface MetricsOptions {
  name: string;                    // Metric name
  trackDuration?: boolean;         // Default: true
  trackErrors?: boolean;           // Default: true
  trackInvocations?: boolean;      // Default: true
  onMetric?: (metric: Metric) => void;
}

interface Metric {
  name: string;
  type: 'duration' | 'error' | 'invocation';
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}
```

**Returns**: Metrics-enabled node function

**Example**:
```typescript
const metricNode = withMetrics(myNode, {
  name: 'my-node',
  trackDuration: true,
  onMetric: (metric) => console.log(metric),
});
```

### `withTracing()`

Add distributed tracing to a node.

```typescript
function withTracing<State>(
  node: NodeFunction<State>,
  options?: TracingOptions
): NodeFunction<State>;
```

**Options**:
```typescript
interface TracingOptions {
  name: string;                    // Trace name
  metadata?: Record<string, any>;  // Additional metadata
  onSpanStart?: (span: Span) => void;
  onSpanEnd?: (span: Span) => void;
}

interface Span {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  metadata?: Record<string, any>;
}
```

**Returns**: Tracing-enabled node function

**Example**:
```typescript
const tracedNode = withTracing(myNode, {
  name: 'my-node',
  metadata: { version: '1.0' },
});
```

## Presets

### `productionPreset()`

Pre-configured middleware stack for production.

```typescript
function productionPreset<State>(
  node: NodeFunction<State>,
  options?: ProductionPresetOptions
): NodeFunction<State>;
```

**Options**:
```typescript
interface ProductionPresetOptions {
  logging?: LoggingOptions;
  metrics?: MetricsOptions;
  timeout?: TimeoutOptions;
  retry?: RetryOptions;
  errorHandler?: ErrorHandlerOptions;
  rateLimit?: RateLimitOptions;
  cache?: CacheOptions;
}
```

**Included Middleware** (in order):
1. Logging (info level)
2. Metrics tracking
3. Timeout (30s default)
4. Retry (3 attempts with exponential backoff)
5. Error handling (logs and rethrows)
6. Rate limiting (optional)
7. Caching (optional)

**Example**:
```typescript
const productionNode = productionPreset(myNode, {
  logging: { name: 'my-node', level: 'info' },
  cache: { ttl: 3600000 },
  rateLimit: { maxRequests: 100, windowMs: 60000 },
});
```

### `developmentPreset()`

Pre-configured middleware stack for development.

```typescript
function developmentPreset<State>(
  node: NodeFunction<State>,
  options?: DevelopmentPresetOptions
): NodeFunction<State>;
```

**Options**:
```typescript
interface DevelopmentPresetOptions {
  logging?: LoggingOptions;
  tracing?: TracingOptions;
  validation?: ValidationOptions;
  errorHandler?: ErrorHandlerOptions;
}
```

**Included Middleware** (in order):
1. Logging (debug level with full state)
2. Tracing (with detailed spans)
3. Validation (optional, strict mode)
4. Error handling (detailed error messages)

**Example**:
```typescript
const devNode = developmentPreset(myNode, {
  logging: { name: 'my-node', level: 'debug' },
  validation: { inputSchema, outputSchema },
});
```

### `testingPreset()`

Pre-configured middleware stack for testing.

```typescript
function testingPreset<State>(
  node: NodeFunction<State>,
  options?: TestingPresetOptions
): NodeFunction<State> & TestingNode<State>;
```

**Options**:
```typescript
interface TestingPresetOptions {
  mock?: {
    response?: any;
    error?: Error;
  };
  track?: boolean;                 // Track invocations (default: true)
}

interface TestingNode<State> extends NodeFunction<State> {
  invocations: Array<{
    input: State;
    output: State | Error;
    duration: number;
    timestamp: number;
  }>;
  reset(): void;
}
```

**Included Middleware** (in order):
1. Mock responses (optional)
2. Invocation tracking
3. Error simulation (optional)

**Example**:
```typescript
const testNode = testingPreset(myNode, {
  mock: { response: { result: 'test' } },
  track: true,
});

await testNode({ input: 'test' });
console.log(testNode.invocations); // [{ input, output, duration, timestamp }]
testNode.reset(); // Clear invocations
```

## Utilities

### `MiddlewareChain`

Fluent API for building middleware chains.

```typescript
class MiddlewareChain<State> {
  use(middleware: Middleware<State>): this;
  build(node: NodeFunction<State>): NodeFunction<State>;
}
```

**Methods**:
- `use(middleware)`: Add middleware to the chain
- `build(node)`: Build the final node with all middleware applied

**Example**:
```typescript
const node = new MiddlewareChain()
  .use(withLogging({ name: 'my-node' }))
  .use(withCache({ ttl: 3600000 }))
  .build(myNode);
```

### `createSharedCache()`

Create a shared cache for multiple nodes.

```typescript
function createSharedCache(options?: CacheOptions): SharedCache;

interface SharedCache {
  withCache<State>(node: NodeFunction<State>): NodeFunction<State>;
  get(key: string): any | undefined;
  set(key: string, value: any): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  size: number;
}
```

**Example**:
```typescript
const cache = createSharedCache({ ttl: 3600000 });
const node1 = cache.withCache(myNode1);
const node2 = cache.withCache(myNode2);
```

### `createSharedRateLimiter()`

Create a shared rate limiter for multiple nodes.

```typescript
function createSharedRateLimiter(options: RateLimitOptions): SharedRateLimiter;

interface SharedRateLimiter {
  withRateLimit<State>(node: NodeFunction<State>): NodeFunction<State>;
  checkLimit(key: string): boolean;
  reset(key?: string): void;
}
```

**Example**:
```typescript
const limiter = createSharedRateLimiter({
  maxRequests: 100,
  windowMs: 60000,
});
const node1 = limiter.withRateLimit(myNode1);
const node2 = limiter.withRateLimit(myNode2);
```

### `createSharedConcurrencyController()`

Create a shared concurrency controller for multiple nodes.

```typescript
function createSharedConcurrencyController(
  options: ConcurrencyOptions
): SharedConcurrencyController;

interface SharedConcurrencyController {
  withConcurrency<State>(node: NodeFunction<State>): NodeFunction<State>;
  getCurrentConcurrency(): number;
  getQueueSize(): number;
}
```

**Example**:
```typescript
const controller = createSharedConcurrencyController({
  maxConcurrent: 5,
});
const node1 = controller.withConcurrency(myNode1);
const node2 = controller.withConcurrency(myNode2);
```

### `createMiddleware()`

Helper for creating custom middleware with context support.

```typescript
function createMiddleware<State>(
  factory: (node: NodeFunction<State>) => NodeFunction<State>
): Middleware<State>;
```

**Example**:
```typescript
const customMiddleware = createMiddleware<State>((node) => {
  return async (state, context) => {
    context?.set('timestamp', Date.now());
    return node(state, context);
  };
});
```

## Type Exports

```typescript
export type {
  NodeFunction,
  Middleware,
  MiddlewareContext,
  CacheOptions,
  RateLimitOptions,
  ValidationOptions,
  ConcurrencyOptions,
  LoggingOptions,
  RetryOptions,
  ErrorHandlerOptions,
  TimeoutOptions,
  MetricsOptions,
  TracingOptions,
  ProductionPresetOptions,
  DevelopmentPresetOptions,
  TestingPresetOptions,
  SharedCache,
  SharedRateLimiter,
  SharedConcurrencyController,
  TestingNode,
  Metric,
  Span,
};
```

## See Also

- [Middleware Guide](../guides/middleware-guide.md) - Comprehensive usage guide
- [Best Practices](../guides/middleware-best-practices.md) - Production best practices
- [Phase 4 Complete](../PHASE_4_COMPLETE.md) - Implementation details

