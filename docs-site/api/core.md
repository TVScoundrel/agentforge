# @agentforge/core

The core package provides the foundation for building AI agents with tools, middleware, streaming, and utilities.

## Installation

```bash
pnpm add @agentforge/core
```

## Tool System

### toolBuilder()

Fluent API for creating tools with rich metadata and validation.

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const myTool = toolBuilder()
  .name('my-tool')
  .description('Tool description')
  .category(ToolCategory.UTILITY)
  .tags(['tag1', 'tag2'])
  .schema(z.object({
    input: z.string().describe('Input parameter')
  }))
  .implement(async ({ input }) => {
    return { success: true, data: input };
  })
  .build();

// Tool with relations (NEW in v0.3.9)
const editFileTool = toolBuilder()
  .name('edit-file')
  .description('Edit a file using string replacement')
  .category(ToolCategory.FILE_SYSTEM)
  .requires(['view-file'])        // Must view file first
  .suggests(['run-tests'])         // Suggest testing after edit
  .follows(['search-codebase'])    // Typically follows search
  .precedes(['run-tests'])         // Typically before tests
  .schema(z.object({
    path: z.string().describe('File path'),
    oldStr: z.string().describe('String to replace'),
    newStr: z.string().describe('Replacement string')
  }))
  .implement(async ({ path, oldStr, newStr }) => {
    // Implementation
    return { success: true };
  })
  .build();
```

#### Methods

**Basic Configuration:**
- **`.name(name: string)`** - Set tool name (required)
- **`.description(desc: string)`** - Set description (required)
- **`.category(category: ToolCategory)`** - Set category (required)
- **`.tags(tags: string[])`** - Add tags for discovery
- **`.schema(schema: ZodSchema)`** - Define input schema (required)
- **`.examples(examples: Example[])`** - Add usage examples

**Implementation (choose one):**
- **`.implement(fn: ToolFunction)`** - Implement tool logic with manual error handling
- **`.implementSafe(fn: ToolFunction)`** - Implement with automatic error handling (NEW in v0.7.0)

**Tool Relations (NEW in v0.3.9):**
- **`.requires(tools: string[])`** - Tools that must be called before this tool
- **`.suggests(tools: string[])`** - Tools that work well with this tool
- **`.conflicts(tools: string[])`** - Tools that conflict with this tool
- **`.follows(tools: string[])`** - Tools this typically follows in a workflow
- **`.precedes(tools: string[])`** - Tools this typically precedes in a workflow

**Build:**
- **`.build()`** - Build the tool with validation

#### Safe Error Handling (NEW in v0.7.0)

The `.implementSafe()` method automatically wraps your tool implementation in try-catch and returns a standardized response format:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import fs from 'fs/promises';

// ✅ Recommended: Use implementSafe() for automatic error handling
const readFileTool = toolBuilder()
  .name('read-file')
  .description('Read a file from the file system')
  .category(ToolCategory.FILE_SYSTEM)
  .schema(z.object({
    path: z.string().describe('Path to the file to read')
  }))
  .implementSafe(async ({ path }) => {
    // No try-catch needed! Just write the happy path
    const content = await fs.readFile(path, 'utf-8');
    return { data: content };
  })
  .build();

// Result on success: { success: true, data: "file content" }
// Result on error: { success: false, error: "ENOENT: no such file or directory..." }
```

**Benefits:**
- ✅ No manual try-catch blocks needed
- ✅ Consistent error response format
- ✅ Type-safe response: `{ success: boolean; data?: T; error?: string }`
- ✅ Cleaner, more readable code

**When to use `.implement()` vs `.implementSafe()`:**

Use **`.implementSafe()`** when:
- You want automatic error handling
- You want consistent error response format
- You're building tools that may fail (file operations, API calls, etc.)

Use **`.implement()`** when:
- You need custom error handling logic
- You want to return custom error formats
- You need fine-grained control over error responses

### ToolCategory

Enum for categorizing tools:

```typescript
enum ToolCategory {
  WEB = 'web',
  DATA = 'data',
  FILE = 'file',
  UTILITY = 'utility',
  COMMUNICATION = 'communication',
  CUSTOM = 'custom'
}
```

### ToolRegistry

Manage and discover tools:

```typescript
import { ToolRegistry } from '@agentforge/core';

const registry = new ToolRegistry();

// Register tools
registry.register(myTool);
registry.registerMany([tool1, tool2, tool3]);

// Find tools
const webTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
const searchTools = registry.getByTag('search');
const tool = registry.get('tool-name');

// List all tools
const allTools = registry.getAll();

// Generate prompts for LLMs
const fullPrompt = registry.generatePrompt({
  includeExamples: true,
  includeNotes: true,
  includeLimitations: true,
  includeRelations: true,  // NEW in v0.3.8
  groupByCategory: true
});

// Minimal prompt mode (NEW in v0.3.9)
// Use with providers that have native tool calling (OpenAI, Anthropic, Gemini)
// Reduces token usage by up to 67%
const minimalPrompt = registry.generatePrompt({
  minimal: true,              // Only supplementary context
  includeRelations: true,     // Include workflow hints
  includeExamples: true,      // Include usage examples
  includeNotes: true          // Include usage notes
});
```

#### Prompt Generation Options

- **`includeExamples`** - Include usage examples
- **`includeNotes`** - Include usage notes
- **`includeLimitations`** - Include known limitations
- **`includeRelations`** - Include tool relations (NEW in v0.3.9)
- **`groupByCategory`** - Group tools by category
- **`categories`** - Filter by specific categories
- **`maxExamplesPerTool`** - Limit examples per tool
- **`minimal`** - Minimal mode for native tool calling (NEW in v0.3.9)

## Middleware System

### Composing Middleware

Compose multiple middleware functions:

```typescript
import { compose, withRetry, withMetrics, withLogging } from '@agentforge/core';

const enhanced = compose(
  (node) => withLogging({ name: 'my-node', logDuration: true })(node),
  (node) => withMetrics(node, { name: 'my-node', trackDuration: true }),
  (node) => withRetry(node, { maxAttempts: 3, backoff: 'exponential' })
)(myNode);
```

### Built-in Middleware

#### Caching

```typescript
import { withCache, createSharedCache } from '@agentforge/core';

// Create a shared cache
const cache = createSharedCache({ maxSize: 1000 });

// Apply caching middleware
const cachedNode = withCache(myNode, {
  ttl: 3600,
  cache,
  keyGenerator: (state) => JSON.stringify(state)
});
```

#### Rate Limiting

```typescript
import { withRateLimit, createSharedRateLimiter } from '@agentforge/core';

// Create a shared rate limiter
const limiter = createSharedRateLimiter({ maxRequests: 100, windowMs: 60000 });

// Apply rate limiting middleware
const limitedNode = withRateLimit(myNode, {
  limiter,
  strategy: 'sliding-window'
});
```

#### Retry Logic

```typescript
import { withRetry } from '@agentforge/core';

const retryNode = withRetry(myNode, {
  maxAttempts: 3,
  initialDelay: 1000,
  backoff: 'exponential'
});
```

#### Validation

```typescript
import { withValidation } from '@agentforge/core';
import { z } from 'zod';

const validatedNode = withValidation(myNode, {
  inputSchema: z.object({
    query: z.string().min(1)
  }),
  outputSchema: z.object({
    result: z.string()
  }),
  mode: 'strict'
});
```

#### Production Preset

```typescript
import { production } from '@agentforge/core';

// Wrap a node with production middleware
const productionNode = production(myNode, {
  nodeName: 'my-node',
  enableMetrics: true,
  enableTracing: true,
  enableRetry: true,
  timeout: 30000
});
```

## Logging

### createLogger()

Create a structured logger for observability and debugging.

```typescript
import { createLogger, LogLevel } from '@agentforge/core';

// Create a logger with default settings (INFO level)
const logger = createLogger('my-agent');

// Create a logger with custom settings
const logger = createLogger('my-agent', {
  level: LogLevel.DEBUG,
  format: 'json',
  includeTimestamp: true,
  includeContext: true
});

// Use the logger
logger.debug('Processing request', { userId: 'user-123' });
logger.info('Task completed', { duration: 1500 });
logger.warn('Rate limit approaching', { usage: 95 });
logger.error('Operation failed', { error: err.message });
```

#### Parameters

- **`name`** (string) - Logger name, typically the agent or component name
- **`options`** (optional) - Logger configuration:
  - **`level`** - Minimum log level (default: `LogLevel.INFO`)
  - **`format`** - Output format: `'pretty'` or `'json'` (default: `'pretty'`)
  - **`includeTimestamp`** - Include timestamps in logs (default: `true`)
  - **`includeContext`** - Include context data in logs (default: `true`)

#### Logger Methods

- **`logger.debug(message, data?)`** - Debug-level logs (detailed execution flow)
- **`logger.info(message, data?)`** - Info-level logs (important events)
- **`logger.warn(message, data?)`** - Warning-level logs (degraded performance, retries)
- **`logger.error(message, data?)`** - Error-level logs (failures, exceptions)

### LogLevel

Enum for controlling log verbosity:

```typescript
enum LogLevel {
  DEBUG = 'debug',  // Most verbose - all logs
  INFO = 'info',    // Informational messages and above
  WARN = 'warn',    // Warnings and errors only
  ERROR = 'error'   // Errors only
}
```

#### Log Level Priority

Logs are filtered based on priority (lowest to highest):
- `DEBUG` (0) - Shows all logs
- `INFO` (1) - Shows info, warn, and error
- `WARN` (2) - Shows warn and error
- `ERROR` (3) - Shows error only

#### Environment Variable

Control log level via environment variable:

```bash
# Development - show all logs
LOG_LEVEL=debug

# Production - show info and above
LOG_LEVEL=info

# Production - errors only
LOG_LEVEL=error
```

```typescript
// Logger respects LOG_LEVEL environment variable
const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || LogLevel.INFO;
const logger = createLogger('my-agent', { level: logLevel });
```

#### Usage Examples

**Development debugging:**
```typescript
const logger = createLogger('agent', { level: LogLevel.DEBUG });

logger.debug('Tool selected', { tool: 'search', reasoning: '...' });
logger.debug('API request', { url: '/api/search', params: {...} });
```

**Production logging:**
```typescript
const logger = createLogger('agent', {
  level: LogLevel.INFO,
  format: 'json' // Better for log aggregation
});

logger.info('Request processed', {
  requestId: 'req-123',
  duration: 1500,
  tokensUsed: 450
});
```

**Error tracking:**
```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: { userId, taskId }
  });
}
```

## Streaming

### Stream Transformers

Transform streams with chunking, batching, and throttling:

```typescript
import { chunk, batch, throttle, collect } from '@agentforge/core';

// Chunk stream into groups
const chunked = chunk(stream, { size: 10 });

// Batch items with time window
const batched = batch(stream, { maxSize: 5, maxWaitMs: 1000 });

// Throttle stream
const throttled = throttle(stream, { intervalMs: 100 });

// Collect all items
const items = await collect(stream);
```

### Stream Aggregators

Aggregate and transform stream data:

```typescript
import { reduce, merge, filter, map, take } from '@agentforge/core';

// Reduce stream to single value
const sum = await reduce(stream, (acc, val) => acc + val, 0);

// Filter stream items
const filtered = filter(stream, (item) => item.score > 0.5);

// Map stream items
const mapped = map(stream, (item) => ({ ...item, processed: true }));

// Take first N items
const first10 = take(stream, 10);
```

### Progress Tracking

Track progress of long-running operations:

```typescript
import { createProgressTracker } from '@agentforge/core';

const tracker = createProgressTracker({
  total: 100,
  onProgress: (progress) => {
    console.log(`${progress.percentage}% complete`);
    console.log(`${progress.current}/${progress.total}`);
  }
});

// Update progress
tracker.update(25);
tracker.update(50);
tracker.complete();
```

### SSE (Server-Sent Events)

Create SSE formatters for real-time communication:

```typescript
import { createSSEFormatter, createHeartbeat, parseSSEEvent } from '@agentforge/core';

// Create formatter
const formatter = createSSEFormatter({
  eventPrefix: 'agent',
  includeId: true
});

// Format events
const eventString = formatter.format({
  event: 'message',
  data: { content: 'Hello' }
});

// Create heartbeat
const heartbeat = createHeartbeat({
  intervalMs: 30000,
  onHeartbeat: () => console.log('ping')
});

// Parse SSE events
const event = parseSSEEvent('event: message\ndata: {"content":"Hello"}\n\n');
```

### Human-in-the-Loop SSE

Specialized SSE utilities for human-in-the-loop workflows:

```typescript
import {
  formatHumanRequestEvent,
  formatHumanResponseEvent,
  formatInterruptEvent,
  formatResumeEvent,
  formatAgentWaitingEvent,
  formatAgentResumedEvent
} from '@agentforge/core';

// Format human request event
const requestEvent = formatHumanRequestEvent({
  id: 'req-123',
  question: 'Approve this action?',
  priority: 'high',
  createdAt: Date.now(),
  status: 'pending'
});

// Format human response event
const responseEvent = formatHumanResponseEvent({
  requestId: 'req-123',
  response: 'yes',
  respondedAt: Date.now()
});

// Format interrupt event
const interruptEvent = formatInterruptEvent({
  reason: 'User requested pause',
  timestamp: Date.now()
});

// Format agent waiting event
const waitingEvent = formatAgentWaitingEvent({
  requestId: 'req-123',
  message: 'Waiting for approval'
});
```

**Human-in-Loop Event Types:**
- `human_request` - New request for human input
- `human_response` - Human provided a response
- `interrupt` - Agent execution interrupted
- `resume` - Agent execution resumed
- `agent_waiting` - Agent waiting for human input
- `agent_resumed` - Agent resumed after human input

## LangGraph Integration

### Interrupt Utilities

Utilities for working with LangGraph's interrupt mechanism:

```typescript
import {
  isNodeInterrupt,
  extractHumanRequest,
  createInterruptResponse
} from '@agentforge/core';

// Check if error is a NodeInterrupt
try {
  await app.invoke(input, config);
} catch (error) {
  if (isNodeInterrupt(error)) {
    // Extract human request from interrupt
    const request = extractHumanRequest(error);
    console.log('Human input needed:', request);

    // Create response to resume execution
    const response = createInterruptResponse(request.id, 'approved');

    // Resume execution with response
    await app.invoke(null, {
      ...config,
      resumeValue: response
    });
  }
}
```

### Types

```typescript
import type {
  HumanRequest,
  HumanRequestPriority,
  HumanRequestStatus,
  HumanResponse
} from '@agentforge/core';

// HumanRequest - Request for human input
interface HumanRequest {
  id: string;
  question: string;
  context?: Record<string, unknown>;
  priority?: HumanRequestPriority;
  createdAt: number;
  timeout?: number;
  defaultResponse?: string;
  suggestions?: string[];
  status: HumanRequestStatus;
}

// HumanRequestPriority - Priority levels
type HumanRequestPriority = 'low' | 'normal' | 'high' | 'critical';

// HumanRequestStatus - Request status
type HumanRequestStatus = 'pending' | 'responded' | 'timeout' | 'error';

// HumanResponse - Response from human
interface HumanResponse {
  requestId: string;
  response: string;
  respondedAt: number;
}
```

### Usage with askHuman Tool

The `askHuman` tool (from `@agentforge/tools`) uses these utilities internally:

```typescript
import { createAskHumanTool } from '@agentforge/tools';
import { MemorySaver } from '@langchain/langgraph';

// Create agent with askHuman tool
const agent = createReActAgent({
  model: chatModel,
  tools: [createAskHumanTool()],
});

// Compile with checkpointer (required for interrupts)
const checkpointer = new MemorySaver();
const app = agent.compile({ checkpointer });

// Execute - will pause when askHuman is called
try {
  const result = await app.invoke(input, config);
} catch (error) {
  if (isNodeInterrupt(error)) {
    // Handle human request via SSE
    const request = extractHumanRequest(error);
    // Send to frontend, wait for response, resume execution
  }
}
```

See the [Human-in-the-Loop Guide](../guide/advanced/human-in-the-loop.md) for complete examples.

## Resource Management

### Connection Pool

Manage database and HTTP connections:

```typescript
import { createConnectionPool, createDatabasePool, createHttpPool } from '@agentforge/core';

// Generic connection pool
const pool = createConnectionPool({
  create: async () => createConnection(),
  destroy: async (conn) => conn.close(),
  validate: async (conn) => conn.isAlive(),
  min: 2,
  max: 10
});

const resource = await pool.acquire();
try {
  // Use resource
} finally {
  pool.release(resource);
}

// Database-specific pool
const dbPool = createDatabasePool({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  min: 2,
  max: 10
});

// HTTP client pool
const httpPool = createHttpPool({
  baseURL: 'https://api.example.com',
  maxConnections: 10,
  timeout: 5000
});
```

## Monitoring

### Health Checks

> **Note:** Health checker utilities are not currently exported from `@agentforge/core`.
> Implement custom health checks for your application as needed.

```typescript
// Example custom health checker implementation

class HealthChecker {
  constructor(private checks: Record<string, () => Promise<any>>) {}

  async getHealth(): Promise<{ healthy: boolean; checks: Record<string, any> }> {
    const results: Record<string, any> = {};
    let allHealthy = true;

    for (const [name, check] of Object.entries(this.checks)) {
      try {
        results[name] = await check();
      } catch (error) {
        results[name] = { healthy: false, error: error.message };
        allHealthy = false;
      }
    }

    return { healthy: allHealthy, checks: results };
  }
}

const healthChecker = new HealthChecker({
  database: async () => {
    // Check database connection
    return { healthy: true };
  },
  redis: async () => {
    // Check Redis connection
    return { healthy: true };
  }
});

const status = await healthChecker.getHealth();
```

### Metrics

```typescript
import { createMetrics } from '@agentforge/core';

const metrics = createMetrics('my-agent');

metrics.increment('requests');
metrics.gauge('active_connections', 5);
metrics.histogram('response_time', 150);
```

## Type Definitions

All exports include full TypeScript definitions. See the [source code](https://github.com/TVScoundrel/agentforge/tree/main/packages/core/src) for complete type information.

