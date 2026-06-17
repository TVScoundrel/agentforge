# ST-09068: Middleware Caching Modularization

## Summary

Modularized `packages/core/src/langgraph/middleware/caching.ts` from a mixed-responsibility middleware runtime into a thin public facade backed by focused cache type, option-resolution, cache-store, entry-lifecycle, wrapper-flow, and shared-cache helper modules. Split the coupled caching coverage into a public entrypoint plus focused `withCache(...)` and shared-cache suites under `packages/core/src/langgraph/middleware/__tests__/caching/`.

## Test-First Evidence

- Split the existing caching middleware coverage before production refactoring so the focused caching suites could serve as the pre-refactor safety net.
- First focused run:
  - `pnpm test --run packages/core/src/langgraph/middleware/__tests__/caching.test.ts`
  - Failed because the new shared test harness imported `caching.js` from the wrong relative path.
- Fixed the shared harness import path and reran the focused suite before touching production logic.
- No brand-new failing behavior assertion was added because this story is structural: the existing caching behavior coverage already exercised the cache-hit, cache-miss, TTL, eviction, and shared-cache seams that needed to remain stable during the split.

## Implementation Notes

- Extracted focused runtime helpers:
  - `packages/core/src/langgraph/middleware/caching-types.ts`
  - `packages/core/src/langgraph/middleware/caching-options.ts`
  - `packages/core/src/langgraph/middleware/caching-store.ts`
  - `packages/core/src/langgraph/middleware/caching-entry.ts`
  - `packages/core/src/langgraph/middleware/caching-wrapper.ts`
  - `packages/core/src/langgraph/middleware/caching-shared.ts`
- Kept `packages/core/src/langgraph/middleware/caching.ts` as the stable public facade exporting `withCache`, `createSharedCache`, and the existing public caching types.
- Removed the old `(cache as any).cache` reach-in by giving the cache store an explicit `getEntry(...)` accessor and centralizing TTL/error-caching behavior in focused helpers.
- Replaced the old single `packages/core/src/langgraph/middleware/__tests__/caching.test.ts` monolith with a small entrypoint plus focused `with-cache.suite.ts` and `shared-cache.suite.ts` suites backed by a shared fixture module.

## File Size Results

- Production files:
  - `packages/core/src/langgraph/middleware/caching.ts`: `342 -> 52` lines
  - `packages/core/src/langgraph/middleware/caching-entry.ts`: `13` lines
  - `packages/core/src/langgraph/middleware/caching-options.ts`: `34` lines
  - `packages/core/src/langgraph/middleware/caching-shared.ts`: `33` lines
  - `packages/core/src/langgraph/middleware/caching-store.ts`: `87` lines
  - `packages/core/src/langgraph/middleware/caching-types.ts`: `68` lines
  - `packages/core/src/langgraph/middleware/caching-wrapper.ts`: `44` lines

## Test Modularization Results

- Test files:
  - `packages/core/src/langgraph/middleware/__tests__/caching.test.ts`: `2` lines
  - `packages/core/src/langgraph/middleware/__tests__/caching/shared.ts`: `11` lines
  - `packages/core/src/langgraph/middleware/__tests__/caching/with-cache.suite.ts`: `206` lines
  - `packages/core/src/langgraph/middleware/__tests__/caching/shared-cache.suite.ts`: `51` lines

## Explicit-`any` Baseline

- `pnpm lint:explicit-any:baseline`
- Result: `80/289` warnings overall, `19/119` in `core`
- Delta: improved from `84/289` overall and `23/119` in `core`

## Residual Test Impact

No additional automated coverage was required beyond the focused caching split. The new entrypoint and focused suites now isolate direct `withCache(...)` and shared-cache behavior while the existing middleware integration coverage continues to verify caching composition with the broader LangGraph middleware stack.

## Validation

- Focused caching coverage:
  - `pnpm test --run packages/core/src/langgraph/middleware/__tests__/caching.test.ts`
  - `1` file passed, `12` tests passed
- Package compatibility:
  - `pnpm --filter @agentforge/core typecheck`
  - Passed
- Explicit-`any` baseline:
  - `pnpm lint:explicit-any:baseline`
  - Passed with an improved baseline
- Full test suite:
  - `pnpm test --run`
  - `211` files passed, `18` files skipped
  - `2323` tests passed, `286` tests skipped
- Lint:
  - `pnpm lint`
  - Exit `0`; warnings only (`0` errors)

## CI Impact

No CI change required. The story preserves the public middleware facade and keeps the existing validation commands intact.
