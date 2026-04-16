# ST-09027: Extract Connection Manager Vendor Initialization Adapters

## Summary

Extracted the relational connection manager's PostgreSQL, MySQL, and SQLite initialization paths into focused internal helpers so `ConnectionManager` no longer mixes lifecycle orchestration with vendor-specific pool and driver setup.

## What Changed

| File | Change |
|------|--------|
| `packages/tools/src/data/relational/connection/connection-manager.ts` | Delegated vendor-specific initialization to an internal adapter helper while preserving lifecycle, health-check, cancellation, and reconnection behavior |
| `packages/tools/src/data/relational/connection/vendor-initialization.ts` | Added focused PostgreSQL, MySQL, and SQLite initialization helpers plus shared pool-config validation and supported initialization error patterns |
| `packages/tools/tests/data/relational/connection/vendor-initialization.test.ts` | Added direct runtime coverage for vendor-specific connection config mapping, SQLite foreign-key enablement, shared pool validation, and unsupported-vendor rejection |
| `packages/tools/tests/data/relational/connection/connection-manager.test.ts` | Preserved the broader lifecycle suite over the public `ConnectionManager` surface after the extraction |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/tools/src/data/relational/connection/connection-manager.ts`: `2 -> 2` (`0`)
- `packages/tools/src/data/relational/connection/vendor-initialization.ts`: `0 -> 0` (`0`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `182 -> 180` (`-2`)
- `tools` package: `67 -> 65` (`-2`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-04-16.)

## Compatibility Notes

- Public `ConnectionManager` behavior remains unchanged for `connect()`, `disconnect()`, `dispose()`, `initialize()`, `close()`, `isHealthy()`, and pool metrics.
- PostgreSQL pool options still map to `pg.Pool` as `max`, `idleTimeoutMillis`, and `connectionTimeoutMillis`.
- MySQL pool options still map to `mysql2.createPool()` as `connectionLimit`, `acquireTimeout`, and `idleTimeout`.
- SQLite still accepts `pool` config for API compatibility, validates it, logs that it is not applied, and enables `PRAGMA foreign_keys = ON` on every connection.
- The extraction is internal only; no new vendor-initialization APIs were added to the public `@agentforge/tools` export surface.

## Validation

- `pnpm exec tsc -p packages/tools/tsconfig.json --noEmit`
- `pnpm exec eslint packages/tools/src/data/relational/connection/connection-manager.ts packages/tools/src/data/relational/connection/vendor-initialization.ts packages/tools/tests/data/relational/connection/connection-manager.test.ts packages/tools/tests/data/relational/connection/vendor-initialization.test.ts`
- `pnpm test --run packages/tools/tests/data/relational/connection/connection-manager.test.ts packages/tools/tests/data/relational/connection/vendor-initialization.test.ts` -> `2 passed` files, `49 passed` tests
- `pnpm lint:explicit-any:baseline --silent` -> `180/289` warnings, `tools 65/67`
- `pnpm test --run` -> `160 passed | 16 skipped` files; `2196 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only

## Test Impact

Added a focused vendor-initialization helper suite so pool-config translation and vendor-specific setup behavior are covered directly, while retaining the existing `ConnectionManager` lifecycle suite to catch public-surface regressions.
