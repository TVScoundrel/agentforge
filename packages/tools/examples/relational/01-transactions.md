# Transactions — Multi-Step Operations

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../docs/LOGGING_STANDARDS.md).

This guide demonstrates how to use transactions for multi-step database operations with automatic commit/rollback, isolation levels, savepoints, and timeouts.

---

## Basic Transaction

Use `withTransaction` to wrap multiple operations in an atomic unit. If anything throws, the entire transaction rolls back automatically:

```typescript
import { ConnectionManager, withTransaction } from '@agentforge/tools';
import { sql } from 'drizzle-orm';

const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://app:secret@localhost:5432/production',
});
await manager.connect();

const orderId = await withTransaction(manager, async (tx) => {
  // 1. Create the order
  const [order] = await tx.execute(
    sql`INSERT INTO orders (customer_id, status) VALUES (${42}, ${'pending'}) RETURNING id`
  );

  // 2. Add order items
  await tx.execute(
    sql`INSERT INTO order_items (order_id, product_id, qty) VALUES (${order.id}, ${101}, ${2})`
  );
  await tx.execute(
    sql`INSERT INTO order_items (order_id, product_id, qty) VALUES (${order.id}, ${205}, ${1})`
  );

  // 3. Update inventory
  await tx.execute(
    sql`UPDATE products SET stock = stock - ${2} WHERE id = ${101}`
  );
  await tx.execute(
    sql`UPDATE products SET stock = stock - ${1} WHERE id = ${205}`
  );

  return order.id; // commit happens automatically
});

console.log(`Order ${orderId} created successfully`);
await manager.disconnect();
```

If the inventory update fails (e.g., a check constraint prevents negative stock), no order or items are persisted.

---

## Isolation Levels

Control read consistency with isolation levels. Available levels:

| Level | PostgreSQL | MySQL | SQLite |
|---|---|---|---|
| `read uncommitted` | ✅ | ✅ | ✅ (via PRAGMA) |
| `read committed` | ✅ (default) | ✅ | ❌ (ignored) |
| `repeatable read` | ✅ | ✅ (default) | ❌ (ignored) |
| `serializable` | ✅ | ✅ | ✅ (default) |

```typescript
// Serializable isolation for financial operations
const balance = await withTransaction(
  manager,
  async (tx) => {
    const [account] = await tx.execute(
      sql`SELECT balance FROM accounts WHERE id = ${accountId}`
    );

    if (account.balance < amount) {
      throw new Error('Insufficient funds');
    }

    await tx.execute(
      sql`UPDATE accounts SET balance = balance - ${amount} WHERE id = ${accountId}`
    );
    await tx.execute(
      sql`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${targetAccountId}`
    );

    return account.balance - amount;
  },
  { isolationLevel: 'serializable' }
);
```

---

## Transaction Timeout

Prevent long-running transactions from holding locks indefinitely:

```typescript
import { withTransaction } from '@agentforge/tools';

try {
  await withTransaction(
    manager,
    async (tx) => {
      // Complex multi-step migration
      await tx.execute(sql`UPDATE large_table SET status = ${'migrated'} WHERE batch_id = ${1}`);
      await tx.execute(sql`INSERT INTO migration_log (batch_id, status) VALUES (${1}, ${'complete'})`);
    },
    { timeoutMs: 30000 } // 30 second timeout — auto-rollback if exceeded
  );
} catch (error) {
  console.error('Transaction timed out or failed:', error.message);
}
```

---

## Savepoints — Partial Rollback

Savepoints let you roll back part of a transaction without aborting the whole thing:

```typescript
await withTransaction(manager, async (tx) => {
  // Main operation always succeeds
  await tx.execute(
    sql`INSERT INTO audit_log (action) VALUES (${'user_import_started'})`
  );

  // Try to import each user; skip failures
  const users = [
    { email: 'alice@example.com', name: 'Alice' },
    { email: 'bob@example.com', name: 'Bob' },
    { email: 'invalid', name: '' },  // This will fail a constraint
  ];

  let imported = 0;
  for (const user of users) {
    try {
      await tx.withSavepoint(async (sp) => {
        await sp.execute(
          sql`INSERT INTO users (email, name) VALUES (${user.email}, ${user.name})`
        );
      });
      imported++;
    } catch {
      // Savepoint rolled back; transaction continues
      console.log(`Skipped invalid user: ${user.email}`);
    }
  }

  // Commit the audit log + all successful imports
  await tx.execute(
    sql`UPDATE audit_log SET details = ${`imported ${imported}/${users.length}`}
        WHERE action = ${'user_import_started'}`
  );
});
```

### Manual Savepoint Control

For finer-grained control, create and manage savepoints explicitly:

```typescript
await withTransaction(manager, async (tx) => {
  await tx.execute(sql`INSERT INTO events (type) VALUES (${'start'})`);

  // Create a named savepoint
  const spName = await tx.createSavepoint('before_risky_op');

  try {
    await tx.execute(sql`INSERT INTO events (type) VALUES (${'risky'})`);
    // If successful, release the savepoint to free resources
    await tx.releaseSavepoint(spName);
  } catch {
    // Roll back to the savepoint — the 'start' event is preserved
    await tx.rollbackToSavepoint(spName);
    await tx.execute(sql`INSERT INTO events (type) VALUES (${'fallback'})`);
  }
});
```

---

## Transaction with Tools

The relational tools don't directly accept a transaction context (they create their own connections). For transactional workflows, use `ConnectionManager.executeInConnection()` to pin all statements to a single database session:

```typescript
await manager.executeInConnection(async (execute) => {
  await execute(sql`BEGIN`);
  try {
    await execute(sql`INSERT INTO orders (customer_id) VALUES (${42})`);
    await execute(sql`UPDATE inventory SET stock = stock - 1 WHERE product_id = ${101}`);
    await execute(sql`COMMIT`);
  } catch (error) {
    await execute(sql`ROLLBACK`);
    throw error;
  }
});
```

For most use cases, prefer `withTransaction` which handles commit/rollback automatically.

---

## Best Practices

1. **Keep transactions short** — Long transactions hold locks and block concurrent access.
2. **Use the lowest sufficient isolation level** — `read committed` is usually enough. Reserve `serializable` for financial operations.
3. **Set timeouts for batch work** — Prevent runaway transactions with `timeoutMs`.
4. **Use savepoints for partial failures** — Import and migration jobs often need to skip bad records.
5. **Don't nest `withTransaction` calls** — Use savepoints instead for nested atomic blocks.
6. **SQLite is always serializable** — Setting isolation levels on SQLite is a no-op (except `read uncommitted`).
