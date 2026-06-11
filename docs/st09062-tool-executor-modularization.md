# ST-09062: Tool Executor Modularization

## Summary

`packages/core/src/tools/executor.ts` was reduced from `356` lines to roughly `175` lines in the public executor, staying below the `300` line planning cutoff while preserving the stable `./executor.js` import surface.

The extracted runtime modules are each focused on one responsibility and also remain below the planning cutoff:

- `packages/core/src/tools/executor-types.ts` (`69` lines)
- `packages/core/src/tools/executor-metrics.ts` (`46` lines)
- `packages/core/src/tools/executor-retry.ts` (`100` lines)

The public executor still owns queue orchestration and the exported `createToolExecutor(...)` entrypoint, while retry/error normalization, metrics bookkeeping, and shared executor types now live behind explicit internal seams.

## Test Modularization

The monolithic `packages/core/tests/tools/executor.test.ts` was replaced with a `3` line public entrypoint that imports focused suites:

- `packages/core/tests/tools/executor/method-handling.ts`
- `packages/core/tests/tools/executor/retry-policy.ts`
- `packages/core/tests/tools/executor/metrics.ts`

This keeps the public test command stable while separating method selection/context behavior, retry-policy behavior, and metrics bookkeeping into reviewable units.

## Test Strategy And Compatibility

This story is behavior-preserving modularization rather than a behavior change, so a literal failing test for "the file got smaller" would only assert repository structure. The practical test-first substitute was:

1. split the public `packages/core/tests/tools/executor.test.ts` surface into focused suites first
2. run the unchanged public entrypoint
3. modularize `packages/core/src/tools/executor.ts` behind the same `./executor.js` facade
4. re-run the same public entrypoint plus broader validation

Compatibility notes:

- `createToolExecutor`, `Priority`, `RetryPolicy`, `ExecutionMetrics`, and the rest of the executor public surface remain exported from `packages/core/src/tools/executor.ts`
- `packages/core/src/tools/index.ts` continues re-exporting executor APIs from `./executor.js`
- existing executor behavior remains intact for invoke-first dispatch, deprecated execute fallback, retry validation, metrics tracking, and queue status reporting
- no CI or workflow change was required because the story only reorganizes internal modules behind existing public entrypoints

## Validation

- `pnpm test --run packages/core/tests/tools/executor.test.ts`
  - before production split: `1` file passed, `13` tests passed
  - after production split: `1` file passed, `13` tests passed
- `pnpm --filter @agentforge/core typecheck`
- `pnpm --filter @agentforge/core exec eslint src/tools/executor.ts src/tools/executor-types.ts src/tools/executor-metrics.ts src/tools/executor-retry.ts tests/tools/executor.test.ts tests/tools/executor/method-handling.ts tests/tools/executor/retry-policy.ts tests/tools/executor/metrics.ts`
- `pnpm lint:explicit-any:baseline`
  - workspace: `84/289`
  - core: `23/119`
  - no baseline regression; follow-up baseline file update not included in this behavior-preserving refactor
- `pnpm test --run`
  - `210` files passed, `18` skipped
  - `2311` tests passed, `286` skipped
- `pnpm lint`
  - exit `0`; warnings only, no lint errors introduced by this story

## Explicit-`any` Notes

This story did not increase explicit-`any` usage. The touched executor modules remain consistent with the existing baseline, and the baseline improvement notice from `pnpm lint:explicit-any:baseline` is deferred to a separate follow-up because the committed baseline file itself is outside this story's scope.
