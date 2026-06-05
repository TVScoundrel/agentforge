# ST-09057: Transaction Flow Modularization

## Summary

`ST-09057` modularizes the relational transaction runtime and its coupled unit tests without changing the public transaction API. The public `transaction.ts` surface remains a small facade while option resolution, timeout handling, managed transaction lifecycle, and top-level transaction orchestration move into focused internal modules.

## Test Strategy

A structure-only failing test would mostly prove file layout rather than transaction behavior. For this story, the real contract is preserving transaction commit/rollback behavior, vendor-specific isolation handling, timeout cancellation, savepoint behavior, and exported transaction types while splitting the oversized runtime and coupled test surface.

The practical test-first substitute was:

- split `packages/tools/tests/data/relational/query/transaction.test.ts` into focused lifecycle, option-handling, and savepoint suites first
- keep the existing relational integration coverage in `packages/tools/tests/data/relational/transaction.test.ts` and `transaction-timeout-and-savepoint.test.ts` as the higher-level regression net during runtime extraction

No additional CI automation was required because the existing `@agentforge/tools` typecheck, focused test runs, workspace test suite, lint, and explicit-`any` baseline gate already cover the changed surfaces.

## Runtime And Test Layout

### Production

Current PR-head counts:

- `packages/tools/src/data/relational/query/transaction.ts`: `419` -> `14` lines
- Added `packages/tools/src/data/relational/query/transaction-types.ts`: `30` lines
- Added `packages/tools/src/data/relational/query/transaction-options.ts`: `64` lines
- Added `packages/tools/src/data/relational/query/transaction-managed.ts`: `207` lines
- Added `packages/tools/src/data/relational/query/transaction-runner.ts`: `83` lines

### Tests

Current PR-head counts:

- Replaced `packages/tools/tests/data/relational/query/transaction.test.ts`: `338` lines
- Added `packages/tools/tests/data/relational/query/transaction-lifecycle.test.ts`: `117` lines
- Added `packages/tools/tests/data/relational/query/transaction-options.test.ts`: `64` lines
- Added `packages/tools/tests/data/relational/query/transaction-savepoints.test.ts`: `97` lines
- Added shared helper `packages/tools/tests/data/relational/query/transaction.test-utils.ts`: `18` lines

## Behavior Preserved

- `withTransaction()` still begins, commits, and rolls back transactions automatically
- timeout cancellation still blocks late `execute()` calls and surfaces the same timeout error
- savepoint creation, rollback, release, and `withSavepoint()` helper behavior remain unchanged
- MySQL and SQLite isolation-level handling remain backward compatible
- exported `TransactionContext`, `TransactionOptions`, and `TransactionIsolationLevel` imports stay stable through the public facade

## Explicit-`any` Baseline

- `pnpm lint:explicit-any:baseline` remained stable at `84/289` workspace warnings
- `@agentforge/tools` remained at `53/67`

## Validation

- Focused transaction suites:
  - `pnpm test --run packages/tools/tests/data/relational/query/transaction-lifecycle.test.ts packages/tools/tests/data/relational/query/transaction-options.test.ts packages/tools/tests/data/relational/query/transaction-savepoints.test.ts packages/tools/tests/data/relational/transaction.test.ts packages/tools/tests/data/relational/transaction-timeout-and-savepoint.test.ts`
  - `4` files passed, `1` file skipped; `30` tests passed, `4` skipped
- Package checks:
  - `pnpm --filter @agentforge/tools typecheck`
  - `pnpm --filter @agentforge/tools exec eslint src/data/relational/query/transaction.ts src/data/relational/query/transaction-types.ts src/data/relational/query/transaction-options.ts src/data/relational/query/transaction-managed.ts src/data/relational/query/transaction-runner.ts tests/data/relational/query/transaction-lifecycle.test.ts tests/data/relational/query/transaction-options.test.ts tests/data/relational/query/transaction-savepoints.test.ts tests/data/relational/query/transaction.test-utils.ts`
- Workspace checks:
  - `pnpm lint:explicit-any:baseline`
  - `pnpm test --run`
  - `207` files passed, `18` skipped; `2307` tests passed, `286` skipped
  - `pnpm lint`
  - exit `0`; warnings only (`0` errors)

## Notes

- The workspace test count decreased from `2313` to `2307` because the old monolithic query transaction test file was replaced by three focused suites with duplicated assertions removed. The story preserves transaction behavior coverage rather than preserving raw test-count parity.
