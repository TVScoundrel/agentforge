# Error Handling Best Practices

This guide covers common error scenarios and recommended handling strategies for the relational database tools.

## Connection Errors

### Missing Peer Dependency

The module checks for required drivers at construction time:

```typescript
import { ConnectionManager, MissingPeerDependencyError } from '@agentforge/tools';

try {
  const manager = new ConnectionManager({
    vendor: 'postgresql',
    connection: 'postgresql://localhost:5432/mydb',
  });
} catch (error) {
  if (error instanceof MissingPeerDependencyError) {
    console.error(error.message);
    // "Missing peer dependency: pg. Install it with: pnpm add pg @types/pg"
  }
}
```

### Connection Failure

```typescript
const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://user:wrong_password@localhost:5432/mydb',
});

try {
  await manager.connect();
} catch (error) {
  console.error('Connection failed:', error.message);
  // Check the state
  console.log('State:', manager.getState()); // 'error'
}
```

### Handling Connection Events

```typescript
const manager = new ConnectionManager(
  { vendor: 'postgresql', connection: 'postgresql://...' },
  { enabled: true, maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 10000 },
);

manager.on('connected', () => {
  console.log('Connected successfully');
});

manager.on('disconnected', () => {
  console.log('Disconnected');
});

manager.on('error', (err: Error) => {
  console.error('Connection error:', err.message);
});

manager.on('reconnecting', ({ attempt, maxAttempts, delayMs }) => {
  console.log(`Reconnecting (${attempt}/${maxAttempts}) in ${delayMs}ms`);
});

await manager.connect();
```

## Query Errors

### SQL Validation Errors

The query executor validates SQL before execution:

```typescript
import { relationalQuery } from '@agentforge/tools';

// Dangerous DDL is blocked
try {
  await relationalQuery.invoke({
    sql: 'DROP TABLE users',
    vendor: 'postgresql',
    connectionString: 'postgresql://...',
  });
} catch (error) {
  // Error: Dangerous SQL operations (CREATE, DROP, TRUNCATE, ALTER) are not allowed
}

// Missing parameters for mutation queries
try {
  await relationalQuery.invoke({
    sql: 'DELETE FROM users',  // No WHERE clause and no params
    vendor: 'postgresql',
    connectionString: 'postgresql://...',
  });
} catch (error) {
  // Error: Mutation query requires parameter binding
}
```

### Input Validation Errors

The type-safe tools use Zod schemas that provide clear validation messages:

```typescript
import { relationalSelect } from '@agentforge/tools';

try {
  await relationalSelect.invoke({
    table: '',  // Empty table name
    vendor: 'postgresql',
    connectionString: 'postgresql://...',
  });
} catch (error) {
  // Zod validation error with field-level details
  console.error(error.message);
}
```

## Tool Error Patterns

### Wrapping Tool Calls

For agent integrations, wrap tool calls to provide graceful degradation:

```typescript
async function safeToolCall<T>(
  toolFn: () => Promise<T>,
  fallbackMessage: string,
): Promise<T | string> {
  try {
    return await toolFn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Tool call failed: ${message}`);
    return fallbackMessage;
  }
}

// Usage
const result = await safeToolCall(
  () => relationalSelect.invoke({
    table: 'users',
    vendor: 'postgresql',
    connectionString: 'postgresql://...',
  }),
  'Unable to query the users table. The database may be unavailable.',
);
```

### Connection Lifecycle with try/finally

Always use `try/finally` for manual connection management:

```typescript
const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://...',
});

try {
  await manager.connect();

  // ... your operations ...

} finally {
  // Always disconnect — even if an error occurs
  await manager.disconnect();
}
```

### Using dispose() for One-Shot Operations

If you won't reuse the manager, call `dispose()` to also remove event listeners:

```typescript
const manager = new ConnectionManager({
  vendor: 'sqlite',
  connection: ':memory:',
});

try {
  await manager.connect();
  const result = await manager.execute(sql`SELECT 1 + 1 AS answer`);
  console.log(result);
} finally {
  await manager.dispose(); // disconnect + removeAllListeners
}
```

## Transaction Error Handling

### Automatic Rollback

Transactions automatically rollback on error:

```typescript
import { ConnectionManager, withTransaction } from '@agentforge/tools';
import { sql } from 'drizzle-orm';

const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://...',
});
await manager.connect();

try {
  await withTransaction(manager, async (tx) => {
    await tx.execute(sql`INSERT INTO orders (user_id, total) VALUES (${1}, ${50})`);

    // This will cause the entire transaction to rollback
    throw new Error('Simulated failure');
  });
} catch (error) {
  console.log('Transaction rolled back:', error.message);
  // Neither INSERT was committed
} finally {
  await manager.disconnect();
}
```

### Savepoint Recovery

Use savepoints to recover from partial failures within a transaction:

```typescript
await withTransaction(manager, async (tx) => {
  // This succeeds
  await tx.execute(sql`INSERT INTO audit_log (action) VALUES ('start')`);

  // Attempt a risky operation inside a savepoint
  try {
    await tx.withSavepoint(async (sp) => {
      await sp.execute(sql`INSERT INTO unstable_table (data) VALUES ('test')`);
      // If this throws, only the savepoint is rolled back
    }, 'risky_insert');
  } catch {
    console.log('Savepoint rolled back, continuing transaction');
  }

  // This still succeeds — the outer transaction is intact
  await tx.execute(sql`INSERT INTO audit_log (action) VALUES ('end')`);
});
```

### Transaction Timeout

Set a timeout to prevent long-running transactions from blocking:

```typescript
try {
  await withTransaction(manager, async (tx) => {
    // Long-running operation
    await tx.execute(sql`SELECT pg_sleep(10)`);
  }, {
    timeoutMs: 5000, // Cancel after 5 seconds
  });
} catch (error) {
  console.log('Transaction timed out:', error.message);
}
```

## Batch Operation Errors

### continueOnError Mode

Process as many items as possible, even if some fail:

```typescript
import { relationalInsert } from '@agentforge/tools';

const result = await relationalInsert.invoke({
  table: 'events',
  data: [
    { type: 'valid', timestamp: '2026-01-01' },
    { type: null, timestamp: 'invalid' },        // This will fail
    { type: 'also_valid', timestamp: '2026-01-02' },
  ],
  batch: {
    batchSize: 1,
    continueOnError: true,  // Don't stop on first failure
    maxRetries: 2,          // Retry failed batches up to 2 times
  },
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});

console.log(`Inserted: ${result.rowCount}`);
console.log(`Batch failures:`, result.batch?.failures);
```

## Common Error Messages

| Error Message | Cause | Fix |
|---|---|---|
| `Missing peer dependency: pg` | PostgreSQL driver not installed | `pnpm add pg @types/pg` |
| `Missing peer dependency: mysql2` | MySQL driver not installed | `pnpm add mysql2` |
| `Missing peer dependency: better-sqlite3` | SQLite driver not installed | `pnpm add better-sqlite3 @types/better-sqlite3` |
| `Database not initialized. Call initialize() first.` | `execute()` before `connect()` | Call `await manager.connect()` first |
| `Dangerous SQL operations ... are not allowed` | DDL statement in `relationalQuery` | Use a direct Drizzle migration instead |
| `Mutation query requires parameter binding` | INSERT/UPDATE/DELETE without params | Add `params` to bind dynamic values |
| `Pool max connections must be >= 1` | Invalid pool config | Set `pool.max` to at least 1 |
| `Connection cancelled during initialization` | `disconnect()` called during `connect()` | Await `connect()` before `disconnect()` |
