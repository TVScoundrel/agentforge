# ST-09092: Harden Core Generic Wrapper Contracts

## Summary

The profiler and circuit-breaker wrappers used `TArgs extends any[]`, leaving generic callback argument boundaries broader than necessary. This story replaces those tuple bounds with unknown-first generics while preserving callback inference and runtime behavior.

## Implementation

- Changed `Profiler.profile(...)` from `TArgs extends any[]` to `TArgs extends unknown[]`.
- Changed `CircuitBreaker.wrap(...)` from `TArgs extends any[]` to `TArgs extends unknown[]`.
- Added focused type and runtime coverage for inferred multi-argument callbacks, successful calls, and propagated failures.

## Test Strategy

The focused profiler and circuit-breaker tests were added before the production type change and passed against the existing runtime. The same suite was rerun after the type-only implementation change to verify inference and behavior remained stable.

## Validation

- Focused tests: `pnpm --filter @agentforge/core exec vitest run tests/monitoring/profiler.test.ts tests/resources/circuit-breaker.test.ts` -> `4` passed before and after the implementation change.
- Core package tests: `pnpm --filter @agentforge/core test --run` -> `67` files and `648` tests passed.
- Core typecheck: `pnpm --filter @agentforge/core typecheck` -> passed.
- Explicit-`any` baseline: `pnpm lint:explicit-any:baseline` -> passed at `workspace 74/289`, `core 17/119`; improved from `workspace 76/289`, `core 19/119`.

## Compatibility Notes

- Callback argument and return inference remains unchanged for existing callers.
- Profiler sampling, report recording, error propagation, and circuit-breaker state transitions were not modified.
- No CI workflow change is required because existing package, workspace, and explicit-`any` validation covers the changed contracts.
