# Performance Optimization Guide

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../docs/LOGGING_STANDARDS.md).

This guide consolidates performance tuning recommendations for all relational database tools. Use it as a reference when optimizing throughput, latency, and memory usage.

---

## Quick Reference

| Scenario | Recommendation | Example |
|---|---|---|
| Insert > 100 rows | Use batch insert | `batch: { batchSize: 200 }` |
| Update > 50 rows | Use batch update | `batch: { batchSize: 100 }` |
| Query > 10K rows | Use streaming | `streaming: { enabled: true }` |
| Concurrent agents | Tune pool size | `pool: { max: 10 }` |
| Multi-step writes | Use transactions | `withTransaction(...)` |
| Schema discovery | Use caching | `cacheTtlMs: 300000` |

---

## Batch Size Tuning

### Recommended Batch Sizes by Vendor

| Vendor | Insert Batch Size | Update Batch Size | Rationale |
|---|---|---|---|
| PostgreSQL | 200–500 | 100–200 | Handles large parameter counts well |
| MySQL | 100–200 | 50–100 | `max_allowed_packet` limits payload size |
| SQLite | 50–100 | 25–50 | File-based locking; smaller batches reduce lock time |

### Benchmarking Batch Sizes

Find the optimal batch size for your workload:

```typescript
import { relationalInsert } from '@agentforge/tools';

const testData = Array.from({ length: 10000 }, (_, i) => ({
  name: `Product ${i}`,
  price: Math.random() * 100,
  category: ['A', 'B', 'C'][i % 3],
}));

for (const batchSize of [50, 100, 200, 500, 1000]) {
  const start = performance.now();

  await relationalInsert.invoke({
    table: 'products',
    data: testData,
    batch: { batchSize },
    vendor: 'postgresql',
    connectionString: DB_URL,
  });

  const elapsed = performance.now() - start;
  const rowsPerSec = (10000 / elapsed) * 1000;
  console.log(`Batch ${batchSize}: ${elapsed.toFixed(0)}ms (${rowsPerSec.toFixed(0)} rows/sec)`);
}
```

Typical results (PostgreSQL, local, 10K rows):

```
Batch 50:   2400ms (4,167 rows/sec)
Batch 100:  1500ms (6,667 rows/sec)
Batch 200:  1100ms (9,091 rows/sec)   ← sweet spot
Batch 500:   950ms (10,526 rows/sec)
Batch 1000:  920ms (10,870 rows/sec)  ← diminishing returns
```

---

## Streaming vs Regular Queries

### When to Use Streaming

| Condition | Regular Query | Streaming |
|---|---|---|
| Result set < 1,000 rows | ✅ Simpler | Unnecessary overhead |
| Result set 1K–10K rows | ✅ Usually fine | Consider if memory-constrained |
| Result set > 10K rows | ❌ Memory risk | ✅ Required |
| Need all rows in memory | ✅ | ❌ Not suitable |
| Processing rows one-by-one | Wasteful | ✅ Ideal |
| Export to file/stream | Buffered | ✅ Ideal |

### Memory Comparison

```typescript
// Regular: loads ALL rows into memory at once
const result = await relationalSelect.invoke({
  table: 'events',
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// 1M rows × ~200 bytes/row ≈ 200 MB in memory

// Streaming: processes in chunks
const result = await relationalSelect.invoke({
  table: 'events',
  streaming: {
    enabled: true,
    chunkSize: 1000,  // Only 1000 rows in memory at a time
  },
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// 1000 rows × 200 bytes ≈ 200 KB in memory (1000× less)
```

---

## Transaction Isolation Levels

Choose the right isolation level based on your consistency requirements:

| Level | Dirty Read | Non-Repeatable Read | Phantom Read | Performance |
|---|---|---|---|---|
| `read uncommitted` | Possible | Possible | Possible | Fastest |
| `read committed` | No | Possible | Possible | Fast |
| `repeatable read` | No | No | Possible | Moderate |
| `serializable` | No | No | No | Slowest |

### Recommendations by Use Case

| Use Case | Level | Why |
|---|---|---|
| Analytics / reporting | `read committed` | Consistency not critical; speed matters |
| Financial transfers | `serializable` | Must prevent all anomalies |
| Inventory updates | `repeatable read` | Prevent lost updates |
| Bulk data import | `read committed` | Speed matters; single writer |
| Multi-agent writes | `serializable` or optimistic locking | Prevent conflicts |

```typescript
import { withTransaction } from '@agentforge/tools';

// Financial transfer — use serializable
await withTransaction(manager, async (tx) => {
  await tx.execute('UPDATE accounts SET balance = balance - 100 WHERE id = 1');
  await tx.execute('UPDATE accounts SET balance = balance + 100 WHERE id = 2');
}, {
  isolationLevel: 'serializable',
});

// Analytics snapshot — read-committed is fine
await withTransaction(manager, async (tx) => {
  const revenue = await tx.execute('SELECT SUM(total) FROM orders WHERE date > $1', [startDate]);
  const count = await tx.execute('SELECT COUNT(*) FROM orders WHERE date > $1', [startDate]);
  return { revenue: revenue[0].sum, count: count[0].count };
}, {
  isolationLevel: 'read committed',
});
```

---

## Connection Pool Sizing

### Formula

```
pool.max = (concurrent_agents × avg_tools_per_step) × 1.5
```

### Common Configurations

| Scenario | Agents | Tools/Step | Recommended `max` |
|---|---|---|---|
| Single agent, light queries | 1 | 1–2 | 5 |
| Single agent, heavy workload | 1 | 3–5 | 10 |
| Multi-agent (3 agents) | 3 | 2 | 10 |
| High-concurrency pipeline | 5+ | 3+ | 25–30 |

### Signs You Need to Tune

| Symptom | Cause | Fix |
|---|---|---|
| `acquireTimeout` errors | Pool too small | Increase `max` |
| High idle connections | Pool too large | Decrease `max` |
| Slow query start times | Pool contention | Increase `max` or reduce query duration |
| Database `max_connections` hit | Over-provisioned pools | Reduce `max` across all clients |

---

## Query Optimization Tips

### Use Column Selection

```typescript
// ❌ Fetches all columns including large text/blob fields
await relationalSelect.invoke({ table: 'articles', vendor: 'postgresql', connectionString: DB_URL });

// ✅ Only fetch what you need
await relationalSelect.invoke({
  table: 'articles',
  columns: ['id', 'title', 'status'],  // Skip body, metadata
  vendor: 'postgresql',
  connectionString: DB_URL,
});
```

### Use WHERE Filters

```typescript
// ❌ Fetch all, filter in application
const all = await relationalSelect.invoke({ table: 'orders', vendor: 'postgresql', connectionString: DB_URL });
const recent = all.rows.filter((r) => r.created_at > cutoffDate);

// ✅ Filter in database
const recent = await relationalSelect.invoke({
  table: 'orders',
  where: [{ column: 'created_at', operator: 'gt', value: cutoffDate.toISOString() }],
  vendor: 'postgresql',
  connectionString: DB_URL,
});
```

### Use Pagination

```typescript
// ❌ Fetch all 100K rows
await relationalSelect.invoke({ table: 'events', vendor: 'postgresql', connectionString: DB_URL });

// ✅ Paginate
await relationalSelect.invoke({
  table: 'events',
  orderBy: [{ column: 'id', direction: 'asc' }],
  limit: 100,
  offset: 0,  // Page 1
  vendor: 'postgresql',
  connectionString: DB_URL,
});
```

---

## Schema Introspection Caching

Schema queries hit `information_schema`, which can be slow on large databases:

| Tables in Database | Uncached | Cached |
|---|---|---|
| 10 | ~50ms | ~0ms |
| 100 | ~200ms | ~0ms |
| 1,000 | ~2s | ~0ms |

Always use `cacheTtlMs` in production:

```typescript
const schema = await relationalGetSchema.invoke({
  cacheTtlMs: 300000,           // Cache for 5 minutes
  tables: ['users', 'orders'],  // Only inspect tables you need
  vendor: 'postgresql',
  connectionString: DB_URL,
});
```

---

## Performance Checklist

- [ ] **Batch sizes** tuned per vendor (see table above)
- [ ] **Streaming** enabled for queries returning > 10K rows
- [ ] **Connection pool** sized to workload (not over-provisioned)
- [ ] **Column selection** — only fetch columns you need
- [ ] **WHERE filters** — filter in database, not in application
- [ ] **Pagination** — use LIMIT/OFFSET for bounded result sets
- [ ] **Schema cache** — use `cacheTtlMs` for introspection
- [ ] **Transaction isolation** — use the lowest safe level
- [ ] **Indexes** — ensure WHERE/ORDER BY columns are indexed
- [ ] **Graceful shutdown** — `manager.disconnect()` on exit
