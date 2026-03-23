# ST-09010: Strengthen Plan-Execute Agent Routing Typing

## Summary

Tightened the plan-execute agent factory so its conditional routing and compile boundary no longer rely on explicit `any` casts, while preserving the existing planner, executor, replanner, finisher, and terminal error flows.

## What Changed

| File | Change |
|------|--------|
| `packages/patterns/src/plan-execute/agent.ts` | Replaced the route callback `as any` bridges with typed route maps, removed the compile-return cast, and dropped unused config/placeholder parameters exposed by the stricter boundary. |
| `packages/patterns/tests/plan-execute/agent.test.ts` | Added focused routing coverage that proves failed executor steps can route through the replanner back to either the executor or the planner based on the replanning decision. |
| `packages/patterns/tests/plan-execute/integration.test.ts` | Reused as the compiled-agent invocation coverage while keeping the existing end-to-end plan execution behavior intact. |

## Explicit-`any` Delta

- `packages/patterns/src/plan-execute/agent.ts`: `3 -> 0`
- Workspace baseline: `292 -> 289`
- `patterns`: `31 -> 28`

## Validation Performed

```bash
pnpm exec tsc -p packages/patterns/tsconfig.json --noEmit
pnpm exec eslint packages/patterns/src/plan-execute/agent.ts packages/patterns/tests/plan-execute/agent.test.ts
pnpm test --run packages/patterns/tests/plan-execute/agent.test.ts packages/patterns/tests/plan-execute/integration.test.ts
pnpm lint:explicit-any:baseline
pnpm test --run
pnpm lint
```

Focused test result:
- `2` files passed
- `8` tests passed

Full-suite result:
- `152` files passed, `16` skipped
- `2119` tests passed, `286` skipped

Lint result:
- `pnpm lint` exited `0`
- Existing workspace warnings remain outside this story's touched file set

## Status

Ready for review on `codex/fix/st-09010-plan-execute-routing-typing`.
