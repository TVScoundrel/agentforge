# ST-02005: Type-Safe DELETE Tool

**Status:** 👀 In Review  
**Epic:** 02 - Query Execution and CRUD Operations

## Overview

Implemented a type-safe `relational-delete` tool with explicit safety controls, optional soft-delete mode, and clear foreign-key constraint handling.

## Implementation Summary

1. Shared DELETE query-builder support
- Added `buildDeleteQuery(...)` in `packages/tools/src/data/relational/query/query-builder.ts`.
- Supports WHERE conditions and full-table-delete safety gate (`allowFullTableDelete`).
- Supports soft-delete behavior by generating UPDATE against a configurable column.

2. New tool module
- `packages/tools/src/data/relational/tools/relational-delete/index.ts`
- `packages/tools/src/data/relational/tools/relational-delete/schemas.ts`
- `packages/tools/src/data/relational/tools/relational-delete/types.ts`
- `packages/tools/src/data/relational/tools/relational-delete/executor.ts`
- `packages/tools/src/data/relational/tools/relational-delete/error-utils.ts`

3. Tool export integration
- Exported `relationalDelete` from `packages/tools/src/data/relational/tools/index.ts`.

## Behavior and Safety

- DELETE without WHERE is blocked by default.
- Full-table delete requires explicit `allowFullTableDelete: true`.
- Returns affected-row count (`rowCount`).
- Soft delete is supported via `softDelete` options (default column `deleted_at`).
- Foreign-key constraint violations return safe user-facing errors.
- `cascade: true` adds actionable guidance for DB-level `ON DELETE CASCADE` configuration.

## Tests Added

- `packages/tools/tests/data/relational/relational-delete/index.test.ts`
- `packages/tools/tests/data/relational/relational-delete/schema-validation.test.ts`
- `packages/tools/tests/data/relational/relational-delete/query-builder.test.ts`
- `packages/tools/tests/data/relational/relational-delete/tool-invocation.test.ts`
- `packages/tools/tests/data/relational/relational-delete/test-utils.ts`

## Validation

- `pnpm test --run packages/tools/tests/data/relational/relational-delete/index.test.ts`
- `pnpm test --run packages/tools/tests/data/relational`
