# ST-09066: Resource Pool Modularization

## Summary

Modularized the shared resource-pool runtime in `packages/core/src/resources/pool.ts` into focused acquisition, eviction, health-check, lifecycle, runtime-helper, and shared-type modules while preserving the public `ConnectionPool` and `createConnectionPool(...)` facade. Added a stable `packages/core/tests/resources/pool.test.ts` entrypoint with focused acquisition, eviction, and lifecycle suites so shared pool behavior is verified directly instead of only through the database and HTTP wrappers.

## Test-First Evidence

- Added the new shared pool entrypoint and focused suites before refactoring `pool.ts`.
- First focused run:
  - `pnpm test --run packages/core/tests/resources/pool.test.ts`
  - Failed in `packages/core/tests/resources/pool/eviction.ts`
  - Failure showed eviction dropped the pool below its configured `min`:
    - expected stats `{ size: 1, available: 1, acquired: 0 }`
    - received stats `{ size: 0, available: 0, acquired: 0 }`

## Implementation Notes

- Extracted focused runtime helpers:
  - `packages/core/src/resources/pool-types.ts`
  - `packages/core/src/resources/pool-runtime.ts`
  - `packages/core/src/resources/pool-acquisition.ts`
  - `packages/core/src/resources/pool-eviction.ts`
  - `packages/core/src/resources/pool-health.ts`
  - `packages/core/src/resources/pool-lifecycle.ts`
- Kept the public `packages/core/src/resources/pool.ts` file as a thin facade over the extracted helpers.
- Fixed the idle-eviction bug by limiting evictions to `connections.length - min` eligible idle connections instead of computing a fully-evictable set up front.

## File Size Results

- `packages/core/src/resources/pool.ts`: `316 -> 79` lines
- Extracted modules:
  - `pool-types.ts`: `60` lines
  - `pool-runtime.ts`: `72` lines
  - `pool-acquisition.ts`: `84` lines
  - `pool-eviction.ts`: `27` lines
  - `pool-health.ts`: `44` lines
  - `pool-lifecycle.ts`: `34` lines

## Test Modularization Results

- Added `packages/core/tests/resources/pool.test.ts`: `3` line public entrypoint
- Added focused suites:
  - `packages/core/tests/resources/pool/acquisition.ts`: `35` lines
  - `packages/core/tests/resources/pool/eviction.ts`: `40` lines
  - `packages/core/tests/resources/pool/lifecycle.ts`: `29` lines

## Residual Test Impact

No additional automated coverage was needed beyond the new direct pool suites and the existing database/http wrapper tests. The split now exercises shared acquisition, eviction, and lifecycle behavior against `ConnectionPool` itself while the wrapper-specific resource tests continue to confirm the public adapters still delegate correctly.

## Validation

- Focused shared and wrapper pool coverage:
  - `pnpm test --run packages/core/tests/resources/pool.test.ts packages/core/tests/resources/database-pool.test.ts packages/core/tests/resources/http-pool.test.ts`
  - `3` files passed, `9` tests passed
- Compatibility validation:
  - `pnpm --filter @agentforge/core typecheck`
- Explicit-`any` baseline:
  - `pnpm lint:explicit-any:baseline`
  - `84/289` warnings overall; `23/119` in `core`
- Full test suite:
  - `pnpm test --run`
  - `211 passed | 18 skipped` files; `2314 passed | 286 skipped` tests
- Lint:
  - `pnpm lint`
  - exit `0`; warnings only (`0` errors)

## CI Impact

No CI change required. The story keeps the existing public resource exports and validation commands intact.
