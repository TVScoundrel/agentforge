# Batch Update — Bulk Modifications

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../docs/LOGGING_STANDARDS.md).

This guide demonstrates how to use the `relationalUpdate` tool's batch mode to efficiently update many rows with different criteria, optimistic locking, and progress tracking.

---

## Basic Batch Update

Pass an array of `operations` to update multiple rows in one tool invocation.  Each operation specifies its own `data`, `where`, and options:

```typescript
import { relationalUpdate } from '@agentforge/tools';

const result = await relationalUpdate.invoke({
  table: 'users',
  operations: [
    { data: { role: 'admin' },  where: [{ column: 'email', operator: 'eq', value: 'alice@example.com' }] },
    { data: { role: 'editor' }, where: [{ column: 'email', operator: 'eq', value: 'bob@example.com' }] },
    { data: { role: 'viewer' }, where: [{ column: 'email', operator: 'eq', value: 'carol@example.com' }] },
  ],
  vendor: 'postgresql',
  connectionString: 'postgresql://app:secret@localhost:5432/production',
});

console.log(`Updated ${result.rowCount} rows`);
```

---

## Batch Configuration

Control chunking, retries, and error behaviour via the `batch` option:

```typescript
const result = await relationalUpdate.invoke({
  table: 'orders',
  operations: orderUpdates, // Array of { data, where } objects
  batch: {
    enabled: true,
    batchSize: 50,          // Process 50 operations per chunk
    continueOnError: true,  // Keep going if a chunk fails
    maxRetries: 2,          // Retry failed chunks twice
    retryDelayMs: 500,      // Wait 500ms between retries
  },
  vendor: 'mysql',
  connectionString: 'mysql://app:secret@localhost:3306/ecommerce',
});

if (result.batch && result.batch.failures.length > 0) {
  console.log('Some batches failed:');
  for (const f of result.batch.failures) {
    console.log(`  Batch ${f.batchIndex}: ${f.error} (${f.attempts} attempts)`);
  }
}
```

---

## Optimistic Locking

Prevent lost updates by specifying a version column. The update only applies if the expected version matches:

```typescript
// Single update with optimistic lock
const result = await relationalUpdate.invoke({
  table: 'documents',
  data: { title: 'Updated Title', version: 3 },
  where: [{ column: 'id', operator: 'eq', value: 42 }],
  optimisticLock: {
    column: 'version',
    expectedValue: 2, // Only update if current version is 2
  },
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});

if (result.rowCount === 0) {
  console.log('Conflict: document was modified by another user');
} else {
  console.log('Document updated to version 3');
}
```

### Batch Optimistic Locking

Each operation in a batch can have its own optimistic lock:

```typescript
const result = await relationalUpdate.invoke({
  table: 'documents',
  operations: [
    {
      data: { content: 'New content for doc 1', version: 5 },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      optimisticLock: { column: 'version', expectedValue: 4 },
    },
    {
      data: { content: 'New content for doc 2', version: 3 },
      where: [{ column: 'id', operator: 'eq', value: 2 }],
      optimisticLock: { column: 'version', expectedValue: 2 },
    },
  ],
  batch: { continueOnError: true },
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});
```

---

## Bulk Status Transitions

A common pattern is updating many rows to the same status:

```typescript
// Expire all trial accounts older than 30 days
const result = await relationalUpdate.invoke({
  table: 'accounts',
  data: { status: 'expired', expired_at: new Date().toISOString() },
  where: [
    { column: 'status', operator: 'eq', value: 'trial' },
    { column: 'created_at', operator: 'lt', value: '2026-01-21T00:00:00Z' },
  ],
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});

console.log(`Expired ${result.rowCount} trial accounts`);
```

---

## Batch Delete

The `relationalDelete` tool also supports batch mode with similar options:

```typescript
import { relationalDelete } from '@agentforge/tools';

const result = await relationalDelete.invoke({
  table: 'sessions',
  operations: [
    { where: [{ column: 'expired_at', operator: 'lt', value: '2026-01-01' }] },
    { where: [{ column: 'user_id', operator: 'isNull' }] },
  ],
  batch: {
    enabled: true,
    batchSize: 100,
    continueOnError: true,
  },
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});

console.log(`Deleted ${result.rowCount} expired/orphan sessions`);
```

### Soft Delete

Use `softDelete` to set a deletion timestamp instead of removing rows:

```typescript
const result = await relationalDelete.invoke({
  table: 'users',
  where: [{ column: 'id', operator: 'eq', value: 42 }],
  softDelete: {
    column: 'deleted_at',      // Column to set (default: 'deleted_at')
    value: new Date().toISOString(),
  },
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});
```

---

## Best Practices

1. **Use batch mode for multi-row updates** — One tool call instead of many reduces overhead.
2. **Always include WHERE clauses** — The tool rejects full-table updates unless `allowFullTableUpdate: true`.
3. **Use optimistic locking for concurrent writes** — Prevents silent data loss in multi-user/multi-agent systems.
4. **Use `continueOnError: true` for non-critical bulk operations** — Maximizes throughput for data migrations.
5. **Use soft deletes for audit trails** — Keep a history of deleted records.
