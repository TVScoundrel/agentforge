# API Reference — ConnectionManager

`ConnectionManager` handles database connections for PostgreSQL, MySQL, and SQLite using Drizzle ORM. It provides lifecycle management, connection pooling, health checks, and automatic reconnection with exponential backoff.

## Import

```typescript
import { ConnectionManager, ConnectionState } from '@agentforge/tools';
import type { ConnectionConfig, PoolConfig, ReconnectionConfig, ConnectionEvent } from '@agentforge/tools';
```

## Constructor

```typescript
new ConnectionManager(config: ConnectionConfig, reconnectionConfig?: Partial<ReconnectionConfig>)
```

### ConnectionConfig

A discriminated union — the `connection` property shape depends on the `vendor`:

```typescript
type ConnectionConfig =
  | { vendor: 'postgresql'; connection: PostgreSQLConnectionConfig | string }
  | { vendor: 'mysql';      connection: MySQLConnectionConfig | string }
  | { vendor: 'sqlite';     connection: SQLiteConnectionConfig | string };
```

When a `string` is passed, it is treated as a connection URL (PostgreSQL/MySQL) or file path (SQLite).

### PostgreSQLConnectionConfig

| Property | Type | Default | Description |
|---|---|---|---|
| `connectionString` | `string` | — | Full PostgreSQL URL |
| `host` | `string` | — | Host address |
| `port` | `number` | `5432` | Port number |
| `database` | `string` | — | Database name |
| `user` | `string` | — | Username |
| `password` | `string` | — | Password |
| `ssl` | `boolean \| Record` | — | SSL configuration |
| `connectionTimeoutMillis` | `number` | — | Connection timeout (ms) |
| `pool` | `PoolConfig` | — | Pool configuration |

### MySQLConnectionConfig

| Property | Type | Default | Description |
|---|---|---|---|
| `host` | `string` | — | Host address |
| `port` | `number` | `3306` | Port number |
| `database` | `string` | — | Database name |
| `user` | `string` | — | Username |
| `password` | `string` | — | Password |
| `ssl` | `boolean \| Record` | — | SSL configuration |
| `connectTimeout` | `number` | — | Connection timeout (ms) |
| `pool` | `PoolConfig` | — | Pool configuration |

### SQLiteConnectionConfig

| Property | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | — | File path or `':memory:'` |
| `pool` | `PoolConfig` | — | Accepted for API consistency; no runtime effect |

### PoolConfig

| Property | Type | Description |
|---|---|---|
| `max` | `number` | Maximum connections in pool (must be >= 1) |
| `acquireTimeoutMillis` | `number` | Max wait time for a connection (ms) |
| `idleTimeoutMillis` | `number` | Time before idle connections are closed (ms) |

### ReconnectionConfig

| Property | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `false` | Enable automatic reconnection |
| `maxAttempts` | `number` | `5` | Max reconnection attempts (0 = infinite) |
| `baseDelayMs` | `number` | `1000` | Base delay for exponential backoff (ms) |
| `maxDelayMs` | `number` | `30000` | Maximum backoff delay (ms) |

---

## Methods

### connect()

```typescript
async connect(): Promise<void>
```

Establishes the database connection. If already connected, returns immediately. If a connection attempt is in-flight, waits for it. Cancels any pending reconnection timer first.

### disconnect()

```typescript
async disconnect(): Promise<void>
```

Closes the connection and cancels pending reconnection. Waits for any in-flight `connect()` to complete before closing. Does **not** remove event listeners — use `dispose()` for full cleanup.

### dispose()

```typescript
async dispose(): Promise<void>
```

Calls `disconnect()` and then `removeAllListeners()`. Use when disposing of the manager entirely.

### execute(query)

```typescript
async execute(query: SQL): Promise<unknown>
```

Executes a Drizzle SQL template query. Handles vendor-specific result normalization:
- **SQLite:** Uses `.all()` for SELECT, falls back to `.run()` for DML/DDL. Normalizes `changes` → `affectedRows`.
- **MySQL:** Unwraps `[rows, fields]` tuples to return just rows.
- **PostgreSQL:** Returns rows directly.

### executeInConnection(callback)

```typescript
async executeInConnection<T>(
  callback: (execute: (query: SQL) => Promise<unknown>) => Promise<T>
): Promise<T>
```

Executes a callback with a dedicated connection/session (required for multi-statement transactions). Automatically handles connection acquisition and release.

### isConnected()

```typescript
isConnected(): boolean
```

Returns `true` if the connection is in `CONNECTED` state.

### isHealthy()

```typescript
async isHealthy(): Promise<boolean>
```

Runs a lightweight health check query (`SELECT 1`) and returns whether it succeeds.

### getState()

```typescript
getState(): ConnectionState
```

Returns the current `ConnectionState` enum value.

### getVendor()

```typescript
getVendor(): DatabaseVendor
```

Returns the configured vendor (`'postgresql'`, `'mysql'`, or `'sqlite'`).

### getPoolMetrics()

```typescript
getPoolMetrics(): {
  totalCount: number;
  activeCount: number;
  idleCount: number;
  waitingCount: number;
}
```

Returns pool metrics. PostgreSQL provides real metrics via `pg.Pool`. MySQL returns zero values (driver limitation). SQLite returns 0 or 1 based on connection status.

### close()

```typescript
async close(): Promise<void>
```

Low-level connection close. Prefer `disconnect()` or `dispose()` for lifecycle management.

---

## Events

`ConnectionManager` extends `EventEmitter` and emits:

| Event | Payload | Description |
|---|---|---|
| `'connected'` | — | Connection established |
| `'disconnected'` | — | Connection closed |
| `'error'` | `Error` | Connection error occurred |
| `'reconnecting'` | `{ attempt, maxAttempts, delayMs }` | Reconnection attempt scheduled |

---

## ConnectionState

```typescript
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}
```
