# PostgreSQL — Usage Examples

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../../../docs/LOGGING_STANDARDS.md).

## Connect and Query

```typescript
import { ConnectionManager } from '@agentforge/tools';
import { sql } from 'drizzle-orm';

const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://user:password@localhost:5432/mydb',
});

await manager.connect();

try {
  // Simple SELECT
  const users = await manager.execute(sql`SELECT * FROM users LIMIT 10`);
  console.log(users);

  // Parameterized query
  const userId = 42;
  const user = await manager.execute(
    sql`SELECT id, name, email FROM users WHERE id = ${userId}`
  );
  console.log(user);
} finally {
  await manager.disconnect();
}
```

## Connection with Pool Configuration

```typescript
const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: {
    host: 'db.example.com',
    port: 5432,
    database: 'production',
    user: 'app_user',
    password: process.env.DB_PASSWORD,
    ssl: true,
    pool: {
      max: 20,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 5000,
    },
  },
});

await manager.connect();

// Check pool metrics
const metrics = manager.getPoolMetrics();
console.log(`Active: ${metrics.activeCount}, Idle: ${metrics.idleCount}`);
```

## Using the relationalQuery Tool

```typescript
import { relationalQuery } from '@agentforge/tools';

// SELECT with positional parameters ($1, $2, ...)
const result = await relationalQuery.invoke({
  sql: 'SELECT * FROM users WHERE status = $1 AND age > $2',
  params: ['active', 18],
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
});
console.log(result);

// INSERT with named parameters
const inserted = await relationalQuery.invoke({
  sql: 'INSERT INTO users (name, email) VALUES (:name, :email)',
  params: { name: 'Alice', email: 'alice@example.com' },
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
});
console.log(inserted);
```

## Using the relationalSelect Tool

```typescript
import { relationalSelect } from '@agentforge/tools';

const result = await relationalSelect.invoke({
  table: 'users',
  columns: ['id', 'name', 'email', 'created_at'],
  where: [
    { column: 'status', operator: 'eq', value: 'active' },
    { column: 'age', operator: 'gte', value: 18 },
  ],
  orderBy: [{ column: 'created_at', direction: 'desc' }],
  limit: 25,
  offset: 0,
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
});

console.log(`Found ${result.rowCount} users`);
console.log(result.rows);
```

## Using the relationalInsert Tool

```typescript
import { relationalInsert } from '@agentforge/tools';

// Single row with RETURNING
const result = await relationalInsert.invoke({
  table: 'users',
  data: { name: 'Bob', email: 'bob@example.com', status: 'active' },
  returning: { mode: 'id', idColumn: 'id' },
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
});
console.log(`Inserted user with ID: ${result.insertedIds[0]}`);

// Batch insert
const batchResult = await relationalInsert.invoke({
  table: 'events',
  data: [
    { type: 'login', user_id: 1, timestamp: '2026-01-01T00:00:00Z' },
    { type: 'login', user_id: 2, timestamp: '2026-01-01T00:01:00Z' },
    { type: 'logout', user_id: 1, timestamp: '2026-01-01T01:00:00Z' },
  ],
  batch: { batchSize: 100 },
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
});
console.log(`Inserted ${batchResult.rowCount} events`);
```

## Using the relationalUpdate Tool

```typescript
import { relationalUpdate } from '@agentforge/tools';

// Simple update
const result = await relationalUpdate.invoke({
  table: 'users',
  data: { status: 'inactive' },
  where: [{ column: 'last_login', operator: 'lt', value: '2025-01-01' }],
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
});
console.log(`Updated ${result.rowCount} users`);

// Optimistic locking
const lockResult = await relationalUpdate.invoke({
  table: 'users',
  data: { email: 'new@example.com', version: 6 },
  where: [{ column: 'id', operator: 'eq', value: 42 }],
  optimisticLock: { column: 'version', expectedValue: 5 },
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
});
```

## Using the relationalDelete Tool

```typescript
import { relationalDelete } from '@agentforge/tools';

// Hard delete
const result = await relationalDelete.invoke({
  table: 'sessions',
  where: [{ column: 'expired_at', operator: 'lt', value: '2025-01-01' }],
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
});
console.log(`Deleted ${result.rowCount} expired sessions`);

// Soft delete (sets deleted_at timestamp)
const softResult = await relationalDelete.invoke({
  table: 'users',
  where: [{ column: 'id', operator: 'eq', value: 99 }],
  softDelete: { column: 'deleted_at' },
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
});
```

## Schema Introspection

```typescript
import { relationalGetSchema } from '@agentforge/tools';

const schema = await relationalGetSchema.invoke({
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
  tables: ['users', 'orders'],       // Optional: filter to specific tables
  cacheTtlMs: 60000,                 // Cache for 60 seconds
});

for (const table of schema.tables) {
  console.log(`Table: ${table.name}`);
  for (const col of table.columns) {
    console.log(`  ${col.name}: ${col.type} ${col.nullable ? 'NULL' : 'NOT NULL'}`);
  }
}
```

## Transactions

```typescript
import { ConnectionManager, withTransaction } from '@agentforge/tools';
import { sql } from 'drizzle-orm';

const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://user:pass@localhost:5432/mydb',
});
await manager.connect();

try {
  const result = await withTransaction(manager, async (tx) => {
    // All operations run in the same transaction
    await tx.execute(sql`INSERT INTO orders (user_id, total) VALUES (${1}, ${99.99})`);
    await tx.execute(sql`UPDATE users SET order_count = order_count + 1 WHERE id = ${1}`);

    // Return a value from the transaction
    return { orderId: 1 };
  }, {
    isolationLevel: 'read committed',
    timeoutMs: 5000,
  });

  console.log('Transaction committed:', result);
} finally {
  await manager.disconnect();
}
```

## Savepoints

```typescript
await withTransaction(manager, async (tx) => {
  await tx.execute(sql`INSERT INTO audit_log (action) VALUES ('start')`);

  // Nested savepoint — can be rolled back independently
  try {
    await tx.withSavepoint(async (sp) => {
      await sp.execute(sql`INSERT INTO risky_table (data) VALUES ('test')`);
      throw new Error('Oops');
    }, 'risky_op');
  } catch {
    // Savepoint rolled back, but outer transaction continues
    console.log('Risky operation rolled back');
  }

  await tx.execute(sql`INSERT INTO audit_log (action) VALUES ('end')`);
});
```
