# Advanced Tool Features Examples

This directory contains examples demonstrating the advanced tool features in AgentForge, including async execution, lifecycle management, composition, and testing utilities.

## Examples

### 1. Async Tool Execution (`async-execution.ts`)

Demonstrates parallel tool execution with resource management:

- **Concurrency limits** - Control how many tools run simultaneously
- **Priority-based scheduling** - Execute high-priority tools first
- **Retry policies** - Automatic retry with exponential backoff
- **Timeout handling** - Prevent tools from running too long
- **Execution metrics** - Track performance and success rates

**Run:**
```bash
npx tsx examples/tools/async-execution.ts
```

**Key Features:**
- Execute tools in parallel with `executeParallel()`
- Priority queue (critical > high > normal > low)
- Configurable retry with linear/exponential backoff
- Real-time metrics tracking

### 2. Tool Lifecycle Management (`lifecycle-management.ts`)

Demonstrates managed tools with resource pooling:

- **Initialization hooks** - Setup resources before first use
- **Cleanup hooks** - Properly dispose of resources
- **Health checks** - Monitor tool health
- **Resource pooling** - Share expensive resources (DB connections, API clients)
- **Auto-cleanup** - Automatic cleanup on process exit

**Run:**
```bash
npx tsx examples/tools/lifecycle-management.ts
```

**Key Features:**
- Database connection pooling
- Periodic health checks
- Execution statistics
- Graceful resource cleanup

### 3. Tool Composition (`composition.ts`)

Demonstrates composing tools into complex workflows:

- **Sequential execution** - Chain tools together
- **Parallel execution** - Run multiple tools simultaneously
- **Conditional execution** - Choose tools based on conditions
- **Retry wrapper** - Add retry logic to any tool
- **Timeout wrapper** - Add timeout to any tool
- **Cache wrapper** - Cache tool results

**Run:**
```bash
npx tsx examples/tools/composition.ts
```

**Key Features:**
- `sequential()` - Execute tools in order
- `parallel()` - Execute tools concurrently
- `conditional()` - Branch based on conditions
- `composeTool()` - Build complex workflows
- `retry()`, `timeout()`, `cache()` - Enhance any tool

### 4. Tool Mocking & Testing (`testing.ts`)

Demonstrates testing tools with mocks and simulators:

- **Mock tool factory** - Create mock tools with predefined responses
- **Deterministic responses** - Control tool outputs for testing
- **Latency simulation** - Simulate network delays
- **Error injection** - Test error handling
- **Invocation tracking** - Verify tool calls

**Run:**
```bash
npx tsx examples/tools/testing.ts
```

**Key Features:**
- `createMockTool()` - Mock individual tools
- `createToolSimulator()` - Simulate multiple tools
- Response matching
- Error rate simulation
- Invocation verification

## Common Patterns

### Pattern 1: Reliable Tool Execution

```typescript
import { createToolExecutor, retry, timeout } from '@agentforge/core';

const executor = createToolExecutor({
  maxConcurrent: 5,
  timeout: 30000,
  retryPolicy: {
    maxAttempts: 3,
    backoff: 'exponential',
  },
});

// Execute with automatic retry and timeout
const result = await executor.invoke(myTool, input);
```

### Pattern 2: Resource Management

```typescript
import { createManagedTool } from '@agentforge/core';

const dbTool = createManagedTool({
  name: 'database',
  async initialize() {
    this.context = await createPool({ /* config */ });
  },
  async execute(input) {
    const conn = await this.context.connect();
    try {
      return await conn.query(input.query);
    } finally {
      conn.release();
    }
  },
  async cleanup() {
    await this.context.end();
  },
});

await dbTool.initialize();
const result = await dbTool.invoke({ query: 'SELECT * FROM users' });
await dbTool.cleanup();
```

### Pattern 3: Complex Workflows

```typescript
import { composeTool, parallel, sequential, conditional } from '@agentforge/core';

const workflow = composeTool({
  name: 'research-workflow',
  steps: [
    parallel([searchTool, fetchTool]),      // Gather data
    sequential([parseTool, validateTool]),  // Process data
    conditional({                            // Save if valid
      condition: (result) => result.valid,
      onTrue: saveTool,
      onFalse: skipTool,
    }),
  ],
});

const result = await workflow.invoke(input);
```

### Pattern 4: Testing with Mocks

```typescript
import { createMockTool, createToolSimulator } from '@agentforge/core';

// Create mock for testing
const mockAPI = createMockTool({
  name: 'api',
  responses: [
    { input: { id: '123' }, output: { data: 'test' } },
    { input: { id: 'error' }, error: new Error('Not found') },
  ],
  latency: { min: 100, max: 500 },
});

// Use in tests
const result = await mockAPI.invoke({ id: '123' });
expect(result).toEqual({ data: 'test' });
expect(mockAPI.getInvocations()).toHaveLength(1);
```

## Next Steps

- Explore the [streaming examples](../streaming/) for real-time features
- Check the [API documentation](../../src/tools/) for detailed reference
- See the [tests](../../src/tools/__tests__/) for more usage examples

## Related Documentation

- [Phase 5.2 Design Document](../../../docs/phase-5-design.md#phase-52-advanced-tool-features)
- [Tool System Overview](../../src/tools/README.md)
- [Testing Guide](../../../docs/testing-guide.md)

