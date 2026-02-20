# Relational Transaction Examples

This document shows how to use the relational transaction helper for multi-step operations.

## Basic Transaction

```ts
import { ConnectionManager, withTransaction } from '@agentforge/tools';
import { sql } from 'drizzle-orm';

const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: process.env.DATABASE_URL!,
});

await manager.connect();

await withTransaction(manager, async (transaction) => {
  await transaction.execute(sql`UPDATE accounts SET balance = balance - ${100} WHERE id = ${1}`);
  await transaction.execute(sql`UPDATE accounts SET balance = balance + ${100} WHERE id = ${2}`);
});
```

## Nested Transaction with Savepoint

```ts
await withTransaction(manager, async (transaction) => {
  await transaction.execute(sql`INSERT INTO orders (id, status) VALUES (${1001}, ${'pending'})`);

  await transaction.withSavepoint(async (nested) => {
    await nested.execute(sql`INSERT INTO order_items (order_id, sku) VALUES (${1001}, ${'SKU-1'})`);
    await nested.execute(sql`INSERT INTO order_items (order_id, sku) VALUES (${1001}, ${'SKU-2'})`);
  });
});
```

## Isolation Level and Timeout

```ts
await withTransaction(
  manager,
  async (transaction) => {
    await transaction.execute(sql`UPDATE inventory SET reserved = reserved + ${1} WHERE product_id = ${42}`);
  },
  {
    isolationLevel: 'serializable',
    timeoutMs: 5000,
  }
);
```
