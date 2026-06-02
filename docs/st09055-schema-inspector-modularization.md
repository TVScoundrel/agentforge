# ST-09055: Schema Inspector Modularization

## Summary

`ST-09055` modularizes the relational schema inspector runtime and its coupled tests without changing public behavior. The public `SchemaInspector` facade remains stable while vendor-specific inspection, shared normalization helpers, and cache/filter orchestration are split into focused internal modules.

## Test Strategy

A structure-only failing test would mostly prove file layout rather than schema-inspection behavior. For this story, the real contract is preserving schema discovery output, metadata shape, cache semantics, table filtering, and public imports while splitting the oversized runtime and coupled test surface.

The practical test-first substitute was:

- split the existing schema-inspector test surface into focused PostgreSQL, cache, and filter suites first
- use those focused suites as the regression net while extracting vendor-specific and shared runtime responsibilities behind the stable public facade

No additional CI automation was required because the existing `@agentforge/tools` typecheck, focused test runs, workspace test suite, lint, and explicit-`any` baseline gate already cover the changed surfaces.

## Runtime And Test Layout

### Production

- `packages/tools/src/data/relational/schema/schema-inspector.ts`: `725` -> `126` lines
- Added `packages/tools/src/data/relational/schema/schema-inspector-shared.ts`: `249` lines
- Added `packages/tools/src/data/relational/schema/schema-inspector-postgresql.ts`: `155` lines
- Added `packages/tools/src/data/relational/schema/schema-inspector-mysql.ts`: `135` lines
- Added `packages/tools/src/data/relational/schema/schema-inspector-sqlite.ts`: `95` lines

### Tests

- Replaced `packages/tools/tests/data/relational/schema-inspector.test.ts`: `152` lines
- Added `packages/tools/tests/data/relational/schema-inspector-postgresql.test.ts`: `86` lines
- Added `packages/tools/tests/data/relational/schema-inspector-cache.test.ts`: `41` lines
- Added `packages/tools/tests/data/relational/schema-inspector-filters.test.ts`: `38` lines
- Added shared test helper `packages/tools/tests/data/relational/schema-inspector.test-utils.ts`

## Behavior Preserved

- PostgreSQL, MySQL, and SQLite schema-inspection entrypoints still return the same `DatabaseSchema` shape
- cache-key, cache-TTL, and explicit invalidation semantics remain unchanged
- table filter validation and filtered schema output remain unchanged
- public `SchemaInspector` imports and invocation flow remain unchanged

## Explicit-`any` Baseline

- `pnpm lint:explicit-any:baseline` remained stable at `84/289` workspace warnings
- `@agentforge/tools` remained stable at `53/67`

## Validation

- Focused schema-inspector suites:
  - `pnpm test --run packages/tools/tests/data/relational/schema-inspector-postgresql.test.ts packages/tools/tests/data/relational/schema-inspector-cache.test.ts packages/tools/tests/data/relational/schema-inspector-filters.test.ts`
  - `3` files passed, `3` tests passed
- Package checks:
  - `pnpm --filter @agentforge/tools typecheck`
  - `pnpm --filter @agentforge/tools exec eslint src/data/relational/schema/schema-inspector.ts src/data/relational/schema/schema-inspector-shared.ts src/data/relational/schema/schema-inspector-postgresql.ts src/data/relational/schema/schema-inspector-mysql.ts src/data/relational/schema/schema-inspector-sqlite.ts tests/data/relational/schema-inspector.test-utils.ts tests/data/relational/schema-inspector-postgresql.test.ts tests/data/relational/schema-inspector-cache.test.ts tests/data/relational/schema-inspector-filters.test.ts`
- Workspace checks:
  - `pnpm lint:explicit-any:baseline`
  - `pnpm test --run` -> `202` files passed, `18` skipped; `2313` tests passed, `286` skipped
  - `pnpm lint` -> passed with warnings only
  - `git diff --check`
