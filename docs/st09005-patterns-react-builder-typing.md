# ST-09005: Harden Patterns ReAct Node and Shared Agent Builder Types

## Summary

Refactored the ReAct node helpers and shared agent-builder utility to remove broad `any`-based state boundaries while preserving existing ReAct loop behavior and shared workflow assembly semantics.

## What Changed

| File | Change |
|------|--------|
| `packages/patterns/src/react/nodes.ts` | Replaced ad hoc `any` casts with typed message/state helpers for conversation normalization, tool-call extraction, observation formatting, scratchpad summaries, and invalid tool-message fallback handling |
| `packages/patterns/src/shared/agent-builder.ts` | Reworked the shared builder contracts around config-derived state, update, node-name, and routing generics instead of `any`-typed node/state/condition boundaries while keeping the schema constructor type-checked |
| `packages/patterns/tests/react/nodes.test.ts` | Added focused ReAct coverage for tool-message normalization, scratchpad context injection, and structured observation formatting while removing test-local `any` usage |
| `packages/patterns/tests/shared/agent-builder.test.ts` | Added focused shared-builder coverage for mapped conditional routing and direct workflow termination via `END` |

## Explicit `any` Warning Delta

### Story scope hotspots

- `packages/patterns/src/react/nodes.ts`: `10 -> 0` (`-10`)
- `packages/patterns/src/shared/agent-builder.ts`: `9 -> 0` (`-9`)
- `packages/patterns/tests/react/nodes.test.ts`: `4 -> 0` (`-4`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `324 -> 305` (`-19`)
- `patterns` package: `50 -> 31` (`-19`)

(After snapshot captured with `pnpm lint:explicit-any:baseline` on 2026-03-17.)

## Compatibility Notes

- ReAct reasoning, action, and observation nodes keep the same public shape and reducer-driven state updates.
- Shared builder consumers still pass the same runtime config, but the exported node/condition/checkpointer contracts now preserve state and route types instead of collapsing to `any`.
- Conditional routing behavior remains unchanged for both mapped branches and direct `END` termination.

## Validation

- `pnpm exec eslint packages/patterns/src/react/nodes.ts packages/patterns/src/shared/agent-builder.ts packages/patterns/tests/react/nodes.test.ts packages/patterns/tests/shared/agent-builder.test.ts`
- `pnpm exec tsc -p packages/patterns/tsconfig.json --noEmit`
- `pnpm test --run packages/patterns/tests/react/nodes.test.ts packages/patterns/tests/shared/agent-builder.test.ts` -> `13 passed`
- `pnpm lint:explicit-any:baseline`
- `pnpm test --run` -> `149 passed | 16 skipped` files; `2102 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only (`0` errors)

## Test Impact

Expanded focused automated coverage for ReAct message construction and shared builder conditional routing behavior.
