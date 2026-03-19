# ST-09007: ReAct Node Test Suite Modularization

## Summary

This story reorganizes the ReAct node test surface to mirror the runtime split introduced in `ST-09006`. The public `packages/patterns/tests/react/nodes.test.ts` entry point remains intact, but it now delegates to focused reasoning, action, and observation suites plus shared helpers.

## Test Layout

### Before

- `packages/patterns/tests/react/nodes.test.ts` contained all ReAct node coverage in one `594`-line file

### After

- `packages/patterns/tests/react/nodes.test.ts` is a `3`-line public entry point
- `packages/patterns/tests/react/nodes/helpers.ts` (`64` lines) holds shared mock-model, tool, and base-state helpers
- `packages/patterns/tests/react/nodes/reasoning.ts` (`137` lines) covers reasoning-node behavior
- `packages/patterns/tests/react/nodes/action.ts` (`103` lines) covers action-node behavior
- `packages/patterns/tests/react/nodes/observation.ts` (`241` lines) covers observation-node behavior

## Compatibility Notes

- Running `packages/patterns/tests/react/nodes.test.ts` still executes the full ReAct node test surface
- The extracted suites continue testing the public `createReasoningNode`, `createActionNode`, and `createObservationNode` factories from `../../src/react/nodes.js`
- Existing serialization and iteration regressions remain covered after the split

## Explicit `any` Notes

- Focused ESLint validation on the touched test files reported `0` errors and no new explicit-`any` warnings
- `pnpm lint:explicit-any:baseline` still passes at `305/496` warnings (`patterns 31/82`)
- The story preserves the current workspace explicit-`any` baseline while improving test maintainability

## Focused Validation

- `pnpm exec eslint packages/patterns/tests/react/nodes.test.ts packages/patterns/tests/react/nodes/helpers.ts packages/patterns/tests/react/nodes/reasoning.ts packages/patterns/tests/react/nodes/action.ts packages/patterns/tests/react/nodes/observation.ts`
- `pnpm exec tsc -p packages/patterns/tsconfig.json --noEmit`
- `pnpm test --run packages/patterns/tests/react/nodes.test.ts packages/patterns/tests/react/deduplication.test.ts packages/patterns/tests/react/agent.test.ts` -> `35 passed`

## Full Validation

- `pnpm lint:explicit-any:baseline` -> `305/496` warnings; passed (`patterns 31/82`)
- `pnpm test --run` -> `149 passed | 16 skipped` files; `2108 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only (`0` errors)
