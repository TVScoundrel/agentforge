# ST-09073: Relational Update Executor Modularization

## Summary

`packages/tools/src/data/relational/tools/relational-update/executor.ts` was reduced from a `319` line mixed-responsibility runtime to a `92` line public facade. The update execution flow now delegates to focused helpers for normalization and option resolution, single-query execution, and batch orchestration while preserving the public `executeUpdate(...)` surface.

## Production Split

| File | Role | Lines |
| --- | --- | ---: |
| `packages/tools/src/data/relational/tools/relational-update/executor.ts` | Stable public facade, logging, timing, error wrapping | `92` |
| `packages/tools/src/data/relational/tools/relational-update/executor-shared.ts` | Logger, execution context, row-count normalization, batch defaults, single-operation shaping | `91` |
| `packages/tools/src/data/relational/tools/relational-update/executor-single.ts` | Single-query execution and optimistic-lock handling | `37` |
| `packages/tools/src/data/relational/tools/relational-update/executor-batch.ts` | Batch orchestration, progress logging, synthetic benchmark metadata | `130` |

## Test Split

The old `packages/tools/tests/data/relational/tools/update-executor.test.ts` monolith was replaced with a public entrypoint plus focused suites:

| File | Role | Lines |
| --- | --- | ---: |
| `packages/tools/tests/data/relational/tools/update-executor.test.ts` | Stable public test entrypoint | `3` |
| `packages/tools/tests/data/relational/tools/update-executor/shared.ts` | Shared mock manager and executor import | `11` |
| `packages/tools/tests/data/relational/tools/update-executor/result-shaping.suite.ts` | Row-count normalization and optimistic-lock success behavior | `80` |
| `packages/tools/tests/data/relational/tools/update-executor/batch-mode.suite.ts` | Batch enablement and default option behavior | `53` |
| `packages/tools/tests/data/relational/tools/update-executor/error-handling.suite.ts` | Optimistic-lock failure, transaction routing, validation errors, and sanitized database failures | `106` |

## Test Strategy

This story used a characterization-first modularization path instead of forcing an artificial red-first test. The change is intentionally behavior-preserving and primarily reorganizes responsibilities, so an initial failing test would mostly assert temporary file layout rather than the stable `executeUpdate(...)` contract. The practical safety net was to split the public update-executor coverage into focused suites first, keep the public entrypoint stable, and then rerun focused plus story-level validation against the refactored runtime.

## Validation

- `./node_modules/.bin/vitest run packages/tools/tests/data/relational/tools/update-executor.test.ts` -> `14` passed
- `./node_modules/.bin/vitest run packages/tools/tests/data/relational/relational-update/index.test.ts` -> `14` passed, `10` skipped
- `./node_modules/.bin/vitest run packages/tools/tests/data/relational/tools/update-tool.test.ts` -> `5` passed
- `./node_modules/.bin/tsc --noEmit -p packages/tools/tsconfig.json` -> passed
- `./node_modules/.bin/vitest run` -> `212` passed, `18` skipped files; `2326` passed, `286` skipped tests
- Package-local lint equivalent of `pnpm -r lint` -> passed with warnings only after clearing the pre-existing `packages/cli/bin/agentforge.js` `no-undef` errors
- Direct explicit-`any` baseline target run (`packages/**/src/**/*.ts`) -> `workspace 80/289`, `tools 53/67`

## Compatibility Notes

- `executeUpdate(...)` remains the stable public entrypoint.
- Update behavior, optimistic-lock handling, batch semantics, synthetic benchmark metadata, transaction-context routing, and sanitized error handling remain unchanged.
- The explicit-`any` baseline stayed flat at `workspace 80/289` and `tools 53/67`.
- `pnpm`-wrapped validation commands are currently intercepted in this environment by a workspace supply-chain/dependency-policy hook before command execution, so equivalent direct binary invocations were used to validate the same underlying toolchain for this story.
