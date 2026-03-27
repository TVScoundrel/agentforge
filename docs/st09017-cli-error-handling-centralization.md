# ST-09017: Centralize CLI Command Error Handling

## Summary

Consolidated repeated CLI command failure handling behind a shared helper so command modules no longer need their own `catch (error: any)` formatting and `process.exit(1)` boilerplate.

## What Changed

| File | Change |
|------|--------|
| `packages/cli/src/utils/command-errors.ts` | Added the shared CLI command error helper for unknown-error normalization, optional spinner failure handling, and command exit behavior |
| `packages/cli/src/commands/build.ts` | Replaced the local build failure catch block with the shared command error helper |
| `packages/cli/src/commands/dev.ts` | Replaced the local dev-server failure catch block with the shared command error helper |
| `packages/cli/src/commands/test.ts` | Replaced the local test failure catch block with the shared command error helper |
| `packages/cli/src/commands/lint.ts` | Replaced the outer lint command failure catch block with the shared command error helper while keeping lint/format subprocess failures non-fatal |
| `packages/cli/src/commands/create.ts` | Replaced repeated project-create validation and command failure exits with the shared helper and removed touched `any` usage |
| `packages/cli/src/commands/tool/*.ts` | Centralized the tool create/list/test/publish command failure paths while preserving npm-specific publish guidance |
| `packages/cli/src/commands/agent/*.ts` | Centralized the agent create/list/test/create-reusable/deploy failure paths while preserving the current deployment guidance output |
| `packages/cli/tests/utils/command-errors.test.ts` | Added focused coverage for error normalization, prefixed messages, spinner failure handling, and caller-managed logging |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/cli/src/commands/**`: `18 -> 0` (`-18`)
- `packages/cli/src/utils/command-errors.ts`: introduced with `0` explicit-`any` warnings

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `271 -> 253` (`-18`)
- `cli` package: `24 -> 6` (`-18`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-03-27.)

## Compatibility Notes

- Touched CLI commands preserve the existing user-facing failure messages, spinner failure text, and exit code `1`.
- `tool:publish` still emits its existing npm-specific guidance for auth, permission, and version-conflict failures; only the generic exit plumbing is centralized.
- `lint` still treats lint and format subprocess failures as non-fatal informational results inside the command, with only the outer command boundary routed through the shared helper.
- Commander top-level parse/help handling in `packages/cli/src/index.ts` was left unchanged; this story only centralizes command-module failure handling.

## Validation

- `pnpm exec tsc -p packages/cli/tsconfig.json --noEmit`
- `pnpm exec eslint packages/cli/src/commands/build.ts packages/cli/src/commands/dev.ts packages/cli/src/commands/test.ts packages/cli/src/commands/lint.ts packages/cli/src/commands/create.ts packages/cli/src/commands/tool/create.ts packages/cli/src/commands/tool/list.ts packages/cli/src/commands/tool/test.ts packages/cli/src/commands/tool/publish.ts packages/cli/src/commands/agent/create.ts packages/cli/src/commands/agent/list.ts packages/cli/src/commands/agent/test.ts packages/cli/src/commands/agent/create-reusable.ts packages/cli/src/commands/agent/deploy.ts packages/cli/src/utils/command-errors.ts packages/cli/tests/utils/command-errors.test.ts packages/cli/tests/commands/build.test.ts packages/cli/tests/commands/dev.test.ts packages/cli/tests/commands/lint.test.ts packages/cli/tests/commands/test.test.ts packages/cli/tests/commands/create.test.ts packages/cli/tests/commands/tool/create.test.ts packages/cli/tests/commands/tool/list.test.ts packages/cli/tests/commands/tool/test.test.ts packages/cli/tests/commands/tool/publish.test.ts packages/cli/tests/commands/agent/create.test.ts packages/cli/tests/commands/agent/list.test.ts packages/cli/tests/commands/agent/test.test.ts packages/cli/tests/commands/agent/create-reusable.test.ts packages/cli/tests/commands/agent/deploy.test.ts`
  - passed with warnings only in pre-existing CLI test files
- `pnpm test --run packages/cli/tests/commands/build.test.ts packages/cli/tests/commands/dev.test.ts packages/cli/tests/commands/lint.test.ts packages/cli/tests/commands/test.test.ts packages/cli/tests/commands/create.test.ts packages/cli/tests/commands/tool/create.test.ts packages/cli/tests/commands/tool/list.test.ts packages/cli/tests/commands/tool/test.test.ts packages/cli/tests/commands/tool/publish.test.ts packages/cli/tests/commands/agent/create.test.ts packages/cli/tests/commands/agent/list.test.ts packages/cli/tests/commands/agent/test.test.ts packages/cli/tests/commands/agent/create-reusable.test.ts packages/cli/tests/commands/agent/deploy.test.ts packages/cli/tests/utils/command-errors.test.ts` -> `15 passed` files, `105 passed` tests
- `pnpm lint:explicit-any:baseline --silent` -> `253/289` warnings, `cli 6/24`
- `pnpm test --run` -> `154 passed | 16 skipped` files; `2146 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only (`0` errors)

## Test Impact

Added direct automated coverage for the new shared CLI command error helper and revalidated the touched command suite through focused command tests plus the full workspace test pass. No manual-only gap remains for the changed command error boundary.
