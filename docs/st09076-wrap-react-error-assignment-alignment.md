# ST-09076: Align Wrapped ReAct Error Assignment Selection

## Summary

`wrapReActAgent(...)` already filtered out completed assignments on the success path, but its error path still grabbed the first assignment for the worker regardless of completion state. That mismatch could attach a wrapped-worker failure to an already-completed assignment when the same worker had newer active work. This story aligns both paths on the same incomplete-assignment selector.

## Implementation

- Reused the existing `findCurrentAssignment(...)` helper in `packages/patterns/src/multi-agent/utils-react-wrapper.ts` for the error branch instead of re-querying `state.activeAssignments` with looser criteria.
- Preserved the existing wrapped ReAct return shape, supervisor-routing fallback, logging, and public imports.
- Added a focused regression in `packages/patterns/tests/multi-agent/utils/wrap-react-agent.suite.ts` that creates one completed assignment plus one still-active assignment for the same worker and proves the error result targets the active assignment.

## Test Strategy

This story used a red-first regression test because the contract is small and the failure mode is directly observable through the public wrapper result. The new test was added to the public multi-agent utility test surface, run through `packages/patterns/tests/multi-agent/utils.test.ts`, failed before the production change by returning `assignment-1` instead of the active `assignment-2`, and passed after the selector was centralized.

## Validation

- Red-first run: `pnpm test --run packages/patterns/tests/multi-agent/utils.test.ts` -> failed in `targets the active assignment when the error path follows completed work` because the error result used completed `assignment-1`
- Focused utility suite: `pnpm test --run packages/patterns/tests/multi-agent/utils.test.ts` -> `1` passed file, `10` passed tests
- Package typecheck: `pnpm --filter @agentforge/patterns typecheck` -> passed
- Explicit-`any` baseline: `pnpm lint:explicit-any:baseline` -> passed at `workspace 80/289`, `patterns 2/28`
- Workspace lint: `pnpm lint` -> passed with warnings only (`0` errors)
- Full suite: `pnpm test --run` hit timeout-only failures in unrelated existing tests under aggregate load. `packages/cli/tests/index.test.ts`, `packages/tools/tests/data/relational/relational-query-tool.test.ts`, and `packages/tools/tests/agent/ask-human-boundary.test.ts` each passed when rerun in isolation, so the blocker is the flaky full-suite gate rather than this story's code path.

## Compatibility Notes

- Public imports and the `wrapReActAgent(...)` signature are unchanged.
- Successful wrapped-worker execution still uses the same assignment-selection logic as before; the story only removes the error-path asymmetry.
- No CI workflow change was required for this story because the existing patterns test/typecheck/baseline commands already cover the touched surface.
