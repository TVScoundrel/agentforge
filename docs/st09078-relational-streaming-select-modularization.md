# ST-09078: Relational Streaming SELECT Modularization

## Summary

`packages/tools/src/data/relational/query/stream-executor.ts` was reduced from a `359` line mixed-responsibility runtime to a `19` line public facade. Pagination/limit normalization, row extraction, chunk pagination, streaming execution, and benchmark flow now live in focused helpers while preserving the public streaming SELECT API.

The streaming SELECT test surface was also reorganized from a single `148` line file into a thin public entrypoint plus focused suites for chunking, execution, and benchmark behavior.

## Test Strategy

- Story type: behavior-preserving modularization
- Test-first decision:
  - Added characterization coverage before production edits for:
    - total-row limiting via `limit` plus `maxRows`
    - sampled row collection vs `collectAllRows`
    - existing chunking, cancellation, and benchmark behavior
  - The new focused suite passed on the pre-refactor implementation, so a red-first failure was not meaningful for this story. The added tests serve as compatibility coverage for the structural refactor.

## Module Layout

### Production

- Before:
  - `packages/tools/src/data/relational/query/stream-executor.ts` (`359` lines)
- After:
  - `packages/tools/src/data/relational/query/stream-executor.ts` (`19` lines facade)
  - `packages/tools/src/data/relational/query/stream-executor-types.ts` (`64` lines)
  - `packages/tools/src/data/relational/query/stream-executor-options.ts` (`74` lines)
  - `packages/tools/src/data/relational/query/stream-executor-runtime.ts` (`11` lines)
  - `packages/tools/src/data/relational/query/stream-executor-chunks.ts` (`87` lines)
  - `packages/tools/src/data/relational/query/stream-executor-execution.ts` (`96` lines)
  - `packages/tools/src/data/relational/query/stream-executor-benchmark.ts` (`73` lines)

### Tests

- Before:
  - `packages/tools/tests/data/relational/relational-select/stream-executor.test.ts` (`148` lines)
- After:
  - `packages/tools/tests/data/relational/relational-select/stream-executor.test.ts` (public entrypoint)
  - `packages/tools/tests/data/relational/relational-select/stream-executor/shared.ts` (`23` lines)
  - `packages/tools/tests/data/relational/relational-select/stream-executor/chunking.suite.ts` (`46` lines)
  - `packages/tools/tests/data/relational/relational-select/stream-executor/execution.suite.ts` (`90` lines)
  - `packages/tools/tests/data/relational/relational-select/stream-executor/benchmark.suite.ts` (`24` lines)

## Compatibility Notes

- Public exports remain unchanged for:
  - `streamSelectChunks(...)`
  - `createSelectReadableStream(...)`
  - `executeStreamingSelect(...)`
  - `benchmarkStreamingSelectMemory(...)`
  - related option/result types and `DEFAULT_CHUNK_SIZE`
- Chunk paging still uses the existing `LIMIT/OFFSET` flow, including abort handling and partial final-page termination.
- Benchmark behavior remains intentionally double-execution (`regular + streaming`) and still forces `collectAllRows: false` with `sampleSize: 0` for the streaming leg.

## Validation

- Focused characterization suite before production split:
  - `./node_modules/.bin/vitest --run packages/tools/tests/data/relational/relational-select/stream-executor.test.ts`
  - Result: `1` file passed, `7` tests passed
- Focused suite after production split:
  - `./node_modules/.bin/vitest --run packages/tools/tests/data/relational/relational-select/stream-executor.test.ts`
  - Result: `1` file passed, `7` tests passed
- Package typecheck:
  - `pnpm --filter @agentforge/tools typecheck`
  - Result: passed
- Tools-package validation:
  - `./node_modules/.bin/vitest --run packages/tools/tests/**/*.test.ts packages/tools/src/**/__tests__/**/*.test.ts`
  - Result: `87` files passed, `9` skipped; `1147` tests passed, `110` skipped
- Explicit-`any` baseline:
  - `pnpm lint:explicit-any:baseline`
  - Result: passed; workspace baseline remains `80/289`, `tools` remains `53/67`
- Full suite:
  - `pnpm test --run`
  - Result: `222` files passed, `9` skipped; `2511` tests passed, `110` skipped
- Lint:
  - `pnpm lint`
  - Result: passed with pre-existing warnings only

## CI Impact

- No CI/configuration change required for this story.
- Note:
  - `pnpm --filter @agentforge/tools test --run` still resolves tests from the package cwd and reports no files because the shared workspace Vitest include globs are repo-root relative. The story used the root Vitest runner for actual `@agentforge/tools` package validation and left that broader script-shape issue out of scope.
