# ST-04001: Transaction Support

**Status:** 🚧 Draft PR  
**Epic:** 04 - Advanced Features and Optimization

## Overview

Implemented foundational transaction support for relational operations with:
- single-connection transaction execution
- commit/rollback lifecycle handling
- nested savepoints
- isolation level and timeout options
- transaction context plumbing for query and CRUD executors

## Implementation Summary

1. Transaction primitives
- Added `packages/tools/src/data/relational/query/transaction.ts`.
- Exposed `withTransaction(...)` and `TransactionContext`.
- Supports:
  - automatic `BEGIN` + `COMMIT` on success
  - automatic `ROLLBACK` on failure
  - nested savepoints via `withSavepoint(...)`
  - isolation level options
  - timeout option (`timeoutMs`)

2. Dedicated connection/session execution
- Added `executeInConnection(...)` to `ConnectionManager`:
  - PostgreSQL: acquires a pooled client for callback scope
  - MySQL: acquires a pooled connection for callback scope
  - SQLite: uses existing single-connection session
- Added `getVendor()` helper for transaction initialization logic.

3. Transaction context support in executors
- Added optional execution context (`transaction`) to:
  - `query-executor`
  - `relational-select` executor
  - `relational-insert` executor
  - `relational-update` executor
  - `relational-delete` executor
- When provided, queries execute through transaction context instead of the manager.

4. Documentation and examples
- Added examples: `docs/relational-transaction-examples.md`.

## Validation

- `pnpm test --run packages/tools/tests/data/relational/transaction.test.ts packages/tools/tests/data/relational/relational-delete/index.test.ts packages/tools/tests/data/relational/relational-update/index.test.ts packages/tools/tests/data/relational/relational-insert/index.test.ts`
  - relational CRUD suites passed
  - transaction integration suite is conditionally skipped when native SQLite bindings are unavailable
- `pnpm --filter @agentforge/tools lint` (0 errors, warnings-only baseline)
