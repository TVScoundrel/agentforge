# ST-09064: Middleware Presets Modularization

## Summary

`packages/core/src/langgraph/middleware/presets.ts` was reduced from `365` lines to a `23` line public facade that keeps the existing `production(...)`, `development(...)`, `testing(...)`, and `presets` exports stable while moving the internal preset responsibilities behind focused modules.

The extracted runtime modules stay below the `300` line planning cutoff:

- `packages/core/src/langgraph/middleware/preset-adapters.ts` (`37` lines)
- `packages/core/src/langgraph/middleware/preset-collection.ts` (`9` lines)
- `packages/core/src/langgraph/middleware/preset-development.ts` (`24` lines)
- `packages/core/src/langgraph/middleware/preset-production.ts` (`81` lines)
- `packages/core/src/langgraph/middleware/preset-testing.ts` (`42` lines)
- `packages/core/src/langgraph/middleware/preset-types.ts` (`31` lines)

This leaves the facade responsible only for the public export surface, while logging/retry/timeout adapter wrapping, preset option types, production stack assembly, development logging defaults, testing invocation helpers, and the `presets` collection each live behind separate internal seams.

## Test Modularization

The monolithic `packages/core/src/langgraph/middleware/__tests__/presets.test.ts` was reduced from `286` lines to an `8` line public entrypoint that imports focused suites:

- `packages/core/src/langgraph/middleware/__tests__/presets/production.ts`
- `packages/core/src/langgraph/middleware/__tests__/presets/development.ts`
- `packages/core/src/langgraph/middleware/__tests__/presets/testing.ts`
- `packages/core/src/langgraph/middleware/__tests__/presets/exports.ts`
- `packages/core/src/langgraph/middleware/__tests__/presets/shared.ts`

This keeps the public test command stable while separating production-stack behavior, development logging behavior, testing-preset helpers, export-surface assertions, and shared test-node setup into reviewable units.

## Test Strategy And Compatibility

This story is behavior-preserving modularization rather than a behavior change, so a literal failing test for "the preset file got smaller" would only assert repository structure instead of runtime behavior. The practical test-first substitute was:

1. split `packages/core/src/langgraph/middleware/__tests__/presets.test.ts` into focused suites first
2. run the unchanged public entrypoint before production refactoring
3. modularize `packages/core/src/langgraph/middleware/presets.ts` behind the same public facade
4. re-run the public entrypoint plus middleware integration coverage

Compatibility notes:

- `packages/core/src/langgraph/middleware/presets.ts` still exports `production`, `development`, `testing`, their option types, and `presets`
- production preset behavior preserves middleware ordering, timeout/error fallback behavior, retry defaults, metrics/tracing toggles, and logger defaults
- development preset behavior preserves verbose logging and error-stack reporting
- testing preset behavior preserves mock responses, simulated errors, delay handling, invocation tracking, and the attached `invocations` array
- no CI change was required because the story only reorganizes internal runtime and test modules behind existing public entrypoints

## Validation

- `pnpm test --run packages/core/src/langgraph/middleware/__tests__/presets.test.ts`
  - before production split: `1` file passed, `16` tests passed
  - after production split: `1` file passed, `16` tests passed
- `pnpm test --run packages/core/src/langgraph/middleware/__tests__/integration.test.ts`
  - `1` file passed, `18` tests passed
- `pnpm --filter @agentforge/core typecheck`
- `pnpm --filter @agentforge/core exec eslint src/langgraph/middleware/presets.ts src/langgraph/middleware/preset-adapters.ts src/langgraph/middleware/preset-collection.ts src/langgraph/middleware/preset-development.ts src/langgraph/middleware/preset-production.ts src/langgraph/middleware/preset-testing.ts src/langgraph/middleware/preset-types.ts src/langgraph/middleware/__tests__/presets.test.ts src/langgraph/middleware/__tests__/presets/shared.ts src/langgraph/middleware/__tests__/presets/production.ts src/langgraph/middleware/__tests__/presets/development.ts src/langgraph/middleware/__tests__/presets/testing.ts src/langgraph/middleware/__tests__/presets/exports.ts`
- `pnpm lint:explicit-any:baseline`
  - workspace: `84/289`
  - core: `23/119`
  - no baseline regression; the baseline-file update remains outside this modularization story

## Explicit-`any` Notes

This story did not increase explicit-`any` usage. The touched middleware preset modules remain consistent with the existing baseline, and the baseline-improvement notice from `pnpm lint:explicit-any:baseline` is deferred to a dedicated follow-up rather than folded into this behavior-preserving refactor.
