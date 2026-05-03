# ST-09033: Database Pool Adapter Contracts

## Summary

ST-09033 tightens the `@agentforge/core` database pool adapter surface by replacing broad query and parameter `any` contracts with exported unknown-first types while preserving the existing mock database pool behavior.

## Contract Changes

- Added `DatabaseQueryParams` as `readonly unknown[]` for SQL parameter arrays.
- Added `DatabaseQueryResult` as the default unknown query result boundary.
- Updated `DatabaseConnection.query(...)`, `DatabaseConnection.execute(...)`, `DatabasePool.query(...)`, and `DatabasePool.execute(...)` to use the safer parameter/result aliases.
- Exported the new aliases from `packages/core/src/resources/index.ts` for downstream adapter implementations.

## Behavior Preservation

The runtime pool flow is unchanged:

- `DatabasePool.acquire()` and `DatabasePool.release(...)` still delegate to the shared `ConnectionPool`.
- `DatabasePool.query(...)` still acquires a connection, delegates to `connection.query(...)`, and releases in `finally`.
- `DatabasePool.execute(...)` still acquires a connection, delegates to `connection.execute(...)`, and releases in `finally`, including failure paths.
- The mock connection still returns an empty array for queries and throws when used after close.
- Health-check validation still runs the configured query through `connection.query(...)`.

## Test Strategy

Focused behavior tests were added in `packages/core/tests/resources/database-pool.test.ts` for:

- Typed readonly query parameter delegation through pooled connections.
- Release-on-failure behavior for `execute(...)` delegation.
- Health-check validation through the typed query contract.

The behavior tests were written before production changes. They pass as characterization tests against the existing runtime behavior; the type-boundary hardening is then enforced by `@agentforge/core` typecheck and the explicit-`any` baseline check because Vitest does not type-check erased type-only imports.

## Validation

Focused validation:

- `pnpm test --run packages/core/tests/resources/database-pool.test.ts packages/core/tests/resources/http-pool.test.ts` -> passed (`2` files, `6` tests).
- `pnpm --filter @agentforge/core typecheck` -> passed.
- `pnpm lint:explicit-any:baseline` -> passed and improved from `153/289` to `144/289`; `core` improved from `53/119` to `44/119`.

Full-suite and lint validation will be recorded before marking the PR ready.
