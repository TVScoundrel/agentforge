# ST-09019: Harden Reflection Agent Routing Typing

## Summary

Tightened the reflection agent factory so its routing and compile boundary no longer rely on `as any`, while preserving the existing generator, reflector, reviser, and finisher workflow behavior.

## What Changed

| File | Change |
|------|--------|
| `packages/patterns/src/reflection/agent.ts` | Replaced inline `as any` routing with node-specific typed route maps and removed the compile-time `as any` cast from `createReflectionAgent(...)` |
| `packages/patterns/tests/reflection/agent.test.ts` | Added focused route-behavior coverage for direct completion after reflection and max-iteration finishing after revision |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/patterns/src/reflection/agent.ts`: `4 -> 0` (`-4`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `233 -> 229` (`-4`)
- `patterns` package: `23 -> 19` (`-4`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-03-30.)

## Compatibility Notes

- `createReflectionAgent(...)` keeps the same runtime node flow: generator -> reflector -> reviser/finisher -> end.
- The route return values are now typed per node instead of being erased through `as any`, which keeps the compile-time contract aligned with the actual graph edges.
- The compiled graph return type is now inferred directly from `workflow.compile(...)` rather than being widened with a cast.
- The new focused test coverage locks in two key route paths without changing the broader reflection integration surface.

## Validation

- `pnpm exec tsc -p packages/patterns/tsconfig.json --noEmit`
- `pnpm exec eslint packages/patterns/src/reflection/agent.ts packages/patterns/tests/reflection/agent.test.ts packages/patterns/tests/reflection/integration.test.ts`
- `pnpm test --run packages/patterns/tests/reflection/agent.test.ts packages/patterns/tests/reflection/integration.test.ts packages/patterns/tests/reflection/state.test.ts packages/patterns/tests/reflection/nodes.test.ts` -> `4 passed` files, `32 passed` tests
- `pnpm lint:explicit-any:baseline --silent` -> `229/289` warnings, `patterns 19/28`
- `pnpm test --run` -> `156 passed | 16 skipped` files; `2160 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only

## Test Impact

Added focused automated coverage for the reflection factory’s route decisions while preserving the existing state, node, and integration coverage for the reflection pattern.
