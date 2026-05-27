# ST-09052: Relational Query Builder Modularization

## Summary

`packages/tools/src/data/relational/query/query-builder.ts` was reduced from `731` lines to a `43` line public facade by extracting focused internal modules for the main relational query-builder responsibilities:

- `packages/tools/src/data/relational/query/query-builder-types.ts`
- `packages/tools/src/data/relational/query/query-builder-conditions.ts`
- `packages/tools/src/data/relational/query/query-builder-insert.ts`
- `packages/tools/src/data/relational/query/query-builder-mutation.ts`
- `packages/tools/src/data/relational/query/query-builder-select.ts`

The facade still owns the public export surface, while insert assembly, update/delete mutation assembly, select assembly, and shared condition handling now live behind explicit internal seams.

## Test Modularization

The monolithic `packages/tools/tests/data/relational/query/query-builder.test.ts` suite was replaced with focused query-builder behavior suites:

- `packages/tools/tests/data/relational/query/query-builder-insert.test.ts`
- `packages/tools/tests/data/relational/query/query-builder-update.test.ts`
- `packages/tools/tests/data/relational/query/query-builder-delete.test.ts`
- `packages/tools/tests/data/relational/query/query-builder-select.test.ts`

This keeps insert, update, delete, and select SQL-construction behavior independently reviewable instead of coupling all relational query-builder coverage to one file.

## Compatibility Notes

- Public query-builder exports remain available through `packages/tools/src/data/relational/query/query-builder.ts` and `packages/tools/src/data/relational/query/index.ts`.
- Existing SQL output, parameter ordering, identifier quoting, and vendor-specific branching remain preserved behind the split facade.
- Shared WHERE-clause construction is centralized so update, delete, and select paths stay aligned instead of re-implementing overlapping operator handling.
- SQLite heterogeneous multi-row insert handling remains isolated in the insert module without changing the public return shape.

## Validation

- `pnpm test --run packages/tools/tests/data/relational/query/query-builder-insert.test.ts packages/tools/tests/data/relational/query/query-builder-update.test.ts packages/tools/tests/data/relational/query/query-builder-delete.test.ts packages/tools/tests/data/relational/query/query-builder-select.test.ts`
  - `4` files passed, `61` tests passed
- `pnpm --filter @agentforge/tools typecheck`
- `pnpm --filter @agentforge/tools exec eslint src/data/relational/query/query-builder.ts src/data/relational/query/query-builder-types.ts src/data/relational/query/query-builder-conditions.ts src/data/relational/query/query-builder-insert.ts src/data/relational/query/query-builder-mutation.ts src/data/relational/query/query-builder-select.ts tests/data/relational/query/query-builder-insert.test.ts tests/data/relational/query/query-builder-update.test.ts tests/data/relational/query/query-builder-delete.test.ts tests/data/relational/query/query-builder-select.test.ts`
- `pnpm lint:explicit-any:baseline`
  - workspace: `84/289`
  - tools: `53/67`
- `pnpm test --run`
  - `193` files passed, `16` skipped
  - `2318` tests passed, `286` skipped
- `pnpm lint`
  - passed with warnings only

## Explicit-`any` Notes

- This story did not increase the explicit-`any` baseline.
- The touched relational query-builder modules do not introduce new explicit-`any` warnings.
