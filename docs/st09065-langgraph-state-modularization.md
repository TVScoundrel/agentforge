# ST-09065: LangGraph State Helper Modularization

## Summary

`packages/core/src/langgraph/state.ts` was reduced from `361` lines to a `13` line public facade that keeps the existing `createStateAnnotation(...)`, `validateState(...)`, `mergeState(...)`, and `StateChannelConfig` export surface stable while moving the internal state-helper responsibilities behind focused modules.

The extracted runtime modules stay below the `300` line planning cutoff and remain small, reviewable helpers:

- `packages/core/src/langgraph/state-types.ts` (`129` lines)
- `packages/core/src/langgraph/state-shared.ts` (`50` lines)
- `packages/core/src/langgraph/state-annotation.ts` (`58` lines)
- `packages/core/src/langgraph/state-validation.ts` (`28` lines)
- `packages/core/src/langgraph/state-merge.ts` (`45` lines)

This leaves the facade responsible only for the public export surface, while generic state-channel inference, object-key helpers, LangGraph annotation construction, schema/default validation, and reducer-driven merge behavior each live behind separate internal seams.

## Test Modularization

The monolithic `packages/core/tests/langgraph/state.test.ts` was reduced from `507` lines to a `4` line public entrypoint that imports focused suites:

- `packages/core/tests/langgraph/state/create-state-annotation.ts`
- `packages/core/tests/langgraph/state/validate-state.ts`
- `packages/core/tests/langgraph/state/merge-state.ts`
- `packages/core/tests/langgraph/state/defaults-workflow.ts`

This keeps the public test command stable while separating annotation construction, validation behavior, merge semantics, and LangGraph default-handling workflow coverage into smaller reviewable units.

## Test Strategy And Compatibility

This story is behavior-preserving modularization rather than a behavior change, so a literal failing test for "the state helper file got smaller" would only assert repository structure instead of runtime behavior. The practical test-first substitute was:

1. split `packages/core/tests/langgraph/state.test.ts` into focused suites first
2. run the unchanged public entrypoint before production refactoring
3. modularize `packages/core/src/langgraph/state.ts` behind the same public facade
4. re-run the public entrypoint plus typecheck and explicit-`any` baseline checks

Compatibility notes:

- `packages/core/src/langgraph/state.ts` still exports `createStateAnnotation`, `validateState`, `mergeState`, and `StateChannelConfig`
- annotation construction preserves defaulted non-reducer channel behavior, reducer channel handling, and inferred `State`/`Update` types
- validation preserves Zod-backed parsing, pass-through values without schemas, and default application for missing keys
- merge behavior preserves reducer-driven accumulation, last-value-wins replacement for non-reducer channels, and new-key insertion from updates
- no CI change was required because the story only reorganizes internal runtime and test modules behind existing public entrypoints

## Validation

- `pnpm test --run packages/core/tests/langgraph/state.test.ts`
  - before production split: `1` file passed, `22` tests passed
  - after production split: `1` file passed, `22` tests passed
- `pnpm --filter @agentforge/core typecheck`
- `pnpm lint:explicit-any:baseline`
  - workspace: `84/289`
  - core: `23/119`
  - no baseline regression; the baseline-file update remains outside this modularization story

## Explicit-`any` Notes

This story did not increase explicit-`any` usage. The touched state-helper modules remain consistent with the existing baseline, and the baseline-improvement notice from `pnpm lint:explicit-any:baseline` is deferred to a dedicated follow-up rather than folded into this behavior-preserving refactor.
