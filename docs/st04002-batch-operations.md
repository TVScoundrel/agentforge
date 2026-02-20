# ST-04002: Batch Operations for Relational CRUD Tools

**Status:** 👀 In Review  
**Epic:** 04 - Advanced Features and Optimization

## Overview

Implemented configurable batch execution for relational INSERT, UPDATE, and DELETE operations with:
- shared chunking and retry controls
- partial success reporting for long-running batches
- per-batch progress callback support
- structured batch logging and failure metadata
- synthetic benchmark metadata for individual vs batched processing

## What Was Added

1. Shared batch executor
- Added `packages/tools/src/data/relational/query/batch-executor.ts`.
- Core capabilities:
  - `executeBatchedTask(...)` for chunked execution
  - configurable `batchSize`, `maxRetries`, `retryDelayMs`, `continueOnError`
  - progress callback payloads after each processed chunk
  - failure metadata for partial-success flows
  - `benchmarkBatchExecution(...)` for synthetic timing comparison

2. INSERT batch mode
- Updated `relational-insert` schema/types/executor to support `batch` options.
- Array payloads now support chunked execution with retries and partial failure metadata.
- Added batch metadata to INSERT success responses (`batch.*`).

3. UPDATE batch mode
- Added `operations[]` + `batch` options to `relational-update`.
- Supports batch operation lists with per-operation `data`, `where`, and optional optimistic lock settings.
- Added partial-success metadata and benchmark output support.

4. DELETE batch mode
- Added `operations[]` + `batch` options to `relational-delete`.
- Supports mixed hard-delete and soft-delete operations in one batch request.
- Added partial-success metadata and benchmark output support.

5. Test coverage
- Added `packages/tools/tests/data/relational/batch-executor.test.ts`.
- Expanded schema validation suites for insert/update/delete batch inputs.
- Expanded tool invocation suites with batch-mode scenarios (compiled in this environment; SQLite-native execution is skip-gated when bindings are unavailable).

## Vendor Batch Size Guidance

Use these as starting points, then tune based on table width, index pressure, lock contention, and network latency:

| Vendor | Suggested Batch Size (writes) | Notes |
|---|---:|---|
| PostgreSQL | 500-2000 | Larger chunks usually perform well; monitor lock duration and WAL pressure. |
| MySQL | 250-1000 | Tune around `max_allowed_packet` and secondary-index overhead. |
| SQLite | 50-250 | Smaller chunks reduce lock hold times and transaction contention. |

General guidance:
- Start conservative in production (for example 100-250).
- Increase batch size until latency or lock contention starts to regress.
- Keep retries low (`maxRetries` 1-2) and use `continueOnError=true` for bulk maintenance jobs.

## Benchmark Notes

- `benchmarkBatchExecution(...)` provides synthetic timing comparisons between individual and batched processing callbacks.
- Tool-level `batch.benchmark=true` emits benchmark metadata without replaying SQL writes, so it is safe for side-effecting workloads.
- For real workload tuning, measure end-to-end command latency and DB-level metrics (locks, I/O, and write amplification) in staging.

## Validation

- `pnpm --filter @agentforge/tools typecheck`
- `pnpm exec vitest run packages/tools/tests/data/relational/batch-executor.test.ts packages/tools/tests/data/relational/relational-insert/schema-validation.test.ts packages/tools/tests/data/relational/relational-update/schema-validation.test.ts packages/tools/tests/data/relational/relational-delete/schema-validation.test.ts`
- `pnpm exec vitest run packages/tools/tests/data/relational/relational-insert/tool-invocation.test.ts packages/tools/tests/data/relational/relational-update/tool-invocation.test.ts packages/tools/tests/data/relational/relational-delete/tool-invocation.test.ts` (skip-gated in this environment because native SQLite bindings are unavailable)
