# ST-09074: Relational Delete Executor Modularization

## Summary

`packages/tools/src/data/relational/tools/relational-delete/executor.ts` was reduced from a `324` line mixed-responsibility runtime to a `97` line public facade. The delete execution flow now delegates to focused helpers for normalization and option resolution, single-query execution, and batch orchestration while preserving the public `executeDelete(...)` surface.

## Production Split

| File | Role | Lines |
| --- | --- | ---: |
| `packages/tools/src/data/relational/tools/relational-delete/executor.ts` | Stable public facade, logging, timing, error wrapping | `97` |
| `packages/tools/src/data/relational/tools/relational-delete/executor-shared.ts` | Logger, execution context, row-count normalization, batch defaults, single-operation shaping | `88` |
| `packages/tools/src/data/relational/tools/relational-delete/executor-single.ts` | Single-query execution and result shaping | `33` |
| `packages/tools/src/data/relational/tools/relational-delete/executor-batch.ts` | Batch orchestration, progress logging, synthetic benchmark metadata | `144` |

## Test Split

The old `packages/tools/tests/data/relational/tools/delete-executor.test.ts` monolith was replaced with a public entrypoint plus focused suites:

| File | Role | Lines |
| --- | --- | ---: |
| `packages/tools/tests/data/relational/tools/delete-executor.test.ts` | Stable public test entrypoint | `3` |
| `packages/tools/tests/data/relational/tools/delete-executor/shared.ts` | Shared mock manager and executor import | `11` |
| `packages/tools/tests/data/relational/tools/delete-executor/result-shaping.suite.ts` | Row-count normalization, soft-delete handling, and transaction routing | `107` |
| `packages/tools/tests/data/relational/tools/delete-executor/batch-mode.suite.ts` | Batch enablement and default option behavior | `68` |
| `packages/tools/tests/data/relational/tools/delete-executor/error-handling.suite.ts` | Constraint wrapping, validation errors, and sanitized database failures | `69` |

## Test Strategy

This story used a characterization-first modularization path instead of forcing an artificial red-first test. The change is intentionally behavior-preserving and primarily reorganizes responsibilities, so an initial failing test would mostly assert temporary file layout rather than the stable `executeDelete(...)` contract. The practical safety net was to split the public delete-executor coverage into focused suites first, keep the public entrypoint stable, and then rerun focused plus story-level validation against the refactored runtime.

## Validation

- `./node_modules/.bin/vitest run packages/tools/tests/data/relational/tools/delete-executor.test.ts` -> `15` passed
- `./node_modules/.bin/vitest run packages/tools/tests/data/relational/relational-delete/index.test.ts packages/tools/tests/data/relational/tools/delete-tool.test.ts` -> `33` passed, `10` skipped
- `./node_modules/.bin/tsc --noEmit -p packages/tools/tsconfig.json` -> passed
- Direct explicit-`any` baseline target run (`packages/**/src/**/*.ts`) -> `workspace 80/289`, `tools 53/67`
- `./node_modules/.bin/vitest run packages/tools/tests/data/relational/transaction-timeout-and-savepoint.test.ts` -> `2` passed (follow-up rerun after an unrelated flaky full-suite miss)
- `./node_modules/.bin/vitest run` -> `212` passed, `18` skipped files; `2326` passed, `286` skipped tests
- Package-local lint equivalent of `pnpm -r lint` -> passed with warnings only

## Compatibility Notes

- `executeDelete(...)` remains the stable public entrypoint.
- Delete behavior, soft-delete handling, batch semantics, synthetic benchmark metadata, transaction-context routing, and sanitized error handling remain unchanged.
- No CI or validation automation change is required for this story because the existing package-local and full-suite commands already cover the affected surfaces.
- `pnpm`-wrapped baseline validation is currently intercepted in this environment by the workspace preflight hook before `pnpm exec eslint` runs, so the baseline was verified by invoking `./node_modules/.bin/eslint` directly against the same `packages/**/src/**/*.ts` target and aggregating the JSON output with the baseline script's package-counting logic instead.
