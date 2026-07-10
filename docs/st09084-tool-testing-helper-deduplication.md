# ST-09084: Tool Testing Helper Deduplication

## Summary

Reduced duplicated async mock-tool behavior across `@agentforge/core` and `@agentforge/testing` by centralizing the shared latency/error wrapper in `packages/core/src/tools/testing-runtime.ts`. The core `createMockTool(...)` and `createToolSimulator(...)` helpers now route through that shared runtime, and `packages/testing/src/mocks/mock-tool.ts` reuses the same runtime while preserving its schema-backed `Tool` facade.

The story also fixed a pre-existing validation-path issue in `@agentforge/testing`: `pnpm --filter @agentforge/testing test --run` previously executed from `packages/testing` while still relying on workspace-root Vitest include globs, so it discovered no test files. A package-local `vitest.config.ts` and script wiring now align that package with the same pattern already used in `core`, `tools`, and `cli`.

## Test Strategy

- Story type: behavior-preserving cross-package deduplication plus package-local validation-path repair
- Focused validation target:
  - `pnpm --filter @agentforge/core test --run tests/tools/testing.test.ts`
  - `pnpm --filter @agentforge/testing test --run`
  - `pnpm --filter @agentforge/core typecheck`
  - `pnpm --filter @agentforge/testing typecheck`
- Test-first decision:
  - A new failing automated test was not practical because the primary change is structural deduplication of existing behavior rather than a new externally visible branch.
  - The story therefore added characterization coverage first for simulator-level injected errors, then performed the refactor under that focused test net.

## What Changed

### Shared async mock runtime

- Added `packages/core/src/tools/testing-runtime.ts` with `runMockExecution(...)` and `MockExecutionRuntimeOptions`.
- The shared runtime owns:
  - optional delay resolution
  - boolean or predicate-driven injected errors
  - consistent error-factory handling ahead of the actual tool implementation

### Core helper reuse

- `packages/core/src/tools/testing.ts` now uses `runMockExecution(...)` for:
  - `createMockTool(...)` latency/error wrapping
  - `createToolSimulator(...)` latency/error wrapping
- Invocation recording semantics remain unchanged:
  - successful calls still record `output`
  - failures still record `error`
  - timestamps/durations are still captured at the public helper boundary

### Testing package reuse

- `packages/testing/src/mocks/mock-tool.ts` now uses the same shared runtime for:
  - artificial delay
  - forced error behavior
  - default/custom implementation execution
- Public testing helpers remain unchanged:
  - `createMockTool(...)`
  - `createEchoTool(...)`
  - `createErrorTool(...)`
  - `createDelayedTool(...)`
  - `createCalculatorTool(...)`

### Validation-path repair

- Added `packages/testing/vitest.config.ts` with package-local include globs.
- Updated `packages/testing/package.json` test scripts to use that config explicitly.
- This restores the documented package-scoped validation path without changing the root workspace Vitest flow.

## Compatibility Notes

- No existing public imports were removed or renamed.
- `@agentforge/core` still exports `createMockTool(...)` and `createToolSimulator(...)` from the same entrypoint.
- `@agentforge/testing` still exports the same schema-backed mock-tool helpers from the same entrypoint.
- The new shared runtime helper is additive and exists to stop delay/error behavior from drifting across the two packages.

## Validation

- Focused core helper suite:
  - `pnpm --filter @agentforge/core test --run tests/tools/testing.test.ts`
  - Result: `4` passed tests
- Focused testing-package suite:
  - `pnpm --filter @agentforge/testing test --run`
  - Result: `5` passed files; `45` passed tests
- Package typecheck:
  - `pnpm --filter @agentforge/core typecheck`
  - Result: passed
  - `pnpm --filter @agentforge/testing typecheck`
  - Result: passed

## CI Impact

- No CI workflow change required.
- The story fixes a package-local validation path and removes duplicated runtime behavior while staying within the existing `pnpm` test/typecheck/lint flows.
