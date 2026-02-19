# ST-04003: Result Streaming for Relational SELECT

**Status:** 👀 In Review  
**PR:** [#36](https://github.com/TVScoundrel/agentforge/pull/36)  
**Epic:** 04 - Advanced Features and Optimization

## Overview

Implemented chunked result streaming for `relational-select` so large SELECT operations can be processed with bounded memory behavior.

## What Was Added

1. `packages/tools/src/data/relational/query/stream-executor.ts`
- `streamSelectChunks(...)` for chunked async iteration.
- `createSelectReadableStream(...)` for Node.js `Readable` integration.
- `executeStreamingSelect(...)` for chunk processing + memory monitoring.
- `benchmarkStreamingSelectMemory(...)` for streaming vs non-streaming memory benchmark output.

2. Shared SELECT query builder in `packages/tools/src/data/relational/query/query-builder.ts`
- `buildSelectQuery(...)` moved into shared query utilities.

3. Streaming option in `relational-select`
- `streaming.enabled`
- `streaming.chunkSize`
- `streaming.maxRows`
- `streaming.sampleSize`
- `streaming.benchmark`

4. Response metadata
- `streaming.chunkCount`
- `streaming.streamedRowCount`
- `streaming.sampledRowCount`
- `streaming.memoryUsage`
- optional `streaming.benchmark`

## Example Usage

```typescript
import { relationalSelect } from '@agentforge/tools';

const result = await relationalSelect.invoke({
  table: 'events',
  orderBy: [{ column: 'id', direction: 'asc' }],
  streaming: {
    enabled: true,
    chunkSize: 250,
    sampleSize: 25,
    maxRows: 10000,
    benchmark: true,
  },
  vendor: 'postgresql',
  connectionString: process.env.DATABASE_URL!,
});

if (result.success && result.streaming?.enabled) {
  console.log({
    streamedRows: result.streaming.streamedRowCount,
    sampledRows: result.streaming.sampledRowCount,
    chunkCount: result.streaming.chunkCount,
    peakHeap: result.streaming.memoryUsage.peakHeapUsed,
    benchmark: result.streaming.benchmark,
  });
}
```

## Streaming vs Regular SELECT

Use regular SELECT when:
- expected result set is small
- caller needs all rows in response payload

Use streaming mode when:
- expected result set is large
- you want chunked execution with bounded in-process memory growth
- you want benchmark metadata to compare streaming vs non-streaming behavior

## Operational Notes

- Streaming currently uses LIMIT/OFFSET paging under the hood. This is portable, but large offsets can become slower on some databases.
- Benchmark mode is intended for side-effect-free SELECT queries only.
- Enabling `streaming.benchmark` executes the query up to three times overall:
  - once for the returned streaming result
  - once for regular (non-streaming) benchmark measurement
  - once for streaming benchmark measurement

## Validation

- `pnpm test --run packages/tools/tests/data/relational/relational-select/index.test.ts`
