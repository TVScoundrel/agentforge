# ST-09079: CLI Tool Publish Command Modularization

## Summary

`packages/cli/src/commands/tool/publish.ts` was reduced from a `260` line mixed-responsibility command to a `39` line orchestration facade. Path resolution, optional preflight scripts, and publish result handling now live in focused helpers while preserving the public `toolPublishCommand(...)` surface and the existing user-facing npm guidance.

The publish command tests were also reorganized from a single `485` line file into a thin public entrypoint plus focused suites for happy paths, error handling, and path resolution.

## Test Strategy

- Story type: behavior-preserving modularization
- Test-first decision:
  - Reorganized the existing command coverage into focused characterization suites before extracting production helpers.
  - Added a dedicated generic publish-error case so the post-refactor error handler remained covered outside the auth/permission/version-conflict branches.
  - A true red-first test was not meaningful because the story does not add new externally visible behavior; the focused suites serve as the compatibility harness for the structural split.

## Module Layout

### Production

- Before:
  - `packages/cli/src/commands/tool/publish.ts` (`260` lines)
- After:
  - `packages/cli/src/commands/tool/publish.ts` (`39` lines facade)
  - `packages/cli/src/commands/tool/publish-types.ts` (`15` lines)
  - `packages/cli/src/commands/tool/publish-path.ts` (`115` lines)
  - `packages/cli/src/commands/tool/publish-preflight.ts` (`69` lines)
  - `packages/cli/src/commands/tool/publish-result.ts` (`69` lines)

### Tests

- Before:
  - `packages/cli/tests/commands/tool/publish.test.ts` (`485` lines)
- After:
  - `packages/cli/tests/commands/tool/publish.test.ts` (`3` lines entrypoint)
  - `packages/cli/tests/commands/tool/publish/shared.ts` (`34` lines)
  - `packages/cli/tests/commands/tool/publish/publish-happy-path.suite.ts` (`108` lines)
  - `packages/cli/tests/commands/tool/publish/publish-error-handling.suite.ts` (`90` lines)
  - `packages/cli/tests/commands/tool/publish/publish-path-resolution.suite.ts` (`220` lines)

## Compatibility Notes

- Public command surface remains unchanged:
  - `toolPublishCommand(name, options)`
- Existing behavior is preserved for:
  - dry-run messaging and publish options
  - current-directory resolution for matching unscoped and scoped package names
  - scoped-package lookup via scoped and unscoped folder candidates
  - optional test/build script detection and skip messaging
  - npm auth, permission, version-conflict, and generic publish error guidance
- Command-compatibility rationale:
  - The story acceptance criteria requires `pnpm --filter @agentforge/cli test --run`.
  - That command was pre-change broken because the CLI package executed the repo-root workspace Vitest config from `packages/cli`, leaving its `include` globs rooted incorrectly and matching no tests.
  - Added `packages/cli/vitest.config.ts` plus package-local test script wiring so filtered CLI validation now runs from the package cwd without relying on repo-root invocation.

## Validation

- Focused publish suite before production split:
  - `pnpm test --run packages/cli/tests/commands/tool/publish.test.ts`
  - Result: `1` file passed; `26` tests passed
- Focused publish suite after production split:
  - `pnpm test --run packages/cli/tests/commands/tool/publish.test.ts`
  - Result: `1` file passed; `26` tests passed
- CLI package validation:
  - `pnpm --filter @agentforge/cli test --run`
  - Result: `21` files passed; `192` tests passed
- CLI package typecheck:
  - `pnpm --filter @agentforge/cli typecheck`
  - Result: passed
- Explicit-`any` baseline:
  - `pnpm lint:explicit-any:baseline`
  - Result: passed; workspace baseline remains `80/289`, `cli` remains `6/24`, `tools` remains `53/67`
- Full suite:
  - `pnpm test --run`
  - Result: `223` files passed, `9` skipped; `2513` tests passed, `110` skipped
- Lint:
  - `pnpm lint`
  - Result: passed with pre-existing workspace warnings only

## CI Impact

- No CI workflow change required for this story.
- Validation automation change included in scope:
  - CLI package-local Vitest config was added so the acceptance command and future filtered package validation run correctly from `packages/cli`.
