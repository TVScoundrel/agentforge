# ST-09018: Harden Testing Assertion and State Builder Helpers

## Summary

Tightened the shared `@agentforge/testing` assertion and state-builder helpers so package consumers get safer generic and `unknown`-first contracts without losing the lightweight fluent setup flow used in agent tests.

## What Changed

| File | Change |
|------|--------|
| `packages/testing/src/helpers/assertions.ts` | Replaced broad `any`-based message, state, tool-call, async, and snapshot assertion signatures with `unknown`/generic object contracts and added explicit `system` message narrowing |
| `packages/testing/src/helpers/state-builder.ts` | Reworked the builder around typed state/message intersections, added exported ReAct/planning helper types, and removed broad `any` usage from helper config/state creation |
| `packages/testing/src/helpers/contracts.typecheck.ts` | Added source-included type regressions so package typecheck now enforces the tightened helper contracts |
| `packages/testing/tests/helpers.test.ts` | Added focused runtime coverage for message assertions, fluent state building, and typed ReAct/planning helper behavior |
| `packages/testing/src/index.ts` | Re-exported the new helper types from the package entrypoint |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/testing/src/helpers/assertions.ts`: `9 -> 0` (`-9`)
- `packages/testing/src/helpers/state-builder.ts`: `11 -> 0` (`-11`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `253 -> 233` (`-20`)
- `testing` package: `51 -> 31` (`-20`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-03-29.)

## Compatibility Notes

- `createStateBuilder()` keeps the same fluent `set(...)` and `add*Message(...)` ergonomics; the contract is tighter, but common test setup flows remain unchanged.
- `createReActState(...)` and `createPlanningState(...)` now preserve explicit falsy numeric inputs such as `0` instead of falling back through truthiness checks.
- `assertIsMessage(...)` now proves an actual `BaseMessage` instance before narrowing, so plain `{ content: ... }` objects are no longer treated as valid LangChain messages.
- `createPlanningState(...)` now exposes `results` as `Partial<TResultMap>` so the default empty object is represented honestly at the type boundary.
- `assertToolCalled(...)` now supports name-only assertions for tool-call collections whose `args` are typed as `unknown`, while preserving the stricter typed-args path when an expected arg shape is provided.
- `assertStateHasFields(...)` now accepts only string/number keys, and numeric keys are asserted without string coercion.
- The new exported helper types (`ReActTestState`, `PlanningTestState`, `TestToolCall`, `TestToolResult`, `PlanningStep`) are additive and keep the public package surface easy to consume from tests.

## Validation

- `pnpm exec tsc -p packages/testing/tsconfig.json --noEmit`
- `pnpm exec eslint packages/testing/src/helpers/assertions.ts packages/testing/src/helpers/state-builder.ts packages/testing/src/helpers/contracts.typecheck.ts packages/testing/src/index.ts packages/testing/tests/helpers.test.ts`
- `pnpm test --run packages/testing/tests/helpers.test.ts` -> `1 passed` file, `10 passed` tests
- `pnpm lint:explicit-any:baseline --silent` -> `233/289` warnings, `testing 31/51`
- `pnpm test --run` -> `155 passed | 16 skipped` files; `2151 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only (`0` errors)

## Test Impact

Added direct runtime coverage for the tightened helper behavior and a source-included type regression file so the package typecheck now enforces the new contracts. No manual-only gap remains for the touched helper surface.
