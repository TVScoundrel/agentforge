# ST-09083: Tools Filtered Vitest Validation Path

## Summary

Restored the documented `@agentforge/tools` package-scoped test path by adding a package-local Vitest configuration in `packages/tools/vitest.config.ts` and updating the package test scripts to use it. This fixes `pnpm --filter @agentforge/tools test --run`, which previously executed from `packages/tools` while still relying on repo-root workspace include globs that resolved to no test files.

## Test Strategy

- Story type: package-script/configuration fix
- Focused validation target:
  - `pnpm --filter @agentforge/tools test --run`
  - `pnpm --filter @agentforge/tools typecheck`
- Test-first decision:
  - A narrow red-first unit seam was not practical because the failure mode lives in `pnpm`-driven package execution plus Vitest config resolution rather than a runtime helper with stable in-process inputs.
  - The story therefore used the real filtered package command as the primary characterization/validation seam before and after the configuration change.

## Configuration Change

### Before

- `packages/tools/package.json` used `vitest` directly for package scripts.
- Running `pnpm --filter @agentforge/tools test --run` executed from `packages/tools` and loaded the workspace configuration whose `include` globs are repo-root relative:
  - `packages/tools/tests/**/*.test.ts`
  - `packages/tools/src/**/__tests__/**/*.test.ts`
- From the package cwd, those patterns matched nothing and Vitest exited with `No test files found`.

### After

- Added `packages/tools/vitest.config.ts` that merges the shared root base config with tools-local include patterns:
  - `tests/**/*.test.ts`
  - `src/**/__tests__/**/*.test.ts`
- Updated `packages/tools/package.json` scripts to run:
  - `vitest --config vitest.config.ts`
  - `vitest --config vitest.config.ts --watch`
  - `vitest --config vitest.config.ts --ui`
  - `vitest --config vitest.config.ts --coverage`

## Compatibility Notes

- Root workspace validation remains unchanged:
  - `pnpm test --run` still uses the root Vitest workspace config
- The fix is limited to `@agentforge/tools` package-local scripts and does not alter other packages' script behavior
- Shared exclusions and node test environment still come from the root base Vitest config through config merging

## Validation

- Reproduced pre-fix failure:
  - `pnpm --filter @agentforge/tools test --run`
  - Result before fix: `No test files found`
- Package-scoped tools validation after fix:
  - `pnpm --filter @agentforge/tools test --run`
  - Result: `87` passed, `9` skipped files; `1147` passed, `110` skipped tests
- Package typecheck:
  - `pnpm --filter @agentforge/tools typecheck`
  - Result: passed
- Explicit-`any` baseline:
  - `pnpm lint:explicit-any:baseline`
  - Result: passed; workspace baseline remains `80/289`, `tools` remains `53/67`
- Full suite:
  - `pnpm test --run`
  - Result: `222` passed, `9` skipped files; `2511` passed, `110` skipped tests
- Lint:
  - `pnpm lint`
  - Result: passed with pre-existing warnings only

## CI Impact

- No CI change required.
- The story fixes a documented maintainer/package-validation path without changing the canonical root test command used in existing workspace automation.
