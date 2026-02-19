# ST-03001: Schema Introspection Tool

**Status:** 👀 In Review  
**PR:** [#33](https://github.com/TVScoundrel/agentforge/pull/33)  
**Epic:** 03 - Schema Introspection and Metadata  
**Priority:** P1

## Summary

Implemented relational schema introspection for PostgreSQL, MySQL, and SQLite with cache-aware inspection and a new `relational-get-schema` tool.

## Implemented Changes

### Schema Core

- `packages/tools/src/data/relational/schema/types.ts`
  - Added `TableSchema`, `ColumnSchema`, `IndexSchema`, `ForeignKeySchema`, and `DatabaseSchema` interfaces.
- `packages/tools/src/data/relational/schema/schema-inspector.ts`
  - Added `SchemaInspector` with vendor-specific metadata extraction for:
    - PostgreSQL (`information_schema` + `pg_catalog` index metadata)
    - MySQL (`information_schema`)
    - SQLite (`sqlite_master` + `PRAGMA` introspection)
  - Extracts tables, columns, primary keys, foreign keys, and indexes.
  - Added TTL cache support and explicit cache invalidation.
- `packages/tools/src/data/relational/schema/index.ts`
  - Exported schema types and `SchemaInspector`.

### Tooling

- `packages/tools/src/data/relational/tools/relational-get-schema.ts`
  - Added `relational-get-schema` tool with input schema:
    - `vendor`
    - `connectionString`
    - optional `database`
    - optional `tables` filter
    - optional `cacheTtlMs`
    - optional `refreshCache`
  - Returns schema payload and summary counts.
- `packages/tools/src/data/relational/tools/index.ts`
  - Exported `relationalGetSchema`.
- `packages/tools/src/data/relational/index.ts`
  - Enabled schema exports from `schema/index.ts`.

### Tests

- `packages/tools/tests/data/relational/schema-inspector.test.ts`
  - Added unit tests for schema mapping, cache behavior, invalid filter validation.
- `packages/tools/tests/data/relational/relational-get-schema-tool.test.ts`
  - Added SQLite-backed integration tests for schema output and table filtering.

## Validation

- `pnpm exec vitest run packages/tools/tests/data/relational/schema-inspector.test.ts packages/tools/tests/data/relational/relational-get-schema-tool.test.ts`
  - 2 passed files
  - 4 passed, 2 skipped
- `pnpm test --run`
  - 98 passed files, 1 skipped file
  - 1188 passed, 82 skipped tests
- `pnpm lint`
  - passed with 0 lint errors (warnings-only baseline output)
