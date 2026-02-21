# MySQL — Usage Examples

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../../../docs/LOGGING_STANDARDS.md).

## Connect and Query

```typescript
import { ConnectionManager } from '@agentforge/tools';
import { sql } from 'drizzle-orm';

const manager = new ConnectionManager({
  vendor: 'mysql',
  connection: 'mysql://user:password@localhost:3306/mydb',
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
  vendor: 'mysql',
  connection: {
    host: 'db.example.com',
    port: 3306,
    database: 'production',
    user: 'app_user',
    password: process.env.DB_PASSWORD,
    ssl: true,
    pool: {
      max: 10,                    // connectionLimit in mysql2
      idleTimeoutMillis: 60000,
      acquireTimeoutMillis: 10000,
    },
  },
});

await manager.connect();
```

> **Note:** When using a connection string, pool options cannot be applied. Use a config object for pool customization.

## Using the relationalQuery Tool

```typescript
import { relationalQuery } from '@agentforge/tools';

// MySQL uses ? placeholders for positional parameters
const result = await relationalQuery.invoke({
  sql: 'SELECT * FROM users WHERE status = ? AND age > ?',
  params: ['active', 18],
  vendor: 'mysql',
  connectionString: 'mysql://user:pass@localhost:3306/mydb',
});
console.log(result);

// Named parameters also supported
const inserted = await relationalQuery.invoke({
  sql: 'INSERT INTO users (name, email) VALUES (:name, :email)',
  params: { name: 'Alice', email: 'alice@example.com' },
  vendor: 'mysql',
  connectionString: 'mysql://user:pass@localhost:3306/mydb',
});
```

## Using the relationalSelect Tool

```typescript
import { relationalSelect } from '@agentforge/tools';

const result = await relationalSelect.invoke({
  table: 'products',
  columns: ['id', 'name', 'price', 'category'],
  where: [
    { column: 'category', operator: 'eq', value: 'electronics' },
    { column: 'price', operator: 'lte', value: 999.99 },
  ],
  orderBy: [{ column: 'price', direction: 'asc' }],
  limit: 50,
  vendor: 'mysql',
  connectionString: 'mysql://user:pass@localhost:3306/mydb',
});

console.log(`Found ${result.rowCount} products`);
```

## Using the relationalInsert Tool

```typescript
import { relationalInsert } from '@agentforge/tools';

// Single row insert
const result = await relationalInsert.invoke({
  table: 'products',
  data: { name: 'Widget', price: 29.99, category: 'gadgets' },
  returning: { mode: 'id', idColumn: 'id' },
  vendor: 'mysql',
  connectionString: 'mysql://user:pass@localhost:3306/mydb',
});
console.log(`Inserted product with ID: ${result.insertedIds[0]}`);

// Batch insert with error handling
const batchResult = await relationalInsert.invoke({
  table: 'logs',
  data: [
    { message: 'User login', level: 'info', created_at: '2026-01-01T00:00:00' },
    { message: 'Payment processed', level: 'info', created_at: '2026-01-01T00:01:00' },
  ],
  batch: { batchSize: 250, continueOnError: true },
  vendor: 'mysql',
  connectionString: 'mysql://user:pass@localhost:3306/mydb',
});
```

## Using the relationalUpdate Tool

```typescript
import { relationalUpdate } from '@agentforge/tools';

const result = await relationalUpdate.invoke({
  table: 'products',
  data: { price: 24.99, updated_at: '2026-02-21T00:00:00' },
  where: [{ column: 'id', operator: 'eq', value: 1 }],
  vendor: 'mysql',
  connectionString: 'mysql://user:pass@localhost:3306/mydb',
});
console.log(`Updated ${result.rowCount} products`);

// Batch update
const batchResult = await relationalUpdate.invoke({
  table: 'products',
  operations: [
    {
      data: { price: 19.99 },
      where: [{ column: 'category', operator: 'eq', value: 'clearance' }],
    },
    {
      data: { status: 'archived' },
      where: [{ column: 'stock', operator: 'eq', value: 0 }],
    },
  ],
  batch: { continueOnError: true },
  vendor: 'mysql',
  connectionString: 'mysql://user:pass@localhost:3306/mydb',
});
```

## Using the relationalDelete Tool

```typescript
import { relationalDelete } from '@agentforge/tools';

// Hard delete
const result = await relationalDelete.invoke({
  table: 'expired_sessions',
  where: [{ column: 'created_at', operator: 'lt', value: '2025-06-01' }],
  vendor: 'mysql',
  connectionString: 'mysql://user:pass@localhost:3306/mydb',
});

// Soft delete
const softResult = await relationalDelete.invoke({
  table: 'users',
  where: [{ column: 'id', operator: 'eq', value: 99 }],
  softDelete: { column: 'deleted_at' },
  vendor: 'mysql',
  connectionString: 'mysql://user:pass@localhost:3306/mydb',
});
```

## Schema Introspection

```typescript
import { relationalGetSchema } from '@agentforge/tools';

const schema = await relationalGetSchema.invoke({
  vendor: 'mysql',
  connectionString: 'mysql://user:pass@localhost:3306/mydb',
});

for (const table of schema.tables) {
  console.log(`Table: ${table.name}`);
  console.log(`  Columns: ${table.columns.map(c => c.name).join(', ')}`);
  console.log(`  PKs: ${table.columns.filter(c => c.isPrimaryKey).map(c => c.name).join(', ')}`);
}
```

## Transactions

```typescript
import { ConnectionManager, withTransaction } from '@agentforge/tools';
import { sql } from 'drizzle-orm';

const manager = new ConnectionManager({
  vendor: 'mysql',
  connection: 'mysql://user:pass@localhost:3306/mydb',
});
await manager.connect();

try {
  await withTransaction(manager, async (tx) => {
    await tx.execute(sql`UPDATE accounts SET balance = balance - ${100} WHERE id = ${1}`);
    await tx.execute(sql`UPDATE accounts SET balance = balance + ${100} WHERE id = ${2}`);
    await tx.execute(sql`INSERT INTO transfers (from_id, to_id, amount) VALUES (${1}, ${2}, ${100})`);
  }, {
    isolationLevel: 'repeatable read',
  });

  console.log('Transfer committed');
} finally {
  await manager.disconnect();
}
```

## MySQL-Specific Notes

- **Parameter placeholders:** MySQL uses `?` for positional parameters. The `relationalQuery` tool handles both `$1` (PostgreSQL-style) and `?` (MySQL-style) automatically.
- **RETURNING:** MySQL does not support `RETURNING` clauses natively. The INSERT tool uses `LAST_INSERT_ID()` for single-row inserts when `returning.mode` is `'id'`.
- **Result normalization:** MySQL's `mysql2` driver returns `[rows, fields]` tuples. The `ConnectionManager` automatically unwraps these to return just the rows, matching PostgreSQL's behavior.
- **Pool metrics:** MySQL's `mysql2` driver does not expose stable pool metric APIs. `getPoolMetrics()` returns zero values for MySQL connections.
