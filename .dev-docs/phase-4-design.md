# Phase 4: Middleware System - Design Document

> Comprehensive middleware system for LangGraph nodes with composable, type-safe wrappers

**Status**: 📋 Planning
**Duration**: 7 days
**Package**: `@agentforge/core` v0.3.0

---

## Overview

Phase 4 introduces a **production-grade middleware system** for LangGraph nodes. The middleware system provides composable, type-safe wrappers that can be applied to any node function to add cross-cutting concerns like logging, tracing, caching, rate limiting, and more.

### Philosophy

- **Composable**: Middleware can be stacked and combined
- **Type-Safe**: Full TypeScript support with proper type inference
- **Non-Invasive**: Works with existing LangGraph nodes without modification
- **Production-Ready**: Built for real-world production use cases
- **Observable**: Deep integration with observability tools

---

## Architecture

### Middleware Pattern

All middleware follows a consistent pattern:

```typescript
type NodeFunction<State> = (state: State) => State | Promise<State> | Partial<State> | Promise<Partial<State>>;

type Middleware<State, Options = unknown> = (
  node: NodeFunction<State>,
  options: Options
) => NodeFunction<State>;
```

### Middleware Composition

Middleware can be composed using a `compose` utility:

```typescript
import { compose, withLogging, withMetrics, withRetry } from '@agentforge/core';

const enhancedNode = compose(
  withLogging({ level: 'info' }),
  withMetrics({ name: 'my-node' }),
  withRetry({ maxAttempts: 3 })
)(myNode);
```

---

## Features

### 1. Logging Middleware ✅ (Partially Exists)

**Status**: Enhance existing logger with middleware wrapper

**Current State**:
- ✅ `createLogger()` exists in `observability/logger.ts`
- ❌ No `withLogging()` middleware wrapper

**New Features**:
```typescript
import { withLogging } from '@agentforge/core';

const loggedNode = withLogging(myNode, {
  logger: createLogger({ level: LogLevel.INFO }),
  logInput: true,
  logOutput: true,
  logDuration: true,
  logErrors: true,
  nodeName: 'my-node',
  // Custom formatters
  formatInput: (state) => ({ input: state.input }),
  formatOutput: (state) => ({ output: state.output }),
});
```

**Implementation**:
- Wrap node execution with structured logging
- Log entry/exit, duration, errors
- Support custom formatters for sensitive data
- Integration with existing `Logger` interface

---

### 2. Tracing Middleware ✅ (Partially Exists)

**Status**: Enhance existing tracing with better integration

**Current State**:
- ✅ `withTracing()` exists in `observability/langsmith.ts`
- ✅ LangSmith configuration utilities exist
- ❌ Limited metadata and context propagation

**New Features**:
```typescript
import { withTracing } from '@agentforge/core';

const tracedNode = withTracing(myNode, {
  name: 'research-node',
  metadata: { category: 'research', version: '1.0' },
  tags: ['research', 'web'],
  runName: 'research-run',
  // Context propagation
  propagateContext: true,
  // Custom span attributes
  attributes: (state) => ({
    inputLength: state.input?.length,
    hasTools: state.tools?.length > 0,
  }),
});
```

**Enhancements**:
- Better context propagation
- Custom span attributes from state
- Integration with OpenTelemetry (optional)
- Trace correlation across nodes

---

### 3. Caching Middleware 🆕

**Status**: New feature

**Use Cases**:
- Cache expensive LLM calls
- Cache tool execution results
- Reduce API costs
- Improve response times

**API Design**:
```typescript
import { withCache } from '@agentforge/core';

const cachedNode = withCache(myNode, {
  // Cache key generation
  keyFn: (state) => `${state.input}-${state.context}`,

  // Cache backend
  cache: createMemoryCache({ maxSize: 1000, ttl: 3600 }),
  // OR
  cache: createRedisCache({ url: 'redis://localhost:6379' }),

  // Cache behavior

### 5. Retry Middleware ✅ (Exists)

**Status**: Already implemented, needs enhancement

**Current State**:
- ✅ `withRetry()` exists in `langgraph/patterns/retry.ts`
- ✅ Backoff strategies (constant, linear, exponential)
- ✅ Conditional retry logic

**Enhancements Needed**:
```typescript
import { withRetry } from '@agentforge/core';

const retriedNode = withRetry(myNode, {
  maxAttempts: 3,
  backoff: 'exponential',
  initialDelay: 1000,
  maxDelay: 30000,

  // Enhanced features
  shouldRetry: (error, attempt, state) => {
    // More context for retry decisions
    if (error.code === 'RATE_LIMIT') return true;
    if (attempt > 2 && state.critical) return false;
    return true;
  },

  // Retry with state modification
  onRetry: (error, attempt, state) => {
    console.log(`Retry ${attempt} after error:`, error.message);
    // Optionally modify state before retry
    return { ...state, retryCount: attempt };
  },

  // Circuit breaker integration
  circuitBreaker: {
    enabled: true,
    threshold: 5, // Open after 5 failures
    timeout: 60000, // Reset after 1 minute
  },

  // Jitter for distributed systems
  jitter: true,
});
```

**Enhancements**:
- Circuit breaker pattern
- Jitter for distributed systems
- State-aware retry decisions
- Better error classification
- Metrics integration

---

### 6. Error Handling Middleware ✅ (Exists)

**Status**: Already implemented, needs enhancement

**Current State**:
- ✅ `withErrorHandler()` exists in `langgraph/patterns/error-handler.ts`
- ✅ `ErrorReporter` exists in `observability/errors.ts`
- ✅ `AgentError` class exists

**Enhancements Needed**:
```typescript
import { withErrorHandler } from '@agentforge/core';

const safeNode = withErrorHandler(myNode, {
  // Error classification
  classify: (error) => {
    if (error.code === 'RATE_LIMIT') return 'retryable';
    if (error.code === 'AUTH_FAILED') return 'fatal';
    return 'unknown';
  },

  // Fallback strategies
  fallback: (error, state) => {
    if (error.code === 'RATE_LIMIT') {
      return { ...state, useFallbackModel: true };
    }
    return state;
  },

  // Error transformation
  transformError: (error) => new AgentError(
    error.message,
    'NODE_ERROR',
    { originalError: error }
  ),

  // Error reporting
  reporter: createErrorReporter({
    onError: async (error) => {
      await sendToSentry(error);
    },
  }),

  // Recovery strategies
  recovery: {
    maxAttempts: 3,
    strategies: ['retry', 'fallback', 'skip'],
  },
});
```

**Enhancements**:
- Error classification system
- Multiple fallback strategies
- Error transformation pipeline
- Integration with error tracking services
- Recovery strategy chain

---

### 7. Timeout Middleware ✅ (Exists)

**Status**: Already implemented, needs enhancement

**Current State**:
- ✅ `withTimeout()` exists in `langgraph/patterns/timeout.ts`
- ✅ Basic timeout with fallback

**Enhancements Needed**:
```typescript
import { withTimeout } from '@agentforge/core';

const timedNode = withTimeout(myNode, {
  timeout: 5000,

  // Enhanced timeout handling
  onTimeout: (state, elapsed) => ({
    ...state,
    timedOut: true,
    elapsed,
    error: `Operation timed out after ${elapsed}ms`,
  }),

  // Graceful cancellation
  signal: new AbortController().signal,

  // Timeout warnings
  warningThreshold: 4000, // Warn at 80%
  onWarning: (elapsed) => {
    console.warn(`Node approaching timeout: ${elapsed}ms`);
  },

  // Adaptive timeout
  adaptive: {
    enabled: true,
    baseTimeout: 5000,
    adjustFactor: 1.5, // Increase by 50% on timeout
    maxTimeout: 30000,
  },
});
```

**Enhancements**:
- Graceful cancellation with AbortSignal
- Timeout warnings
- Adaptive timeout based on history
- Better timeout metrics

---

### 8. Validation Middleware 🆕

**Status**: New feature

**Use Cases**:
- Validate state before/after node execution
- Ensure data integrity
- Catch bugs early
- Type safety at runtime

**API Design**:
```typescript
import { withValidation } from '@agentforge/core';
import { z } from 'zod';

const validatedNode = withValidation(myNode, {
  // Input validation
  input: z.object({
    query: z.string().min(1),
    context: z.record(z.any()).optional(),
  }),

  // Output validation
  output: z.object({
    result: z.string(),
    confidence: z.number().min(0).max(1),
  }),

  // Validation behavior
  onInputError: 'throw', // or 'skip', 'fallback'
  onOutputError: 'throw',

  // Custom validators
  customValidation: {
    input: (state) => {
      if (state.query.length > 1000) {
        throw new Error('Query too long');
      }
    },
    output: (state) => {
      if (!state.result) {
        throw new Error('Missing result');
      }
    },
  },

  // Sanitization
  sanitize: {
    input: (state) => ({
      ...state,
      query: state.query.trim(),
    }),
    output: (state) => ({
      ...state,
      result: state.result.trim(),
    }),
  },
});
```

**Implementation**:
- Zod schema validation
- Custom validation functions
- Input/output sanitization
- Validation error handling
- Type inference from schemas

---

### 9. Metrics Middleware ✅ (Exists)

**Status**: Already implemented, needs enhancement

**Current State**:
- ✅ `withMetrics()` exists in `observability/metrics.ts`
- ✅ `createMetrics()` utility exists
- ✅ Basic metrics tracking

**Enhancements Needed**:
```typescript
import { withMetrics } from '@agentforge/core';

const metricNode = withMetrics(myNode, {
  name: 'research-node',
  metrics: createMetrics('my-agent'),

  // Enhanced metrics
  trackDuration: true,
  trackErrors: true,
  trackInvocations: true,

  // Custom metrics
  customMetrics: {
    inputSize: (state) => state.input?.length || 0,
    outputSize: (state) => state.output?.length || 0,
    toolsUsed: (state) => state.tools?.length || 0,
  },

  // Percentiles and histograms
  percentiles: [0.5, 0.9, 0.95, 0.99],

  // Labels for grouping
  labels: (state) => ({
    userId: state.userId,
    environment: process.env.NODE_ENV,
  }),

  // Export to monitoring systems
  exporters: [
    createPrometheusExporter({ port: 9090 }),
    createDatadogExporter({ apiKey: process.env.DD_API_KEY }),
  ],
});
```

**Enhancements**:
- Custom metric extraction from state
- Percentiles and histograms
- Labels for metric grouping
- Multiple metric exporters (Prometheus, Datadog, etc.)
- Metric aggregation

---

### 10. Concurrency Control Middleware 🆕

**Status**: New feature

**Use Cases**:
- Limit parallel executions
- Prevent resource exhaustion
- Control costs
- Manage dependencies

**API Design**:
```typescript
import { withConcurrency } from '@agentforge/core';

const concurrentNode = withConcurrency(myNode, {
  // Concurrency limit
  maxConcurrent: 5,

  // Behavior when limit reached
  onLimitReached: 'queue', // or 'throw', 'drop'

  // Queue configuration
  queue: {
    maxSize: 100,
    timeout: 30000,
    priority: (state) => state.priority || 0,
  },

  // Semaphore key (for grouping)
  keyFn: (state) => state.userId || 'global',

  // Metrics
  trackQueueSize: true,
  trackWaitTime: true,
});
```

**Implementation**:
- Semaphore-based concurrency control
- Priority queue
- Per-user or global limits
- Queue metrics
- Timeout handling

---

## Middleware Composition

### Compose Utility

```typescript
import { compose } from '@agentforge/core';

// Compose multiple middleware
const enhancedNode = compose(
  withLogging({ level: 'info' }),
  withMetrics({ name: 'my-node' }),
  withRetry({ maxAttempts: 3 }),
  withTimeout({ timeout: 5000 }),
  withCache({ ttl: 3600 }),
)(myNode);
```

### Middleware Presets

```typescript
import { presets } from '@agentforge/core';

// Production preset
const productionNode = presets.production(myNode, {
  nodeName: 'my-node',
  metrics: createMetrics('my-agent'),
  logger: createLogger({ level: LogLevel.INFO }),
});

// Development preset
const devNode = presets.development(myNode, {
  nodeName: 'my-node',
  verbose: true,
});

// Custom preset
const customPreset = presets.create([
  withLogging({ level: 'debug' }),
  withMetrics({ name: 'custom' }),
  withRetry({ maxAttempts: 5 }),
]);
```

---

## Implementation Plan

### Phase 4.1: Core Middleware Infrastructure (2 days)

**Goal**: Build the foundation for middleware composition

- [ ] **4.1.1** Middleware type definitions and interfaces
  - Define `Middleware<State, Options>` type
  - Define `NodeFunction<State>` type
  - Create middleware composition utilities
  - Write 10 unit tests

- [ ] **4.1.2** Compose utility and middleware chain
  - Implement `compose()` function
  - Implement middleware execution order
  - Handle async middleware
  - Write 10 unit tests

- [ ] **4.1.3** Middleware presets system
  - Create preset builder
  - Implement common presets (production, development, testing)
  - Custom preset creation
  - Write 8 unit tests

**Deliverables**:
- `src/langgraph/middleware/types.ts`
- `src/langgraph/middleware/compose.ts`
- `src/langgraph/middleware/presets.ts`
- 28 unit tests

---

### Phase 4.2: New Middleware (2 days)

**Goal**: Implement new middleware features

- [ ] **4.2.1** Caching middleware
  - Memory cache backend
  - Redis cache backend (optional)
  - Cache key generation
  - TTL and eviction
  - Write 12 unit tests

- [ ] **4.2.2** Rate limiting middleware
  - Token bucket strategy
  - Sliding window strategy
  - Queue on limit exceeded
  - Per-user rate limiting
  - Write 12 unit tests

- [ ] **4.2.3** Validation middleware
  - Zod schema validation
  - Custom validators
  - Input/output sanitization
  - Error handling
  - Write 10 unit tests

- [ ] **4.2.4** Concurrency control middleware
  - Semaphore implementation
  - Priority queue
  - Timeout handling
  - Metrics
  - Write 10 unit tests

**Deliverables**:
- `src/langgraph/middleware/cache.ts`
- `src/langgraph/middleware/rate-limit.ts`
- `src/langgraph/middleware/validation.ts`
- `src/langgraph/middleware/concurrency.ts`
- 44 unit tests

---

### Phase 4.3: Enhance Existing Middleware (1 day)

**Goal**: Improve existing middleware with new features

- [ ] **4.3.1** Enhance logging middleware
  - Create `withLogging()` wrapper
  - Custom formatters
  - Sensitive data filtering
  - Write 8 unit tests

- [ ] **4.3.2** Enhance tracing middleware
  - Better context propagation
  - Custom span attributes
  - OpenTelemetry integration (optional)
  - Write 8 unit tests

- [ ] **4.3.3** Enhance retry middleware
  - Circuit breaker pattern
  - Jitter support
  - State-aware retry
  - Write 8 unit tests

- [ ] **4.3.4** Enhance error handling middleware
  - Error classification
  - Multiple fallback strategies
  - Recovery strategy chain
  - Write 8 unit tests

- [ ] **4.3.5** Enhance timeout middleware
  - Graceful cancellation
  - Timeout warnings
  - Adaptive timeout
  - Write 6 unit tests

- [ ] **4.3.6** Enhance metrics middleware
  - Custom metrics extraction
  - Percentiles and histograms
  - Metric exporters
  - Write 8 unit tests

**Deliverables**:
- Enhanced middleware in existing files
- 46 unit tests

---

### Phase 4.4: Integration & Examples (1 day)

**Goal**: Integration tests and comprehensive examples

- [ ] **4.4.1** Integration tests
  - Test middleware composition
  - Test preset usage
  - Test with real LangGraph workflows
  - Write 15 integration tests

- [ ] **4.4.2** Create examples
  - Basic middleware usage
  - Middleware composition
  - Custom middleware creation
  - Production setup
  - 4 comprehensive examples

**Deliverables**:
- `tests/langgraph/middleware/integration.test.ts`
- `examples/middleware/` directory with 4 examples
- 15 integration tests

---

### Phase 4.5: Documentation (1 day)

**Goal**: Comprehensive documentation and guides

- [ ] **4.5.1** API documentation
  - Document all middleware functions
  - Document composition utilities
  - Document presets
  - API reference guide

- [ ] **4.5.2** Usage guides
  - Middleware guide (comprehensive)
  - Best practices guide
  - Performance guide
  - Migration guide

- [ ] **4.5.3** Update existing docs
  - Update main README
  - Update ROADMAP
  - Update package README

**Deliverables**:
- `docs/middleware-guide.md` (comprehensive guide)
- `docs/middleware-best-practices.md`
- Updated README files

---

## Success Metrics

### Code Quality
- ✅ 100% TypeScript type safety
- ✅ >80% test coverage
- ✅ All middleware composable
- ✅ Zero breaking changes to existing APIs

### Performance
- ✅ <1ms overhead per middleware (excluding actual work)
- ✅ Efficient composition (no redundant wrapping)
- ✅ Memory efficient (no leaks)

### Developer Experience
- ✅ Intuitive API
- ✅ Comprehensive documentation
- ✅ Working examples for all middleware
- ✅ Clear error messages

### Testing
- ✅ 118+ unit tests (28 + 44 + 46)
- ✅ 15+ integration tests
- ✅ All examples working

---

## Deliverables Summary

### Code
- **10 new middleware implementations**
- **6 enhanced existing middleware**
- **Composition utilities and presets**
- **133+ tests** (118 unit + 15 integration)

### Documentation
- **Comprehensive middleware guide** (1000+ lines)
- **Best practices guide**
- **4 working examples**
- **Updated README files**

### Package
- **@agentforge/core v0.3.0**
- **Backward compatible**
- **Production ready**

---

## Future Enhancements (Post-Phase 4)

### Advanced Features
- **Distributed tracing** with OpenTelemetry
- **Advanced caching** with cache warming and invalidation
- **Cost tracking** middleware for LLM calls
- **A/B testing** middleware for experiments
- **Streaming** middleware for real-time responses

### Ecosystem
- **Middleware marketplace** for community contributions
- **Middleware templates** for common patterns
- **Middleware testing utilities**
- **Middleware performance profiler**

---

## Dependencies

### Required
- `@langchain/langgraph` - Core graph framework
- `zod` - Schema validation
- Existing observability utilities

### Optional
- `ioredis` - Redis cache backend
- `@opentelemetry/api` - OpenTelemetry integration
- `prom-client` - Prometheus metrics

---

## Risk Mitigation

### Performance Overhead
- **Risk**: Middleware adds latency
- **Mitigation**: Benchmark all middleware, optimize hot paths, make middleware optional

### Complexity
- **Risk**: Too many middleware options confuse users
- **Mitigation**: Provide sensible presets, clear documentation, progressive disclosure

### Breaking Changes
- **Risk**: Changes break existing code
- **Mitigation**: Maintain backward compatibility, deprecation warnings, migration guide

### Testing Coverage
- **Risk**: Edge cases not covered
- **Mitigation**: Comprehensive test suite, integration tests, real-world examples

---

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| 4.1 Core Infrastructure | 2 days | Types, compose, presets (28 tests) |
| 4.2 New Middleware | 2 days | Cache, rate limit, validation, concurrency (44 tests) |
| 4.3 Enhance Existing | 1 day | Logging, tracing, retry, error, timeout, metrics (46 tests) |
| 4.4 Integration & Examples | 1 day | Integration tests, 4 examples (15 tests) |
| 4.5 Documentation | 1 day | Guides, API docs, updates |
| **Total** | **7 days** | **133 tests, 4 examples, comprehensive docs** |

---

## Next Steps

1. ✅ Review and approve this design document
2. Create detailed task breakdown for Phase 4.1
3. Set up middleware package structure
4. Begin implementation of core infrastructure

---

**Document Version**: 1.0
**Last Updated**: 2026-01-06
**Status**: Ready for Review

