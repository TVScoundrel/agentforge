# ST-09087: Middleware Controller Deduplication

## Summary

This story reduces duplicated controller-wrapper wiring across the core middleware rate-limit and concurrency layers without changing their public middleware APIs. It also replaces the monolithic middleware integration suite with focused characterization modules so follow-up fixes to shared controller behavior can land without expanding one oversized test body.

## What Changed

- Added `packages/core/src/langgraph/middleware/controller-runtime.ts` to centralize the shared "derive control input, then execute through a controller-backed wrapper" flow used by both middleware layers.
- Reduced duplicated wrapper construction in:
  - `packages/core/src/langgraph/middleware/rate-limiting.ts`
  - `packages/core/src/langgraph/middleware/concurrency.ts`
- Added a `RateLimiterRegistry` internal runtime so rate-limit strategy selection, limiter creation, execution, and reset behavior live behind one focused abstraction instead of being repeated across local and shared entrypoints.
- Added a `createConfiguredConcurrencyController(...)` helper so local and shared concurrency entrypoints reuse the same controller setup path.
- Split `packages/core/src/langgraph/middleware/__tests__/integration.test.ts` into focused imported modules:
  - `integration/composition.ts`
  - `integration/presets.ts`
  - `integration/shared-resources.ts`
  - `integration/shared.ts`

## Compatibility

- Public APIs remain unchanged:
  - `withRateLimit(...)`
  - `createSharedRateLimiter(...)`
  - `withConcurrency(...)`
  - `createSharedConcurrencyController(...)`
- Existing token-bucket, sliding-window, and fixed-window behavior stays intact because strategy-specific limiter classes were not changed.
- Existing concurrency queueing, priority ordering, queue size enforcement, timeouts, stats, and clear behavior stay intact because the underlying `ConcurrencyController` runtime was not behaviorally changed.
- Shared-controller integration coverage is now stricter: the shared rate-limit integration path uses `createSharedRateLimiter(...)` directly and asserts exhaustion on the shared key instead of only proving two unrelated wrappers can both execute once.

## Validation

- `pnpm --filter @agentforge/core test --run src/langgraph/middleware/__tests__/integration.test.ts`
- `pnpm --filter @agentforge/core test --run src/langgraph/middleware/__tests__/rate-limiting.test.ts src/langgraph/middleware/__tests__/concurrency.test.ts`
- `pnpm --filter @agentforge/core test --run`
- `pnpm --filter @agentforge/core typecheck`
- `pnpm lint:explicit-any:baseline`

## Explicit-`any` Baseline

- Baseline remained at `workspace 80/289`, `core 19/119`

## CI Impact

- No CI workflow update is required because the existing package-scoped core Vitest path and workspace validation path still cover the refactored middleware runtimes and the split integration entrypoint.
