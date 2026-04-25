# ST-09034: Tighten Snapshot Testing Runner Contracts

## Summary

`packages/testing/src/runners/snapshot-testing.ts` relied on broad `any` boundaries for state snapshots, normalization, state diffs, and message snapshots. This story tightens those contracts around `unknown` inputs and typed snapshot/diff outputs while preserving the existing runtime behavior for snapshot creation, timestamp and UUID normalization, state comparison, diffing, and message snapshot helpers.

## What Changed

| File | Change |
|------|--------|
| `packages/testing/src/runners/snapshot-testing.ts` | Replaced broad `any` snapshot and normalizer contracts with `unknown`-first inputs, typed snapshot object/diff/message snapshot outputs, and explicit root-level diff handling for non-object snapshot roots. |
| `packages/testing/src/index.ts` | Re-exported the new snapshot runner output types so downstream callers can reference the tightened contracts directly. |
| `packages/testing/tests/runners/snapshot-testing.test.ts` | Added focused runtime coverage for timestamp and UUID normalization, include/exclude filtering, custom normalizers, state comparison, state diffs, state-change assertions, and LangChain message snapshots. |

## Compatibility Notes

- Public function names and runtime behavior are preserved.
- Snapshot creation still enables timestamp and UUID normalization by default.
- Include and exclude field filtering still applies recursively to object snapshots.
- Custom normalizers still run before built-in normalization.
- Message snapshots still include message type and content only.
- State diffs still report top-level `added`, `removed`, and `changed` fields.
- Non-object root snapshots such as primitives, arrays, `null`, and `undefined` now report changes under the exported `$root` diff key instead of being coerced into object-like records.

## Explicit `any` Delta

`pnpm lint:explicit-any:baseline` after this change:

- Workspace: `153/289` warnings, down from `170/289`
- `testing`: `14/51` warnings, down from `31/51`
- Touched snapshot runner file: no remaining explicit `any` usage

## Validation

- `pnpm --filter @agentforge/testing typecheck` -> passed
- `pnpm exec eslint packages/testing/src/runners/snapshot-testing.ts packages/testing/src/index.ts packages/testing/tests/runners/snapshot-testing.test.ts` -> passed
- `pnpm test --run packages/testing/tests/runners/snapshot-testing.test.ts packages/testing/tests/helpers.test.ts` -> `2 passed` files, `19 passed` tests
- `pnpm lint:explicit-any:baseline` -> passed with `153/289` workspace warnings and `14/51` testing warnings
- `pnpm test --run` -> `164 passed | 16 skipped` files, `2250 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only

## Test Impact

Added a dedicated snapshot runner suite so the tightened contracts are covered directly rather than only through package-level exports or indirect helper use.
