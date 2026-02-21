# Result Streaming — Large Query Results

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../docs/LOGGING_STANDARDS.md).

This guide demonstrates how to use the `relationalSelect` tool's streaming mode to process large result sets without loading everything into memory at once.

---

## How Streaming Works

Streaming uses **LIMIT/OFFSET pagination** internally. The tool fetches rows in chunks, processes each chunk, and optionally returns a sample of the full result:

```
SELECT * FROM table LIMIT 100 OFFSET 0    → Chunk 0 (rows 0–99)
SELECT * FROM table LIMIT 100 OFFSET 100  → Chunk 1 (rows 100–199)
SELECT * FROM table LIMIT 100 OFFSET 200  → Chunk 2 (rows 200–299)
...
```

This avoids loading all rows into memory at once while still letting you process the full result set.

---

## Basic Streaming

Enable streaming by adding the `streaming` option:

```typescript
import { relationalSelect } from '@agentforge/tools';

const result = await relationalSelect.invoke({
  table: 'events',
  columns: ['id', 'type', 'created_at'],
  orderBy: [{ column: 'created_at', direction: 'desc' }],
  streaming: {
    enabled: true,
    chunkSize: 200, // 200 rows per chunk (default: 100, max: 5000)
  },
  vendor: 'postgresql',
  connectionString: 'postgresql://app:secret@localhost:5432/analytics',
});

// result.rows contains a SAMPLE of the full data (default: first 50 rows)
console.log(`Total rows: ${result.rowCount}`);
console.log(`Chunks processed: ${result.streaming?.chunkCount}`);
console.log(`Sample rows returned: ${result.rows.length}`);
```

---

## Controlling the Sample

By default, streaming returns the first 50 rows as a sample. Adjust this with `sampleSize`:

```typescript
const result = await relationalSelect.invoke({
  table: 'logs',
  streaming: {
    enabled: true,
    chunkSize: 500,
    sampleSize: 10, // Only keep 10 rows in the result (lower memory)
  },
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});

// result.rows has at most 10 rows
// result.rowCount has the total count of ALL rows streamed
// result.streaming.streamedRowCount has the full count
```

Set `sampleSize: 0` to skip keeping any rows in memory — useful when you only need the count or metadata.

---

## Capping Total Rows

Limit the total rows fetched across all chunks:

```typescript
const result = await relationalSelect.invoke({
  table: 'events',
  where: [{ column: 'type', operator: 'eq', value: 'error' }],
  streaming: {
    enabled: true,
    chunkSize: 100,
    maxRows: 1000, // Stop after 1000 total rows regardless of table size
  },
  vendor: 'mysql',
  connectionString: 'mysql://app:secret@localhost:3306/monitoring',
});
```

---

## Memory Benchmarking

Compare streaming vs non-streaming memory usage:

```typescript
const result = await relationalSelect.invoke({
  table: 'large_table',
  streaming: {
    enabled: true,
    chunkSize: 200,
    benchmark: true, // Enable memory comparison
  },
  vendor: 'postgresql',
  connectionString: 'postgresql://...',
});

// The response includes streaming metadata with memory usage
if (result.streaming) {
  const mem = result.streaming.memoryUsage;
  console.log(`Start heap: ${(mem.startHeapUsed / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Peak heap:  ${(mem.peakHeapUsed / 1024 / 1024).toFixed(1)} MB`);
  console.log(`End heap:   ${(mem.endHeapUsed / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Delta:      ${(mem.deltaHeapUsed / 1024 / 1024).toFixed(1)} MB`);
}
```

---

## Low-Level Streaming APIs

For more control, use the streaming APIs directly from the `stream-executor` module.

### AsyncGenerator

Iterate over chunks with `for await...of`:

```typescript
import { ConnectionManager, streamSelectChunks } from '@agentforge/tools';
import { sql } from 'drizzle-orm';

const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://app:secret@localhost:5432/analytics',
});
await manager.connect();

for await (const chunk of streamSelectChunks(
  manager,
  { table: 'events', columns: ['id', 'type'], orderBy: [{ column: 'id', direction: 'asc' }] },
  { chunkSize: 500, maxRows: 10000 }
)) {
  console.log(`Chunk ${chunk.chunkIndex}: ${chunk.rows.length} rows (offset ${chunk.offset})`);
  // Process chunk.rows here
}

await manager.disconnect();
```

### Cancellation with AbortController

Stop streaming mid-flight:

```typescript
const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

for await (const chunk of streamSelectChunks(
  manager,
  { table: 'huge_table', orderBy: [{ column: 'id', direction: 'asc' }] },
  { chunkSize: 1000, signal: controller.signal }
)) {
  console.log(`Processing chunk ${chunk.chunkIndex}...`);
  // The loop stops when the signal fires
}
```

### Node.js Readable Stream

Pipe to other Node.js streams for ETL pipelines:

```typescript
import { createSelectReadableStream } from '@agentforge/tools';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const readable = createSelectReadableStream(
  manager,
  { table: 'events', orderBy: [{ column: 'id', direction: 'asc' }] },
  { chunkSize: 500 }
);

const transform = new Transform({
  objectMode: true,
  transform(chunk, _encoding, callback) {
    // chunk is a StreamingSelectChunk with { chunkIndex, offset, rows }
    const csvRows = chunk.rows.map(
      (row: any) => `${row.id},${row.type},${row.created_at}`
    );
    callback(null, csvRows.join('\n') + '\n');
  },
});

await pipeline(readable, transform, process.stdout);
```

---

## When to Use Streaming vs Regular Queries

| Scenario | Approach | Why |
|---|---|---|
| < 1,000 rows | Regular query | Lower overhead, simpler code |
| 1,000–10,000 rows | Streaming with `chunkSize: 500` | Moderate memory savings |
| 10,000–100,000 rows | Streaming with `chunkSize: 1000` | Significant memory savings |
| > 100,000 rows | Streaming with `maxRows` cap | Prevent OOM; consider pagination at the application level |
| Count only | Streaming with `sampleSize: 0` | Gets count without holding data in memory |
| ETL pipeline | Node.js Readable stream | Integrates with file writers, network sockets, etc. |
| Agent tool call | Regular query or small `sampleSize` | LLMs don't need all rows; sample is sufficient |

---

## Best Practices

1. **Use streaming for tables > 1,000 rows** — Regular queries load everything into memory.
2. **Keep `sampleSize` small for agent tools** — LLMs need representative data, not the full dataset.
3. **Use `maxRows` as a safety cap** — Prevents runaway queries on unexpected table sizes.
4. **Prefer the high-level API** — Use `relationalSelect` with `streaming` option unless you need chunk-level control.
5. **Cancel long streams** — Use `AbortController` to stop streaming when you have enough data.
6. **Monitor memory** — Enable `benchmark: true` during development to measure actual savings.
