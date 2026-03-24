# ST-09014: Tighten Plan-Execute Shared Type Boundaries

## Summary

Tightened the shared plan-execute contracts so the exported executor/agent config no longer depends on `Tool<any, any>[]`, and replaced the open-ended step argument/result schema helpers with `unknown`-based aliases that preserve current runtime validation behavior.

## What Changed

| File | Change |
|------|--------|
| `packages/patterns/src/plan-execute/types.ts` | Replaced the broad `Tool<any, any>[]` executor boundary with a plan-execute-specific runtime tool contract and generic executor/agent config typing |
| `packages/patterns/src/plan-execute/schemas.ts` | Introduced shared `PlanStepArguments`/`PlanStepResult` aliases and changed the step argument/result schemas from `z.any()`-based typing to `z.unknown()`-based contracts |
| `packages/patterns/src/plan-execute/nodes.ts` | Localized the runtime tool invocation widening to a single helper and removed the executor’s `result: any` boundary |
| `packages/patterns/src/plan-execute/agent.ts` | Preserved tool-list inference through `createPlanExecuteAgent(...)` while keeping the runtime execution path erased and compatible |
| `packages/patterns/src/plan-execute/contracts.typecheck.ts` | Added a source-included type-level regression file that locks in concrete tool preservation through `ExecutorConfig` and `PlanExecuteAgentConfig` |
| `packages/patterns/tests/plan-execute/state.test.ts` | Added focused coverage proving nested step arguments and flexible completed-step results still validate after the schema helper tightening |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/patterns/src/plan-execute/types.ts`: `1 -> 0` (`-1`)
- `packages/patterns/src/plan-execute/nodes.ts`: `1 -> 0` (`-1`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `289 -> 278` (`-11`)
- `patterns` package: `28 -> 25` (`-3`)

(Captured with `pnpm lint:explicit-any:baseline` on 2026-03-24.)

## Compatibility Notes

- Planner, executor, replanner, and finisher runtime behavior is unchanged; only the shared type surfaces and schema helper typings were narrowed.
- Tool execution still works with the existing `toolBuilder()` output. The runtime erasure is now expressed explicitly via the exported `PlanExecuteTool` contract instead of `any`.
- Step arguments and completed-step results remain runtime-flexible because the Zod schemas still accept arbitrary values; the TypeScript surface is now `unknown`-based instead of `any`-based.
- The new `contracts.typecheck.ts` file keeps the plan-execute config inference under the normal patterns package `typecheck` command, without relying on test-only files.

## Validation

- `pnpm exec tsc -p packages/patterns/tsconfig.json --noEmit`
- `pnpm exec eslint packages/patterns/src/plan-execute/agent.ts packages/patterns/src/plan-execute/types.ts packages/patterns/src/plan-execute/nodes.ts packages/patterns/src/plan-execute/schemas.ts packages/patterns/src/plan-execute/contracts.typecheck.ts packages/patterns/tests/plan-execute/agent.test.ts packages/patterns/tests/plan-execute/state.test.ts`
- `pnpm test --run packages/patterns/tests/plan-execute/agent.test.ts packages/patterns/tests/plan-execute/state.test.ts packages/patterns/tests/plan-execute/integration.test.ts` -> `19 passed`
- `pnpm lint:explicit-any:baseline`
- `pnpm test --run` -> `152 passed | 16 skipped` files; `2126 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only (`0` errors)

## Test Impact

Expanded focused automated coverage for type-driven plan-execute configuration and schema compatibility. The story also passed full-suite and workspace lint validation before review handoff.
