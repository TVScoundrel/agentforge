# ST-09050: Tool Builder Modularization

## Summary

`packages/core/src/tools/builder.ts` was reduced from `434` lines to a small public facade well below the `300` line planning cutoff by moving the remaining responsibilities into focused internal modules:

- `packages/core/src/tools/builder-metadata.ts`
- `packages/core/src/tools/builder-implementation.ts`
- `packages/core/src/tools/builder-finalize.ts`

The builder entry point still owns the public fluent API, while metadata cloning, invoke wrapping, and build-time validation now live behind explicit internal seams.

## Test Modularization

The monolithic `packages/core/tests/tools/builder.test.ts` was replaced with focused public-behavior suites:

- `packages/core/tests/tools/builder-basic.test.ts`
- `packages/core/tests/tools/builder-metadata.test.ts`
- `packages/core/tests/tools/builder-validation.test.ts`
- `packages/core/tests/tools/builder-typing.test.ts`
- `packages/core/tests/tools/builder-safe.test.ts`
- `packages/core/tests/tools/builder-relations.test.ts`

This keeps builder creation, metadata mutation, validation, type behavior, safe execution, and relation helpers independently reviewable instead of coupling every public behavior to one file.

## Compatibility Notes

- `ToolBuilder` and `toolBuilder` remain exported from `packages/core/src/tools/builder.ts` and re-exported from `packages/core/src/tools/index.ts`.
- Fluent chaining order remains stable for schema-first, invoke-first, and `implementSafe` paths.
- Metadata isolation still depends on cloning when the builder branches into typed variants.
- Invoke `this` binding remains compatible through both `implement(...)` and `implementSafe(...)`.

## Validation

- `pnpm test --run packages/core/tests/tools/builder-basic.test.ts packages/core/tests/tools/builder-metadata.test.ts packages/core/tests/tools/builder-validation.test.ts packages/core/tests/tools/builder-typing.test.ts packages/core/tests/tools/builder-safe.test.ts packages/core/tests/tools/builder-relations.test.ts`
  - `6` files passed, `34` tests passed
- `pnpm --filter @agentforge/core typecheck`
- `pnpm --filter @agentforge/core exec eslint src/tools/builder.ts src/tools/builder-metadata.ts src/tools/builder-implementation.ts src/tools/builder-finalize.ts tests/tools/builder-basic.test.ts tests/tools/builder-metadata.test.ts tests/tools/builder-validation.test.ts tests/tools/builder-typing.test.ts tests/tools/builder-safe.test.ts tests/tools/builder-relations.test.ts`
- `pnpm lint:explicit-any:baseline`
  - workspace: `84/289`
  - core: `23/119`

## Explicit-`any` Notes

- This story did not increase the explicit-`any` baseline.
- The touched builder modules do not introduce new explicit-`any` warnings.
