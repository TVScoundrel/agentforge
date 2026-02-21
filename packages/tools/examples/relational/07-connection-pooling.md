# Connection Pooling Configuration

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../docs/LOGGING_STANDARDS.md).

This guide explains how to configure and tune connection pools for each supported database vendor.

---

## How Pooling Works

The connection manager maintains a pool of idle database connections. When a tool needs a connection, it borrows one from the pool rather than opening a new one. This dramatically reduces connection overhead:

```
Without pooling:  open → query → close → open → query → close → ...
With pooling:     borrow → query → return → borrow → query → return → ...
```

Connection pools are created automatically when you instantiate a `ConnectionManager`. You only need to configure them when the defaults aren't optimal for your workload.

---

## Basic Pool Configuration

```typescript
import { ConnectionManager } from '@agentforge/tools';

const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: {
    connectionString: 'postgresql://app:secret@localhost:5432/mydb',
    pool: {
      max: 20,                      // Maximum connections in the pool
      acquireTimeoutMillis: 30000,  // How long to wait for a free connection
      idleTimeoutMillis: 10000,     // Close idle connections after this duration
    },
  },
});
```

---

## Vendor-Specific Defaults

Each vendor has different defaults optimized for its connection model:

| Setting | PostgreSQL | MySQL | SQLite |
|---|---|---|---|
| `max` | 10 | 10 | 1 |
| `acquireTimeoutMillis` | 30000 | 30000 | 5000 |
| `idleTimeoutMillis` | 10000 | 10000 | 60000 |

> **SQLite note:** SQLite uses file-based locking, so `max: 1` is the safe default for write operations. For read-only workloads you can increase this, but concurrent writes will cause `SQLITE_BUSY` errors.

---

## Tuning by Workload

### Read-Heavy (Analytics, Reporting)

```typescript
const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: {
    connectionString: DB_URL,
    pool: {
      max: 30,                      // More connections for concurrent reads
      acquireTimeoutMillis: 10000,  // Fail fast if pool is exhausted
      idleTimeoutMillis: 30000,     // Keep connections warm longer
    },
  },
});
```

### Write-Heavy (Data Ingestion, ETL)

```typescript
const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: {
    connectionString: DB_URL,
    pool: {
      max: 10,                      // Fewer connections — writes need locks
      acquireTimeoutMillis: 60000,  // Wait longer for lock-heavy operations
      idleTimeoutMillis: 5000,      // Release idle connections quickly
    },
  },
});
```

### Multi-Agent (Shared Database)

When multiple agents share a database, divide the pool budget across agents:

```typescript
// Total budget: max_connections = 50 (PostgreSQL default: 100)
// Reserve 50% of max_connections for application pool

const analystPool = new ConnectionManager({
  vendor: 'postgresql',
  connection: { connectionString: DB_URL, pool: { max: 10 } },  // Read-only agent
});

const writerPool = new ConnectionManager({
  vendor: 'postgresql',
  connection: { connectionString: DB_URL, pool: { max: 5 } },   // Write agent
});

const reviewerPool = new ConnectionManager({
  vendor: 'postgresql',
  connection: { connectionString: DB_URL, pool: { max: 5 } },   // Review agent
});
// Total: 20 connections — leaves room for admin tools, migrations, etc.
```

---

## Pool Metrics

Monitor pool health to detect saturation:

```typescript
const metrics = manager.getPoolMetrics();

console.log(metrics);
// {
//   totalCount: 20,       // Pool max size
//   activeCount: 8,       // Connections currently in use
//   idleCount: 4,         // Connections waiting to be used
//   waitingCount: 0,      // Requests waiting for a connection
// }

// Alert when pool is saturated
if (metrics.waitingCount > 0) {
  console.log(`⚠ Pool saturated: ${metrics.waitingCount} requests waiting`);
}

// Alert when utilization is consistently high
const utilization = metrics.activeCount / metrics.totalCount;
if (utilization > 0.8) {
  console.log(`⚠ Pool utilization at ${(utilization * 100).toFixed(0)}% — consider increasing max`);
}
```

---

## Connection Lifecycle

```
┌─────────┐    acquire    ┌─────────┐    release    ┌─────────┐
│  Idle   │──────────────▶│ Active  │──────────────▶│  Idle   │
│  Pool   │               │  (in    │               │  Pool   │
│         │               │   use)  │               │         │
└────┬────┘               └─────────┘               └────┬────┘
     │                                                    │
     │ idleTimeoutMillis                                  │
     ▼                                                    │
┌─────────┐                                               │
│ Closed  │◀──────────────────────────────────────────────┘
│         │  (idle too long, or pool.disconnect())
└─────────┘
```

### Graceful Shutdown

Always destroy the connection manager when your application exits:

```typescript
// Clean shutdown — wait for active queries to finish
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await manager.disconnect();       // Closes all pool connections
  process.exit(0);
});

// Or with a timeout
process.on('SIGTERM', async () => {
  const timeout = setTimeout(() => process.exit(1), 10000);
  await manager.disconnect();
  clearTimeout(timeout);
  process.exit(0);
});
```

---

## Reconnection with Pooling

Reconnection and pooling work together. When a connection drops, the pool replaces it:

```typescript
const manager = new ConnectionManager(
  {
    vendor: 'postgresql',
    connection: {
      connectionString: DB_URL,
      pool: {
        max: 10,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 10000,
      },
    },
  },
  {
    enabled: true,
    maxAttempts: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
  },
);

// When a connection fails:
// 1. Pool removes the dead connection
// 2. Reconnection logic kicks in with exponential backoff
// 3. On success, a fresh connection is added to the pool
// 4. The waiting request is served
```

---

## Common Pool Sizing Formula

A good starting point for `max`:

```
max = (number of concurrent agents) × (avg tools per agent step) × 1.5
```

**Example:** 3 agents, each executing ~2 database tools per step:
```
max = 3 × 2 × 1.5 = 9 → use max: 10
```

### PostgreSQL `max_connections` Budget

```
PostgreSQL default max_connections = 100

Reserve:
  - Superuser connections:   3
  - Monitoring / admin:      5
  - Migration runners:       2
  - Available for app:      90

If running 2 application instances:
  - Per-instance pool max:  90 / 2 = 45
```

---

## Best Practices

1. **Don't over-provision** — More connections ≠ more throughput. Too many connections cause context switching overhead in the database.
2. **Monitor pool metrics** — Track `waiting` count as a saturation indicator.
3. **Use separate pools for separate concerns** — Read-only dashboards, write-heavy ETL, and real-time agents should each have their own pool.
4. **Close pools on exit** — Call `manager.disconnect()` to avoid connection leaks.
5. **Set `acquireTimeoutMillis`** — Fail fast rather than hanging indefinitely when the pool is exhausted.
6. **Match pool size to database limits** — Check `max_connections` and leave headroom for admin tools.
