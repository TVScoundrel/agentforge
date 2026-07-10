# ST-09085: Relational Schema Type Mapper Modularization

## Summary

Reduced `packages/tools/src/data/relational/schema/type-mapper.ts` from a mixed-responsibility `324` line module to a `115` line public facade by extracting vendor mapping tables and DB-type normalization into focused internal helpers. The public `mapColumnType(...)`, `mapSchemaTypes(...)`, and `getVendorTypeMap(...)` exports remain unchanged.

The story also replaced the monolithic `packages/tools/tests/data/relational/type-mapper.test.ts` body with a stable `8` line public entrypoint that imports focused suites for vendor mappings, normalization behavior, schema aggregation, and vendor-map copy semantics.

## Test Strategy

- Story type: behavior-preserving modularization of an existing schema utility
- Focused validation target:
  - `pnpm --filter @agentforge/tools test --run tests/data/relational/type-mapper.test.ts`
  - `pnpm --filter @agentforge/tools typecheck`
  - `pnpm lint:explicit-any:baseline`
- Test-first decision:
  - A new failing automated test was not the practical seam because the story changes structure rather than adding a new externally visible runtime branch.
  - The safer path was to split the existing suite into focused characterization coverage first, then refactor the runtime behind that passing test net.

## What Changed

### Runtime decomposition

- Kept `packages/tools/src/data/relational/schema/type-mapper.ts` as the stable public facade.
- Added `packages/tools/src/data/relational/schema/type-mapper-vendor-maps.ts` for PostgreSQL, MySQL, and SQLite vendor map definitions.
- Added `packages/tools/src/data/relational/schema/type-mapper-normalization.ts` for shared DB-type normalization rules covering:
  - PostgreSQL array suffix stripping
  - size and precision suffix stripping
  - MySQL `unsigned` suffix stripping
- Preserved existing mapping behavior for:
  - bigint precision-loss notes on PostgreSQL and MySQL
  - unknown-type fallback notes and debug logging
  - schema-wide per-table aggregation in `mapSchemaTypes(...)`
  - defensive-copy behavior in `getVendorTypeMap(...)`

### Test decomposition

- Kept `packages/tools/tests/data/relational/type-mapper.test.ts` as the public test entrypoint.
- Added focused suites under `packages/tools/tests/data/relational/type-mapper/` for:
  - vendor-specific mapping behavior
  - normalization behavior
  - schema aggregation behavior
  - vendor-map copy semantics
- Added explicit normalization coverage for PostgreSQL `[]` suffix handling in addition to the existing size/precision and MySQL `unsigned` cases.

## Compatibility Notes

- No public imports or signatures changed.
- `mapColumnType(...)`, `mapSchemaTypes(...)`, and `getVendorTypeMap(...)` still resolve from the same schema entrypoint.
- The extracted helpers are internal-only and exist to keep vendor maps and normalization rules isolated from the public orchestration layer.

## Validation

- Focused tools package test:
  - `pnpm --filter @agentforge/tools test --run tests/data/relational/type-mapper.test.ts`
  - Result: `1` passed file; `16` passed tests
- Tools package typecheck:
  - `pnpm --filter @agentforge/tools typecheck`
  - Result: passed
- Explicit-`any` baseline:
  - `pnpm lint:explicit-any:baseline`
  - Result: passed at `workspace 80/289`, `tools 53/67`
- Full workspace suite:
  - `pnpm test --run`
  - Result: `228` passed, `9` skipped files; `2519` passed, `110` skipped tests
- Workspace lint:
  - `pnpm lint`
  - Result: passed with pre-existing warnings only (`0` errors)

## CI Impact

- No CI workflow change required.
- The existing tools package-scoped validation path and workspace explicit-`any` gate already cover the modularized schema type-mapper surface.
