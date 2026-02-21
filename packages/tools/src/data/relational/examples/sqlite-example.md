# SQLite — Usage Examples

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../../docs/LOGGING_STANDARDS.md).

## Connect and Query

```typescript
import { ConnectionManager } from '@agentforge/tools';
import { sql } from 'drizzle-orm';

// In-memory database (great for testing and ephemeral agents)
const manager = new ConnectionManager({
  vendor: 'sqlite',
  connection: ':memory:',
});

await manager.connect();

try {
  // Create a table
  await manager.execute(sql`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE
    )
  `);

  // Insert data
  await manager.execute(
    sql`INSERT INTO users (name, email) VALUES (${'Alice'}, ${'alice@example.com'})`
  );

  // Query data
  const users = await manager.execute(sql`SELECT * FROM users`);
  console.log(users);
} finally {
  await manager.disconnect();
}
```

## File-Based Database

```typescript
const manager = new ConnectionManager({
  vendor: 'sqlite',
  connection: './data/app.db',
});
await manager.connect();

// Or using a config object
const manager2 = new ConnectionManager({
  vendor: 'sqlite',
  connection: { url: './data/app.db' },
});
await manager2.connect();
```

## Using the relationalQuery Tool

```typescript
import { relationalQuery } from '@agentforge/tools';

// SQLite uses ? placeholders
const result = await relationalQuery.invoke({
  sql: 'SELECT * FROM users WHERE name LIKE ?',
  params: ['%alice%'],
  vendor: 'sqlite',
  connectionString: ':memory:',
});
console.log(result);
```

## Using the relationalSelect Tool

```typescript
import { relationalSelect } from '@agentforge/tools';

const result = await relationalSelect.invoke({
  table: 'notes',
  columns: ['id', 'title', 'content'],
  where: [
    { column: 'archived', operator: 'eq', value: 0 },
  ],
  orderBy: [{ column: 'created_at', direction: 'desc' }],
  limit: 20,
  vendor: 'sqlite',
  connectionString: './data/notes.db',
});

console.log(`Found ${result.rowCount} notes`);
```

## Using the relationalInsert Tool

```typescript
import { relationalInsert } from '@agentforge/tools';

// Single row insert
const result = await relationalInsert.invoke({
  table: 'notes',
  data: { title: 'My Note', content: 'Hello world', archived: 0 },
  returning: { mode: 'id', idColumn: 'id' },
  vendor: 'sqlite',
  connectionString: './data/notes.db',
});
console.log(`Created note #${result.insertedIds[0]}`);

// Batch insert
const batchResult = await relationalInsert.invoke({
  table: 'tags',
  data: [
    { name: 'important', color: 'red' },
    { name: 'personal', color: 'blue' },
    { name: 'work', color: 'green' },
  ],
  vendor: 'sqlite',
  connectionString: './data/notes.db',
});
```

## Using the relationalUpdate Tool

```typescript
import { relationalUpdate } from '@agentforge/tools';

const result = await relationalUpdate.invoke({
  table: 'notes',
  data: { archived: 1 },
  where: [{ column: 'id', operator: 'eq', value: 5 }],
  vendor: 'sqlite',
  connectionString: './data/notes.db',
});
```

## Using the relationalDelete Tool

```typescript
import { relationalDelete } from '@agentforge/tools';

// Soft delete
const result = await relationalDelete.invoke({
  table: 'notes',
  where: [{ column: 'id', operator: 'eq', value: 5 }],
  softDelete: { column: 'deleted_at' },
  vendor: 'sqlite',
  connectionString: './data/notes.db',
});
```

## Schema Introspection

```typescript
import { relationalGetSchema } from '@agentforge/tools';

const schema = await relationalGetSchema.invoke({
  vendor: 'sqlite',
  connectionString: './data/notes.db',
});

for (const table of schema.tables) {
  console.log(`\nTable: ${table.name}`);
  for (const col of table.columns) {
    const pk = col.isPrimaryKey ? ' [PK]' : '';
    const nullable = col.nullable ? ' NULL' : ' NOT NULL';
    console.log(`  ${col.name}: ${col.type}${nullable}${pk}`);
  }
}
```

## Transactions

```typescript
import { ConnectionManager, withTransaction } from '@agentforge/tools';
import { sql } from 'drizzle-orm';

const manager = new ConnectionManager({
  vendor: 'sqlite',
  connection: './data/app.db',
});
await manager.connect();

try {
  await withTransaction(manager, async (tx) => {
    await tx.execute(
      sql`INSERT INTO orders (user_id, total) VALUES (${1}, ${49.99})`
    );
    await tx.execute(
      sql`UPDATE inventory SET stock = stock - 1 WHERE product_id = ${42}`
    );
  });
  console.log('Order placed successfully');
} finally {
  await manager.disconnect();
}
```

## SQLite-Specific Notes

- **Single connection:** SQLite uses a single connection (not a pool). The `pool` configuration is accepted for API consistency but has no runtime effect.
- **In-memory databases:** Use `':memory:'` for ephemeral databases — ideal for tests, scratchpads, and short-lived agents.
- **Concurrency:** SQLite handles concurrent access through its internal locking mechanism. For high-concurrency workloads, consider PostgreSQL or MySQL.
- **DML result normalization:** SQLite's `better-sqlite3` driver uses `.all()` for SELECT and `.run()` for DML. The `ConnectionManager` automatically tries `.all()` first and falls back to `.run()`, normalizing the result shape (`changes` → `affectedRows`) to match other vendors.
- **RETURNING:** SQLite 3.35+ supports `RETURNING`. The INSERT tool uses `last_insert_rowid()` for ID retrieval on older versions.
