# ST-09030: Extract Connection Manager Query Execution and Session Adapters

## Summary

`packages/tools/src/data/relational/connection/connection-manager.ts` was still mixing lifecycle concerns with vendor-specific SQL result normalization and dedicated-session execution branches after the earlier lifecycle and vendor-initialization splits. This story extracted those query and session responsibilities into focused internal helpers while keeping `ConnectionManager` as the stable public façade.

## What Changed

| File | Change |
|------|--------|
| `packages/tools/src/data/relational/connection/connection-manager.ts` | Delegated direct SQL execution and dedicated-session handling to focused internal helpers while preserving the public `execute(...)` and `executeInConnection(...)` entrypoints. |
| `packages/tools/src/data/relational/connection/query-execution.ts` | Added vendor-aware query execution helpers for PostgreSQL/MySQL/SQLite, including SQLite non-query normalization and MySQL tuple unwrapping. |
| `packages/tools/src/data/relational/connection/session-adapters.ts` | Added dedicated-session helpers for PostgreSQL/MySQL pooled connections and the direct SQLite session path. |
| `packages/tools/tests/data/relational/connection/query-session-extraction.test.ts` | Added focused helper coverage for MySQL row normalization, SQLite DML normalization, and dedicated-session release behavior. |
| `packages/tools/tests/data/relational/connection/connection-manager.test.ts` | Preserved the broader lifecycle and public-surface coverage over `ConnectionManager` after the extraction. |

## Compatibility Notes

- `ConnectionManager` remains the public query-execution façade.
- Public runtime behavior for `execute(...)` remains unchanged across PostgreSQL, MySQL, and SQLite.
- Public runtime behavior for `executeInConnection(...)` remains unchanged for dedicated PostgreSQL/MySQL sessions and the direct SQLite path.
- MySQL still unwraps drizzle/mysql2 `[rows, fields]` tuples to return only the result payload.
- SQLite still normalizes `.run()` results to include `affectedRows` when the statement does not return data.

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/tools/src/data/relational/connection/connection-manager.ts`: `2 -> 2` (`0`)
- `packages/tools/src/data/relational/connection/query-execution.ts`: `0 -> 0` (`0`)
- `packages/tools/src/data/relational/connection/session-adapters.ts`: `0 -> 0` (`0`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `180 -> 180` (`0`)
- `tools` package: `65 -> 65` (`0`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-04-22.)

## Validation

- `pnpm exec tsc -p packages/tools/tsconfig.json --noEmit`
- `pnpm exec eslint packages/tools/src/data/relational/connection/connection-manager.ts packages/tools/src/data/relational/connection/query-execution.ts packages/tools/src/data/relational/connection/session-adapters.ts packages/tools/tests/data/relational/connection/query-session-extraction.test.ts`
  - passed with the existing `connection-manager.ts` warnings only
- `pnpm test --run packages/tools/tests/data/relational/connection/query-session-extraction.test.ts packages/tools/tests/data/relational/connection/connection-manager.test.ts packages/tools/tests/data/relational/connection/vendor-initialization.test.ts`
  - `3 passed` files, `57 passed` tests
- `pnpm lint:explicit-any:baseline --silent`
  - `180/289` warnings, `tools 65/67`
- `pnpm test --run`
  - `161 passed | 16 skipped` files
  - `2216 passed | 286 skipped` tests
- `pnpm lint`
  - exit `0`; warnings only

## Test Impact

Added a focused query/session helper suite so vendor-specific result normalization and dedicated-session release behavior are covered directly, while retaining the existing `ConnectionManager` lifecycle suite to catch public-surface regressions.
