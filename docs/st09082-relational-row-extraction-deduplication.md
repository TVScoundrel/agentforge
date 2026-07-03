# ST-09082: Centralize Relational Row Extraction Helpers

## Summary

This story removes repeated relational row-extraction logic by introducing a shared helper at `packages/tools/src/data/relational/query/row-extraction.ts` and reusing it in both the streaming SELECT runtime and the focused SQLite-backed relational INSERT/UPDATE/DELETE query-builder suites.

## Test Strategy

- Red-first automated coverage was practical.
- Added `packages/tools/tests/data/relational/query/row-extraction.test.ts` first to define the shared array-vs-`{ rows }` contract before the helper existed.
- The initial focused run failed as intended because `../../../../src/data/relational/query/row-extraction.js` did not exist yet.
- After implementation, re-ran the focused helper and touched relational suites to confirm the shared helper preserved existing behavior.

## Compatibility Notes

- Result-shape compatibility remains unchanged:
  - direct array results still pass through unchanged
  - wrapped `{ rows }` results still unwrap to the contained row array
  - malformed or non-row results still normalize to `[]`
- No public relational query-builder or streaming API changed.
- No CI or release-automation change was required because the existing test and lint commands already cover this refactor.

## Validation

- Focused red-first failure:
  - `pnpm --filter @agentforge/tools test --run tests/data/relational/query/row-extraction.test.ts`
  - failed because the new shared helper module did not exist yet
- Focused post-implementation validation:
  - `pnpm --filter @agentforge/tools test --run tests/data/relational/query/row-extraction.test.ts tests/data/relational/relational-insert/query-builder.test.ts tests/data/relational/relational-update/query-builder.test.ts tests/data/relational/relational-delete/query-builder.test.ts tests/data/relational/relational-select/stream-executor.test.ts`
  - `5` files passed, `23` tests passed
