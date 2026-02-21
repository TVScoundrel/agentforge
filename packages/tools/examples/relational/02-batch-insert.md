# Batch Insert — Large Datasets

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../docs/LOGGING_STANDARDS.md).

This guide demonstrates how to use the `relationalInsert` tool's batch mode to efficiently insert thousands of rows with progress tracking, retry logic, and error handling.

---

## Basic Batch Insert

When inserting more than one row, pass an array to `data`. The tool automatically chunks the array into batches:

```typescript
import { relationalInsert } from '@agentforge/tools';

const users = Array.from({ length: 5000 }, (_, i) => ({
  email: `user${i + 1}@example.com`,
  name: `User ${i + 1}`,
  role: 'member',
}));

const result = await relationalInsert.invoke({
  table: 'users',
  data: users,
  vendor: 'postgresql',
  connectionString: 'postgresql://app:secret@localhost:5432/production',
});

console.log(`Inserted ${result.rowCount} rows in ${result.executionTime}ms`);
```

By default, rows are chunked into batches of **100**. The tool processes each batch sequentially and continues on error.

---

## Configuring Batch Size

Larger batches are faster but use more memory. Tune `batchSize` per vendor:

```typescript
const result = await relationalInsert.invoke({
  table: 'events',
  data: events, // 10,000 rows
  batch: {
    enabled: true,
    batchSize: 500, // 500 rows per INSERT statement (max: 5000)
  },
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});

console.log(`Batches: ${result.batch?.totalBatches}`);
console.log(`Failures: ${result.batch?.failures.length}`);
```

### Recommended Batch Sizes by Vendor

| Vendor | Recommended | Notes |
|---|---|---|
| PostgreSQL | 200–500 | High parameter limit (~65K). Larger batches work well. |
| MySQL | 100–200 | `max_allowed_packet` limits total SQL size. Keep batches moderate. |
| SQLite | 50–100 | Limited to ~999 variables per statement. Smaller batches safer. |

---

## Retry Logic for Flaky Connections

Enable retries to automatically re-attempt failed batches:

```typescript
const result = await relationalInsert.invoke({
  table: 'sensor_readings',
  data: readings, // 50,000 rows
  batch: {
    enabled: true,
    batchSize: 200,
    continueOnError: true,  // Don't stop on batch failure (default: true)
    maxRetries: 3,          // Retry failed batches up to 3 times (max: 5)
    retryDelayMs: 1000,     // Wait 1 second between retries (max: 60000)
  },
  vendor: 'mysql',
  connectionString: 'mysql://app:secret@localhost:3306/iot',
});

if (result.batch && result.batch.failures.length > 0) {
  console.log(`Partial success: ${result.rowCount} inserted`);
  for (const failure of result.batch.failures) {
    console.log(`  Batch ${failure.batchIndex}: ${failure.error} (${failure.attempts} attempts)`);
  }
} else {
  console.log(`All ${result.rowCount} rows inserted successfully`);
}
```

---

## Getting Inserted IDs

Request inserted IDs back with the `returning` option:

```typescript
const result = await relationalInsert.invoke({
  table: 'products',
  data: [
    { name: 'Widget A', price: 9.99 },
    { name: 'Widget B', price: 14.99 },
    { name: 'Widget C', price: 19.99 },
  ],
  returning: { mode: 'id', idColumn: 'id' },
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});

console.log('Inserted IDs:', result.insertedIds);
// [1, 2, 3]

// Or get full rows back:
const fullResult = await relationalInsert.invoke({
  table: 'products',
  data: [{ name: 'Widget D', price: 24.99 }],
  returning: { mode: 'row' },
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});

console.log('Inserted row:', fullResult.rows);
// [{ id: 4, name: 'Widget D', price: 24.99, created_at: '...' }]
```

---

## Benchmarking Batch vs Individual Inserts

Measure the speedup from batching to tune your `batchSize`:

```typescript
const result = await relationalInsert.invoke({
  table: 'logs',
  data: logEntries, // 1000 rows
  batch: {
    enabled: true,
    batchSize: 100,
    benchmark: true, // Enable batch vs individual comparison
  },
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});

// Benchmark metadata is available when `benchmark: true`
console.log(`Execution time: ${result.executionTime}ms`);
```

---

## Error Handling Patterns

### Stop on First Failure

Set `continueOnError: false` to abort immediately when a batch fails:

```typescript
try {
  const result = await relationalInsert.invoke({
    table: 'accounts',
    data: accounts,
    batch: {
      enabled: true,
      batchSize: 100,
      continueOnError: false, // Stop immediately on failure
    },
    vendor: 'postgresql',
    connectionString: 'postgresql://...',
  });
} catch (error) {
  // The tool returns { success: false } when a batch fails with continueOnError: false
  console.error('Batch insert aborted:', error);
}
```

### Handling Constraint Violations

The tool sanitizes database errors to prevent leaking sensitive information:

```typescript
const result = await relationalInsert.invoke({
  table: 'users',
  data: [
    { email: 'existing@example.com', name: 'Duplicate' }, // Unique constraint violation
  ],
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});

if (!result.success) {
  console.error(result.error);
  // Constraint-aware error message without internal table/column details
}
```

---

## Best Practices

1. **Tune batch size per vendor** — See the table above for starting points.
2. **Enable retries for network-sensitive environments** — Cloud databases may have transient connection issues.
3. **Use `continueOnError: true` for imports** — Process all data and report failures at the end.
4. **Use `continueOnError: false` for critical data** — When partial success is unacceptable.
5. **Monitor batch failures** — Check `result.batch.failures` for diagnostics.
6. **Use `returning: { mode: 'id' }` judiciously** — Returning IDs for large batches adds overhead. Omit when not needed.
