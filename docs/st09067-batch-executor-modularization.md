# ST-09067: Batch Executor Modularization

## Summary

Modularized `packages/tools/src/data/relational/query/batch-executor.ts` from a mixed-responsibility runtime into a thin public facade backed by focused internal batch option, runtime, execution, benchmark, and shared-type modules. Split the coupled batch-executor tests into a stable public entrypoint plus focused chunking, retry, failure, and benchmark suites under `packages/tools/tests/data/relational/query/batch-executor/`.

## Test-First Evidence

- Split the existing batch-executor coverage before production refactoring so the new focused suites could serve as the pre-refactor safety net.
- First focused run:
  - `pnpm test --run packages/tools/tests/data/relational/query/batch-executor.test.ts`
  - Failed because the new shared test harness imported the runtime facade from the wrong relative path.
- Fixed the shared import path and reran the focused suite before touching production logic.
- No brand-new failing behavior assertion was added because this story is structural: the existing behavior coverage already exercised the chunking, retry, failure, and benchmark seams that needed to stay stable during the split.

## Implementation Notes

- Extracted focused runtime helpers:
  - `packages/tools/src/data/relational/query/batch-executor-types.ts`
  - `packages/tools/src/data/relational/query/batch-executor-options.ts`
  - `packages/tools/src/data/relational/query/batch-executor-runtime.ts`
  - `packages/tools/src/data/relational/query/batch-executor-execution.ts`
  - `packages/tools/src/data/relational/query/batch-executor-benchmark.ts`
- Kept `packages/tools/src/data/relational/query/batch-executor.ts` as the stable public facade re-exporting the same batch constants, types, and helpers.
- Replaced the old single `packages/tools/tests/data/relational/batch-executor.test.ts` file with a small entrypoint at `packages/tools/tests/data/relational/query/batch-executor.test.ts` and focused suites for chunking, retry, failure handling, and benchmarking.
- Updated `docs/st04002-batch-operations.md` so its historical references point at the current batch-executor test entrypoint.

## File Size Results

- Production files:
  - `packages/tools/src/data/relational/query/batch-executor.ts`: `367 -> 19` lines
  - `packages/tools/src/data/relational/query/batch-executor-benchmark.ts`: `87` lines
  - `packages/tools/src/data/relational/query/batch-executor-execution.ts`: `162` lines
  - `packages/tools/src/data/relational/query/batch-executor-options.ts`: `59` lines
  - `packages/tools/src/data/relational/query/batch-executor-runtime.ts`: `17` lines
  - `packages/tools/src/data/relational/query/batch-executor-types.ts`: `88` lines

## Test Modularization Results

- Test files:
  - `packages/tools/tests/data/relational/query/batch-executor.test.ts`: `8` lines
  - `packages/tools/tests/data/relational/query/batch-executor/shared.ts`: `6` lines
  - `packages/tools/tests/data/relational/query/batch-executor/chunking.test.ts`: `28` lines
  - `packages/tools/tests/data/relational/query/batch-executor/retry.test.ts`: `31` lines
  - `packages/tools/tests/data/relational/query/batch-executor/failure.test.ts`: `46` lines
  - `packages/tools/tests/data/relational/query/batch-executor/benchmark.test.ts`: `24` lines

## Explicit-`any` Baseline

- `pnpm lint:explicit-any:baseline`
- Result: `84/289` warnings overall, `53/67` in `tools`
- Delta: no regression

## Residual Test Impact

No additional automated coverage was required beyond the focused batch-executor split. The entrypoint and shared harness now keep chunking, retry, failure, and benchmark assertions isolated while the rest of the relational test suite continues to confirm the public query tooling remains compatible.

## Validation

- Focused batch coverage:
  - `pnpm test --run packages/tools/tests/data/relational/query/batch-executor.test.ts`
  - `1` file passed, `5` tests passed
- Package compatibility:
  - `pnpm --filter @agentforge/tools typecheck`
- Explicit-`any` baseline:
  - `pnpm lint:explicit-any:baseline`
  - Passed with no baseline regression
- Full test suite:
  - `pnpm test --run`
  - `215 passed | 18 skipped` files; `2328 passed | 286 skipped` tests
- Lint:
  - `pnpm lint`
  - exit `0`; warnings only (`0` errors)

## CI Impact

No CI change required. The story preserves the batch-executor public facade and keeps the existing validation commands intact.
