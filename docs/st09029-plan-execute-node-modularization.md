# ST-09029: Plan-Execute Node Modularization

## Summary

ST-09029 split the plan-execute node layer into focused internal modules while keeping `packages/patterns/src/plan-execute/nodes.ts` as the stable public facade.

## What Changed

| File | Change |
|------|--------|
| `packages/patterns/src/plan-execute/nodes.ts` | Reduced the public entrypoint to a small facade that re-exports node factories from focused internal modules. |
| `packages/patterns/src/plan-execute/planner-node.ts` | Isolated planning prompt construction, LLM invocation, JSON parsing, and planner logging. |
| `packages/patterns/src/plan-execute/executor-node.ts` | Isolated dependency checking, deduplication cache setup, timeout handling, tool execution, and executor error handling. |
| `packages/patterns/src/plan-execute/replanner-node.ts` | Isolated replanning prompt assembly, decision parsing, and replanner logging. |
| `packages/patterns/src/plan-execute/finisher-node.ts` | Isolated final response aggregation and completion-state handling. |
| `packages/patterns/src/plan-execute/node-loggers.ts` | Centralized the planner/executor/replanner logger setup shared by the extracted node modules. |
| `packages/patterns/tests/plan-execute/nodes.test.ts` | Added focused coverage for the finisher path and invalid replanner JSON handling while preserving public-facade tests. |

## Behavior Notes

- Public imports remain unchanged through `packages/patterns/src/plan-execute/nodes.ts`.
- Planner, executor, replanner, and finisher runtime behavior remains unchanged after the split.
- Shared logger setup was extracted because it reduced duplication without hiding node control flow.

## Validation

- `pnpm exec tsc -p packages/patterns/tsconfig.json --noEmit`
- `pnpm exec eslint packages/patterns/src/plan-execute/nodes.ts packages/patterns/src/plan-execute/node-loggers.ts packages/patterns/src/plan-execute/planner-node.ts packages/patterns/src/plan-execute/executor-node.ts packages/patterns/src/plan-execute/replanner-node.ts packages/patterns/src/plan-execute/finisher-node.ts packages/patterns/tests/plan-execute/nodes.test.ts`
  - Passed with existing `nodes.test.ts` warnings only
- `pnpm test --run packages/patterns/tests/plan-execute/nodes.test.ts packages/patterns/tests/plan-execute/deduplication.test.ts packages/patterns/tests/plan-execute/agent.test.ts packages/patterns/tests/plan-execute/integration.test.ts packages/patterns/tests/plan-execute/state.test.ts`
  - `5 passed` files, `45 passed` tests
- `pnpm lint:explicit-any:baseline --silent`
  - Workspace baseline unchanged at `180/289`
  - `patterns` baseline unchanged at `15/28`
- `pnpm test --run`
  - `160 passed | 16 skipped` files; `2200 passed | 286 skipped` tests
- `pnpm lint`
  - exit `0`; warnings only

## Explicit-`any` Notes

- This story is primarily a responsibility split, not a type-hardening pass.
- Touched files did not regress the explicit-`any` baseline.
- `packages/patterns/src/plan-execute/nodes.ts` shrank from `462` lines to `14`, with the extracted implementation now split across:
  - `planner-node.ts` (`85` lines)
  - `executor-node.ts` (`195` lines)
  - `replanner-node.ts` (`117` lines)
  - `finisher-node.ts` (`23` lines)
  - `node-loggers.ts` (`5` lines)
