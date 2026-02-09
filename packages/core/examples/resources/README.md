# Resource Management Examples

This directory contains examples demonstrating resource management and optimization features in AgentForge, including connection pooling, memory management, batch processing, and circuit breakers.

## Examples

### 1. Connection Pooling (`connection-pooling.ts`)

Demonstrates database and HTTP connection pooling:

- **Database pools** - PostgreSQL/MySQL connection pooling
- **HTTP pools** - HTTP client pooling with keep-alive
- **Pool configuration** - Min/max sizes, timeouts, eviction
- **Health checks** - Automatic connection validation
- **Statistics** - Pool usage and performance metrics
- **Graceful shutdown** - Drain and clear operations

**Run:**
```bash
npx tsx examples/resources/connection-pooling.ts
```

**Key Features:**
- Automatic connection reuse
- Connection health monitoring
- Idle connection eviction
- Acquire timeout handling
- Pool statistics tracking

### 2. Memory Management (`memory-management.ts`)

Demonstrates memory tracking and management:

- **Usage monitoring** - Track heap, external, and total memory
- **Threshold alerts** - Configurable memory thresholds
- **Cleanup handlers** - Register cleanup functions
- **Leak detection** - Detect memory growth patterns
- **Automatic cleanup** - Trigger cleanup on limits
- **Force GC** - Manual garbage collection

**Run:**
```bash
npx tsx examples/resources/memory-management.ts
```

**Key Features:**
- Real-time memory monitoring
- Configurable thresholds
- Automatic cleanup triggers
- Memory leak detection
- Cleanup handler registration

### 3. Batch Processing (`batch-processing.ts`)

Demonstrates efficient request batching:

- **Automatic batching** - Batch requests automatically
- **Size optimization** - Configurable batch sizes
- **Timeout handling** - Max wait time for batches
- **Error handling** - Per-batch and per-item errors
- **Manual flushing** - Force batch processing
- **Statistics** - Batch performance metrics

**Run:**
```bash
npx tsx examples/resources/batch-processing.ts
```

**Key Features:**
- Automatic request batching
- Configurable batch size and wait time
- Error handling with fallbacks
- Batch statistics tracking
- Manual flush support

### 4. Circuit Breaker (`circuit-breaker.ts`)

Demonstrates fault tolerance with circuit breakers:

- **Three states** - Closed, open, half-open
- **Failure detection** - Configurable failure threshold
- **Automatic recovery** - Reset timeout and half-open testing
- **Fallback strategies** - Graceful degradation
- **Selective tripping** - Filter which errors trip the circuit
- **Function wrapping** - Wrap any async function

**Run:**
```bash
npx tsx examples/resources/circuit-breaker.ts
```

**Key Features:**
- Three-state circuit breaker
- Configurable failure threshold
- Automatic recovery testing
- Fallback support
- State change callbacks

## Common Patterns

### Pattern 1: Database Connection Pooling

```typescript
import { createDatabasePool } from '@agentforge/core';

const pool = createDatabasePool({
  config: {
    host: 'localhost',
    database: 'myapp',
    user: 'admin',
    password: 'secret',
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeout: 30000,
    idleTimeout: 60000,
  },
  healthCheck: {
    enabled: true,
    interval: 30000,
    query: 'SELECT 1',
  },
});

// Use the pool
const result = await pool.query('SELECT * FROM users');

// Cleanup
await pool.drain();
await pool.clear();
```

### Pattern 2: Memory Monitoring

```typescript
import { createMemoryManager } from '@agentforge/core';

const memoryManager = createMemoryManager({
  maxMemory: 512 * 1024 * 1024, // 512 MB
  thresholdPercentage: 80,
  onThreshold: (stats) => {
    console.warn(`Memory at ${stats.percentage}%`);
  },
  onLimit: async (stats) => {
    await cleanup();
  },
});

// Register cleanup handlers
memoryManager.registerCleanup('cache', async () => {
  cache.clear();
});

memoryManager.start();
```

### Pattern 3: Request Batching

```typescript
import { createBatchProcessor } from '@agentforge/core';

const batcher = createBatchProcessor({
  maxBatchSize: 10,
  maxWaitTime: 100,
  processor: async (batch) => {
    return await api.batchQuery(batch);
  },
});

// Add items - they'll be batched automatically
const result1 = batcher.add(query1);
const result2 = batcher.add(query2);

const [res1, res2] = await Promise.all([result1, result2]);
```

### Pattern 4: Circuit Breaker Protection

```typescript
import { createCircuitBreaker } from '@agentforge/core';

const breaker = createCircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000,
  onStateChange: (state) => {
    console.log(`Circuit: ${state}`);
  },
});

// Wrap your function
const protectedCall = breaker.wrap(async (input) => {
  return await unstableAPI.call(input);
});

// Use with fallback
try {
  const result = await protectedCall(input);
} catch (error) {
  if (error.message === 'Circuit breaker is open') {
    return fallbackResponse;
  }
  throw error;
}
```

## Next Steps

- Explore the [tool examples](../tools/) for advanced tool features
- Check the [streaming examples](../streaming/) for real-time features
- See the [API documentation](../../src/resources/) for detailed reference

## Related Documentation

- [Phase 5.3 Design Document](../../../docs/phase-5-design.md#phase-53-resource-management--optimization)
- [Resource Management Overview](../../src/resources/README.md)
- [Production Best Practices](../../../docs/production-guide.md)

