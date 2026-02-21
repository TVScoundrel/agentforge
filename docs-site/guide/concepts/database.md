# Database Tools

AgentForge includes a vendor-agnostic relational database toolkit that lets agents connect to PostgreSQL, MySQL, and SQLite databases, run type-safe queries, inspect schemas, and perform advanced operations like transactions, batch processing, and streaming.

::: tip Related Resources
- **[Database Agent Tutorial](/tutorials/database-agent)** — Build a database-powered agent step by step
- **[API Reference — Relational Tools](/api/tools#relational-database-tools-6)** — All tool signatures and response shapes
- **[SQL Injection Prevention](https://github.com/TVScoundrel/agentforge/blob/main/docs/sql-injection-prevention-best-practices.md)** — Security best practices
:::

## Overview

The relational database module provides:

| Capability | What It Does |
|---|---|
| **ConnectionManager** | Vendor-agnostic connection lifecycle, pooling, reconnection |
| **6 LangChain Tools** | Query, Select, Insert, Update, Delete, Schema Introspection |
| **Transactions** | ACID support with isolation levels and nested savepoints |
| **Batch Operations** | Chunked insert/update/delete with retry and progress tracking |
| **Result Streaming** | Memory-efficient processing of large result sets |
| **Security** | SQL sanitization, parameterized queries, DDL blocking |

## Installation

The database tools are part of `@agentforge/tools`. Install it along with the driver for your database:

::: code-group

```bash [PostgreSQL]
pnpm add @agentforge/tools pg
# TypeScript users also need types:
pnpm add -D @types/pg
```

```bash [MySQL]
pnpm add @agentforge/tools mysql2
```

```bash [SQLite]
pnpm add @agentforge/tools better-sqlite3
# TypeScript users also need types:
pnpm add -D @types/better-sqlite3
```

:::

::: warning Peer Dependencies
Database drivers are **optional peer dependencies**. If you try to connect without the right driver installed, the framework throws a helpful `MissingPeerDependencyError` with install instructions.
:::

## Connecting to a Database

### ConnectionManager

`ConnectionManager` handles the full connection lifecycle — creation, pooling, reconnection, health checks, and cleanup.

```typescript
import { ConnectionManager } from '@agentforge/tools';

// PostgreSQL — connection string
const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://user:pass@localhost:5432/mydb',
});

// MySQL — connection string
const mysqlManager = new ConnectionManager({
  vendor: 'mysql',
  connection: 'mysql://user:pass@localhost:3306/mydb',
});

// SQLite — file path (or ':memory:' for in-memory)
const sqliteManager = new ConnectionManager({
  vendor: 'sqlite',
  connection: 'path/to/database.db',
});

await manager.connect();
console.log(manager.isConnected()); // true
```

### Connection Pooling

PostgreSQL and MySQL support connection pooling for concurrent workloads:

```typescript
const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: {
    connectionString: 'postgresql://user:pass@localhost:5432/mydb',
    pool: {
      max: 20,                   // Max connections
      acquireTimeoutMillis: 5000, // Wait time for a connection
      idleTimeoutMillis: 30000,   // Close idle connections after 30s
    },
  },
});

await manager.connect();

// Monitor pool health
const metrics = manager.getPoolMetrics();
console.log(metrics);
// { totalCount: 20, activeCount: 3, idleCount: 2, waitingCount: 0 }
```

### Auto-Reconnection

Enable automatic reconnection with exponential backoff:

```typescript
const manager = new ConnectionManager(
  { vendor: 'postgresql', connection: DB_URL },
  {
    enabled: true,
    maxAttempts: 5,      // 0 = infinite
    baseDelayMs: 1000,   // First retry after 1s
    maxDelayMs: 30000,   // Cap at 30s between retries
  },
);

// Listen for lifecycle events
manager.on('connected', () => console.log('Connected'));
manager.on('disconnected', () => console.log('Disconnected'));
manager.on('reconnecting', ({ attempt, maxAttempts, delayMs }) => {
  console.log(`Reconnecting: attempt ${attempt}/${maxAttempts} in ${delayMs}ms`);
});
manager.on('error', (err) => console.error('Connection error:', err.message));
```

### Graceful Shutdown

Always clean up connections when your application exits:

```typescript
process.on('SIGTERM', async () => {
  await manager.disconnect();
  process.exit(0);
});
```

## CRUD Tools

All six relational tools follow the same pattern: pass the `vendor` and `connectionString` to each `.invoke()` call, and the tool manages connection internals.

::: info Tool Return Pattern
Every tool returns `{ success: true, ... }` on success or `{ success: false, error: string }` on failure. **Tools never throw** — always check `result.success`.
:::

### relationalQuery — Raw SQL

Execute arbitrary SQL with parameter binding:

```typescript
import { relationalQuery } from '@agentforge/tools';

const result = await relationalQuery.invoke({
  sql: 'SELECT id, email FROM users WHERE status = $1',
  params: ['active'],
  vendor: 'postgresql',
  connectionString: DB_URL,
});

if (result.success) {
  console.log(result.rows);     // [{ id: 1, email: 'alice@...' }, ...]
  console.log(result.rowCount); // 42
}
```

Supports positional (`$1`, `?`) and named (`:name`) parameters depending on the vendor.

### relationalSelect — Type-Safe Queries

Build SELECT queries without writing SQL:

```typescript
import { relationalSelect } from '@agentforge/tools';

const result = await relationalSelect.invoke({
  table: 'orders',
  columns: ['id', 'total', 'status'],
  where: [
    { column: 'status', operator: 'eq', value: 'pending' },
    { column: 'total', operator: 'gt', value: 100 },
  ],
  orderBy: [{ column: 'total', direction: 'desc' }],
  limit: 10,
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// result.rows → [{ id: 5, total: 250, status: 'pending' }, ...]
```

**Supported operators:** `eq`, `ne`, `gt`, `lt`, `gte`, `lte`, `like`, `in`, `notIn`, `isNull`, `isNotNull`

### relationalInsert — Insert Rows

Insert single rows or batch arrays:

```typescript
import { relationalInsert } from '@agentforge/tools';

// Single insert with RETURNING
const result = await relationalInsert.invoke({
  table: 'users',
  data: { email: 'alice@example.com', name: 'Alice' },
  returning: { mode: 'id', idColumn: 'id' },
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// result.insertedIds → [42]

// Batch insert (1000 rows in chunks of 200)
const batchResult = await relationalInsert.invoke({
  table: 'events',
  data: events, // Array of 1000 objects
  batch: { batchSize: 200 },
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// batchResult.batch.successfulItems → 1000
```

**Returning modes:** `'none'` (default), `'id'` (returns primary key values), `'row'` (returns full inserted rows)

### relationalUpdate — Update Rows

```typescript
import { relationalUpdate } from '@agentforge/tools';

const result = await relationalUpdate.invoke({
  table: 'users',
  data: { status: 'verified' },
  where: [{ column: 'email', operator: 'eq', value: 'alice@example.com' }],
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// result.rowCount → 1
```

::: warning Safety Guard
Updates **require** a `where` clause by default. To update all rows, you must explicitly set `allowFullTableUpdate: true`.
:::

### relationalDelete — Delete Rows

```typescript
import { relationalDelete } from '@agentforge/tools';

// Hard delete
const result = await relationalDelete.invoke({
  table: 'sessions',
  where: [{ column: 'expires_at', operator: 'lt', value: '2026-01-01' }],
  vendor: 'postgresql',
  connectionString: DB_URL,
});

// Soft delete (sets deleted_at column instead)
const softResult = await relationalDelete.invoke({
  table: 'users',
  where: [{ column: 'id', operator: 'eq', value: 42 }],
  softDelete: { column: 'deleted_at' },
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// softResult.softDeleted → true
```

### relationalGetSchema — Schema Introspection

Discover tables, columns, keys, and indexes:

```typescript
import { relationalGetSchema } from '@agentforge/tools';

const result = await relationalGetSchema.invoke({
  vendor: 'postgresql',
  connectionString: DB_URL,
  tables: ['users', 'orders'],  // Optional filter
  cacheTtlMs: 300000,           // Cache for 5 minutes
});

if (result.success) {
  for (const table of result.schema.tables) {
    console.log(`${table.name}: ${table.columns.length} columns`);
    console.log('  PK:', table.primaryKey);
    console.log('  FKs:', table.foreignKeys.length);
  }
}
```

Schema results include `columns` (with `isNullable`, `isPrimaryKey`, `defaultValue`), `primaryKey`, `foreignKeys`, and `indexes` for each table.

## Transactions

Wrap multi-step operations in ACID transactions using `withTransaction`:

```typescript
import { withTransaction, ConnectionManager } from '@agentforge/tools';

const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: DB_URL,
});
await manager.connect();

const transferResult = await withTransaction(manager, async (tx) => {
  await tx.execute(sql`UPDATE accounts SET balance = balance - 100 WHERE id = 1`);
  await tx.execute(sql`UPDATE accounts SET balance = balance + 100 WHERE id = 2`);
  return { success: true };
}, {
  isolationLevel: 'serializable',
  timeoutMs: 5000,
});
// Auto-commits on success, auto-rolls back on error
```

### Isolation Levels

| Level | Dirty Read | Non-Repeatable Read | Phantom Read | Use Case |
|---|---|---|---|---|
| `read uncommitted` | Possible | Possible | Possible | Fastest — analytics on stale data |
| `read committed` | No | Possible | Possible | Default — general purpose |
| `repeatable read` | No | No | Possible | Inventory, counters |
| `serializable` | No | No | No | Financial transfers |

### Nested Savepoints

Create savepoints for partial rollback within a transaction:

```typescript
await withTransaction(manager, async (tx) => {
  await tx.execute(sql`INSERT INTO orders (...) VALUES (...)`);

  // Nested operation with its own savepoint
  await tx.withSavepoint(async (nested) => {
    await nested.execute(sql`INSERT INTO order_items (...) VALUES (...)`);
    // If this fails, only this savepoint rolls back
  });
});
```

## Batch Operations

All write tools (Insert, Update, Delete) support batched execution for large datasets:

```typescript
const result = await relationalInsert.invoke({
  table: 'products',
  data: thousandProducts,
  batch: {
    batchSize: 200,          // 200 rows per chunk
    continueOnError: true,   // Don't stop on first failure
    maxRetries: 3,           // Retry failed chunks up to 3 times
    retryDelayMs: 1000,      // 1s between retries
  },
  vendor: 'postgresql',
  connectionString: DB_URL,
});

if (result.batch) {
  console.log(`Inserted: ${result.batch.successfulItems}`);
  console.log(`Failed: ${result.batch.failedItems}`);

  for (const failure of result.batch.failures ?? []) {
    console.log(`Batch ${failure.batchIndex}: ${failure.error}`);
  }
}
```

### Recommended Batch Sizes

| Vendor | Insert | Update | Rationale |
|---|---|---|---|
| PostgreSQL | 200–500 | 100–200 | Handles large parameter counts well |
| MySQL | 100–200 | 50–100 | `max_allowed_packet` limits payload size |
| SQLite | 50–100 | 25–50 | File-based locking; smaller = less lock time |

## Result Streaming

For queries returning thousands of rows, use streaming to avoid loading everything into memory:

```typescript
const result = await relationalSelect.invoke({
  table: 'events',
  streaming: {
    enabled: true,
    chunkSize: 1000,    // Fetch 1000 rows at a time
    maxRows: 100000,    // Cap at 100K rows
    sampleSize: 50,     // Include 50 rows in the response
  },
  vendor: 'postgresql',
  connectionString: DB_URL,
});

// result.rows contains the sampled rows
// result.streaming.streamedRowCount has the total count processed
```

Streaming uses OFFSET-based pagination internally. For memory-constrained environments, this reduces peak memory from O(total rows) to O(chunk size).

## Security

### SQL Sanitization

The tools enforce multiple layers of security automatically:

1. **Parameterized queries** — All values are bound via Drizzle ORM's SQL template system, preventing SQL injection at the driver level.

2. **DDL blocking** — Dangerous statements (`CREATE`, `DROP`, `TRUNCATE`, `ALTER`) are rejected by default.

3. **WHERE requirement** — `UPDATE` and `DELETE` operations require a `WHERE` clause unless explicitly opted out, preventing accidental full-table modifications.

4. **Identifier validation** — All table and column names are validated against `^[a-zA-Z_][a-zA-Z0-9_]*$` to prevent injection through identifiers.

5. **Parameter enforcement** — `INSERT`, `UPDATE`, and `DELETE` queries in raw SQL mode must use parameterized placeholders.

::: danger Never Interpolate User Input
Always use parameterized queries — never concatenate user input into SQL strings:

```typescript
// ✅ Safe — parameterized
await relationalQuery.invoke({
  sql: 'SELECT * FROM users WHERE name = $1',
  params: [userInput],
  vendor: 'postgresql',
  connectionString: DB_URL,
});

// ❌ Dangerous — SQL injection risk
await relationalQuery.invoke({
  sql: `SELECT * FROM users WHERE name = '${userInput}'`,
  vendor: 'postgresql',
  connectionString: DB_URL,
});
```
:::

### Error Sanitization

Database errors are sanitized before being returned to the agent. Internal details like connection strings, file paths, and driver-specific messages are stripped to prevent information leakage.

## Error Handling

Since tools return `{ success: false, error }` instead of throwing, use pattern matching:

```typescript
const result = await relationalInsert.invoke({
  table: 'users',
  data: { email, name },
  returning: { mode: 'id', idColumn: 'id' },
  vendor: 'postgresql',
  connectionString: DB_URL,
});

if (!result.success) {
  if (result.error?.includes('unique') || result.error?.includes('duplicate')) {
    return { error: 'Email already exists' };
  }
  if (result.error?.includes('foreign key')) {
    return { error: 'Referenced record not found' };
  }
  return { error: result.error };
}
```

## Vendor Differences

Most APIs are identical across vendors. Notable differences:

| Feature | PostgreSQL | MySQL | SQLite |
|---|---|---|---|
| Connection pooling | Full (pg.Pool) | Full (mysql2.createPool) | N/A (single file) |
| Placeholder syntax | `$1, $2, ...` | `?, ?, ...` | `?, ?, ...` |
| RETURNING clause | Native | Emulated | Emulated |
| Schema namespace | `public` (default) | Database name | `main` |
| Isolation levels | All 4 | All 4 | `read uncommitted` via PRAGMA |
| Pool metrics | Full | Basic | Neutral values |

## What's Next?

- **[Database Agent Tutorial](/tutorials/database-agent)** — Build a complete agent that explores and queries databases
- **[API Reference](/api/tools#relational-database-tools-6)** — Full parameter and response documentation for every tool
- **[Advanced Examples](https://github.com/TVScoundrel/agentforge/tree/main/packages/tools/examples/relational)** — Transactions, batch operations, streaming, multi-agent systems, and more
