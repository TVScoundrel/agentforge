# ST-09058: Tool Lifecycle Modularization

## Summary

`ST-09058` modularizes the core managed-tool lifecycle runtime and its coupled lifecycle tests without changing the public lifecycle API. The public `lifecycle.ts` file is now a minimal facade while initialization, cleanup, health/liveness coordination, and shared lifecycle state move into focused internal modules.

## Test Strategy

A structure-only failing test would mostly prove file layout rather than managed-tool behavior. For this story, the real contract is preserving initialization semantics, invocation behavior, cleanup paths, health checks, stale-tool detection, and public imports while splitting the oversized runtime and coupled test surface.

The practical test-first substitute was:

- split `packages/core/tests/tools/lifecycle.test.ts` into focused initialization, execution, cleanup, and health suites first
- use those focused suites as the regression net while extracting lifecycle responsibilities behind the stable public facade

No additional CI automation was required because the existing `@agentforge/core` typecheck, focused lifecycle runs, workspace test suite, lint, and explicit-`any` baseline gate already cover the changed surfaces.

## Runtime And Test Layout

### Production

- `packages/core/src/tools/lifecycle.ts`: `405` -> `11` lines
- Added `packages/core/src/tools/lifecycle-managed-tool.ts`: `185` lines
- Added `packages/core/src/tools/lifecycle-types.ts`: `39` lines
- Added `packages/core/src/tools/lifecycle-health.ts`: `94` lines
- Added `packages/core/src/tools/lifecycle-hooks.ts`: `114` lines
- Added `packages/core/src/tools/lifecycle-internal-types.ts`: `14` lines
- Added `packages/core/src/tools/lifecycle-error.ts`: `3` lines

### Tests

- Replaced `packages/core/tests/tools/lifecycle.test.ts`: `574` lines
- Added `packages/core/tests/tools/lifecycle-initialization.test.ts`: `148` lines
- Added `packages/core/tests/tools/lifecycle-execution.test.ts`: `49` lines
- Added `packages/core/tests/tools/lifecycle-cleanup.test.ts`: `102` lines
- Added `packages/core/tests/tools/lifecycle-health.test.ts`: `298` lines

## Behavior Preserved

- `ManagedTool` initialization, invocation, cleanup, and health-check behavior remain unchanged
- lifecycle state transitions still prevent invoke-before-init, double-init, and post-cleanup misuse
- periodic health checks and stale-tool detection still update tool stats and lifecycle status consistently
- process-exit cleanup registration remains centralized and backward compatible
- public imports from `packages/core/src/tools/lifecycle.ts` remain stable through the facade re-exports

## Explicit-`any` Baseline

- `pnpm lint:explicit-any:baseline` remained stable at `84/289` workspace warnings
- `@agentforge/core` remained at `23/119`

## Validation

- Focused lifecycle suites:
  - `pnpm test --run packages/core/tests/tools/lifecycle-initialization.test.ts packages/core/tests/tools/lifecycle-execution.test.ts packages/core/tests/tools/lifecycle-cleanup.test.ts packages/core/tests/tools/lifecycle-health.test.ts`
  - `4` files passed, `18` tests passed
- Package checks:
  - `pnpm --filter @agentforge/core typecheck`
  - `pnpm --filter @agentforge/core exec eslint src/tools/lifecycle.ts src/tools/lifecycle-managed-tool.ts src/tools/lifecycle-types.ts src/tools/lifecycle-internal-types.ts src/tools/lifecycle-error.ts src/tools/lifecycle-health.ts src/tools/lifecycle-hooks.ts tests/tools/lifecycle-initialization.test.ts tests/tools/lifecycle-execution.test.ts tests/tools/lifecycle-cleanup.test.ts tests/tools/lifecycle-health.test.ts`
- Workspace checks:
  - `pnpm lint:explicit-any:baseline`
  - `pnpm test --run` -> `210` files passed, `18` skipped; `2307` tests passed, `286` skipped
  - `pnpm lint` -> passed with warnings only
  - `git diff --check`

## Notes

- The workspace passed test-file count increased from `207` to `210` because the old lifecycle monolith was replaced by four focused suites. The story preserves lifecycle behavior coverage rather than raw one-file parity.
