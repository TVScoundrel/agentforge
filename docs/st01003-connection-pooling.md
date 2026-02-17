# ST-01003: Connection Pooling Configuration

## Overview

This story implements connection pooling configuration for the AgentForge relational database tool. It provides a vendor-agnostic `PoolConfig` interface that allows users to configure connection pool settings for PostgreSQL, MySQL, and SQLite databases.

## Implementation Details

### PoolConfig Interface

The `PoolConfig` interface provides pool configuration options that are supported across database vendors:

```typescript
export interface PoolConfig {
  max?: number;                    // Maximum number of connections in pool
  acquireTimeoutMillis?: number;   // Timeout for acquiring a connection
  idleTimeoutMillis?: number;      // Timeout for idle connections
}
```

**Note**: The interface is intentionally minimal to include only options that are widely supported across vendors. Vendor-specific options can be passed through the vendor-specific connection config interfaces.

### Vendor-Specific Behavior

#### PostgreSQL (pg.Pool)

Pool configuration is mapped to `pg.Pool` options:
- `max` → `max`
- `idleTimeoutMillis` → `idleTimeoutMillis`
- `acquireTimeoutMillis` → `connectionTimeoutMillis`

**Note**: `pg.Pool` does not support a `min` connections option. The pool creates connections on-demand up to the `max` limit.

#### MySQL (mysql2.createPool)

Pool configuration is mapped to `mysql2` pool options:
- `max` → `connectionLimit`
- `acquireTimeoutMillis` → `acquireTimeout`
- `idleTimeoutMillis` → `idleTimeout`

#### SQLite (better-sqlite3)

SQLite uses a single connection with internal locking. Pool configuration is accepted for API consistency but may not affect runtime behavior, as SQLite doesn't support traditional connection pooling.

### Pool Validation

The `validatePoolConfig()` function ensures all pool configuration values are valid:
- `max` must be >= 1
- `acquireTimeoutMillis` must be >= 0
- `idleTimeoutMillis` must be >= 0

Invalid configurations throw descriptive errors during initialization.

### Pool Metrics

The `getPoolMetrics()` method provides real-time pool statistics:

```typescript
const metrics = manager.getPoolMetrics();
// Returns: { totalCount, activeCount, idleCount, waitingCount }
```

- **PostgreSQL**: Uses `pg.Pool` public API properties (`totalCount`, `idleCount`, `waitingCount`). `activeCount` is calculated as `totalCount - idleCount`.
- **MySQL**: Returns neutral metrics (all zeros) since `mysql2.Pool` does not expose a stable public API for pool statistics.
- **SQLite**: Returns `totalCount: 1` and `activeCount: 1` when connection is open, `0` otherwise.

## Usage Examples

### PostgreSQL with Pool Configuration

```typescript
import { ConnectionManager } from '@agentforge/tools';

const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'user',
    password: 'pass',
    pool: {
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 10000,
    },
  },
});

await manager.initialize();

// Get pool metrics
const metrics = manager.getPoolMetrics();
console.log(`Total connections: ${metrics.totalCount}`);
console.log(`Active connections: ${metrics.activeCount}`);
console.log(`Idle connections: ${metrics.idleCount}`);
console.log(`Waiting requests: ${metrics.waitingCount}`);
```

### MySQL with Pool Configuration

```typescript
const manager = new ConnectionManager({
  vendor: 'mysql',
  connection: {
    host: 'localhost',
    port: 3306,
    database: 'mydb',
    user: 'user',
    password: 'pass',
    pool: {
      max: 20,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 30000,
    },
  },
});

await manager.initialize();
```

### SQLite (Pool Config Logged)

```typescript
const manager = new ConnectionManager({
  vendor: 'sqlite',
  connection: {
    url: './data/mydb.sqlite',
    pool: {
      // Pool config is validated and logged but not applied
      max: 1,
    },
  },
});

await manager.initialize();
```

## Testing

The implementation includes comprehensive unit tests:

### Validation Tests
- Max connections less than 1
- Negative acquire timeout
- Negative idle timeout

### Functional Tests
- Valid pool configuration acceptance
- Pool metrics for uninitialized connection
- Pool metrics for SQLite connection
- Pool metrics for MySQL (neutral values)

All tests pass with conditional execution for SQLite tests when bindings are available.

## Related Stories

- **ST-01001**: Setup Drizzle ORM Dependencies and Project Structure
- **ST-01002**: Implement Connection Manager
- **ST-01004**: Implement Query Builder (depends on this story)

## Notes

- Connection reuse, timeout handling, and graceful shutdown are handled by the underlying drivers (pg.Pool, mysql2.Pool)
- Pool exhaustion and retry logic are configured via pool options and handled by the drivers
- SQLite doesn't support traditional pooling but validates pool config for consistency

