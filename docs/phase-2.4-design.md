# Phase 2.4 Design: Observability & Error Handling

## Overview

Phase 2.4 focuses on observability and enhanced error handling for LangGraph applications. We'll provide utilities for:
1. **LangSmith Integration** - Easy configuration and tracing
2. **Structured Logging** - Consistent logging across agents
3. **Metrics Collection** - Performance and usage metrics
4. **Enhanced Error Context** - Better error reporting and debugging

**Note**: We already have error handling patterns from Phase 2.2 (`withRetry`, `withErrorHandler`, `withTimeout`). This phase focuses on observability and logging.

## Design Principles

1. **Thin Wrappers**: Enhance LangChain/LangSmith, don't replace them
2. **Type Safety**: Full TypeScript support
3. **Zero Config**: Sensible defaults, optional configuration
4. **Production Ready**: Structured logging, metrics, tracing

## Features

### 1. LangSmith Integration Helpers

**Goal**: Simplify LangSmith configuration and usage.

#### 1.1 Configuration Helper

```typescript
import { configureLangSmith } from '@agentforge/core';

// Simple configuration
configureLangSmith({
  apiKey: process.env.LANGSMITH_API_KEY,
  projectName: 'my-agent',
  tracingEnabled: true,
});

// Advanced configuration
configureLangSmith({
  apiKey: process.env.LANGSMITH_API_KEY,
  projectName: 'my-agent',
  tracingEnabled: true,
  endpoint: 'https://api.smith.langchain.com',
  metadata: {
    environment: 'production',
    version: '1.0.0',
  },
});
```

#### 1.2 Tracing Utilities

```typescript
import { withTracing, createTracedNode } from '@agentforge/core';

// Wrap a node with tracing
const tracedNode = withTracing(myNode, {
  name: 'research-node',
  metadata: { category: 'research' },
});

// Create a traced node
const node = createTracedNode('process', async (state) => {
  // Node implementation
  return { ...state, processed: true };
});
```

### 2. Structured Logging

**Goal**: Provide consistent, structured logging for agents.

#### 2.1 Logger Factory

```typescript
import { createLogger } from '@agentforge/core';

const logger = createLogger('research-agent');

logger.info('Starting research', { query: 'AI agents' });
logger.warn('Rate limit approaching', { remaining: 10 });
logger.error('Research failed', { error: err.message });
logger.debug('Intermediate result', { data });
```

#### 2.2 Log Levels and Formatting

```typescript
import { createLogger, LogLevel } from '@agentforge/core';

const logger = createLogger('my-agent', {
  level: LogLevel.INFO,
  format: 'json', // or 'pretty'
  destination: process.stdout,
  includeTimestamp: true,
  includeContext: true,
});
```

#### 2.3 Context-Aware Logging

```typescript
import { createLogger } from '@agentforge/core';

const logger = createLogger('agent').withContext({
  userId: 'user-123',
  sessionId: 'session-456',
});

// All logs include context
logger.info('Processing request'); // Includes userId and sessionId
```

### 3. Metrics Collection

**Goal**: Track performance and usage metrics.

#### 3.1 Metrics Collector

```typescript
import { createMetrics } from '@agentforge/core';

const metrics = createMetrics('my-agent');

// Track counters
metrics.increment('requests.total');
metrics.increment('requests.success');

// Track gauges
metrics.gauge('active.connections', 5);

// Track histograms
metrics.histogram('request.duration', 150);

// Track timers
const timer = metrics.startTimer('operation.duration');
// ... do work ...
timer.end();
```

#### 3.2 Built-in Metrics

```typescript
import { withMetrics } from '@agentforge/core';

// Automatically track node execution metrics
const metricNode = withMetrics(myNode, {
  name: 'research-node',
  trackDuration: true,
  trackErrors: true,
  trackInvocations: true,
});
```

### 4. Error Context Enhancement

**Goal**: Provide better error context for debugging.

#### 4.1 Enhanced Error Class

```typescript
import { AgentError } from '@agentforge/core';

throw new AgentError('Research failed', {
  code: 'RESEARCH_ERROR',
  node: 'research-node',
  state: currentState,
  metadata: { query, attempt: 3 },
  cause: originalError,
});
```

#### 4.2 Error Reporting

```typescript
import { createErrorReporter } from '@agentforge/core';

const reporter = createErrorReporter({
  onError: (error) => {
    // Send to error tracking service
    console.error('Error:', error.toJSON());
  },
  includeStackTrace: true,
  includeState: true,
});

// Use with nodes
const node = reporter.wrap(myNode);
```

## File Structure

```
packages/core/src/langgraph/observability/
├── langsmith.ts       # LangSmith configuration and tracing
├── logger.ts          # Structured logging
├── metrics.ts         # Metrics collection
├── errors.ts          # Enhanced error handling
└── index.ts           # Public exports
```

## API Design

### LangSmith Integration

```typescript
// Configuration
export interface LangSmithConfig {
  apiKey?: string;
  projectName?: string;
  tracingEnabled?: boolean;
  endpoint?: string;
  metadata?: Record<string, any>;
}

export function configureLangSmith(config: LangSmithConfig): void;
export function getLangSmithConfig(): LangSmithConfig | null;

// Tracing
export interface TracingOptions {
  name: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export function withTracing<State>(
  node: (state: State) => State | Promise<State>,
  options: TracingOptions
): (state: State) => Promise<State>;
```

### Logging

```typescript
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LoggerOptions {
  level?: LogLevel;
  format?: 'json' | 'pretty';
  destination?: NodeJS.WritableStream;
  includeTimestamp?: boolean;
  includeContext?: boolean;
}

export interface Logger {
  debug(message: string, data?: Record<string, any>): void;
  info(message: string, data?: Record<string, any>): void;
  warn(message: string, data?: Record<string, any>): void;
  error(message: string, data?: Record<string, any>): void;
  withContext(context: Record<string, any>): Logger;
}

export function createLogger(name: string, options?: LoggerOptions): Logger;
```

## Testing Strategy

- Unit tests for each utility function
- Integration tests with LangSmith (mocked)
- Logger output validation
- Metrics collection verification
- Error context preservation tests

**Target**: 20-25 tests

## Success Criteria

- ✅ LangSmith configuration helper
- ✅ Tracing utilities for nodes
- ✅ Structured logger with context
- ✅ Metrics collection utilities
- ✅ Enhanced error classes
- ✅ 20+ comprehensive tests
- ✅ Complete documentation
- ✅ Working examples

## Next Steps

After Phase 2.4:
- Phase 3: Agent Patterns (ReAct, Planner-Executor, etc.)

