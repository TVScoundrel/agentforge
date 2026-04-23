# ST-09031: Extract Tool Registry Registration and Mutation Paths

## Summary

`packages/core/src/tools/registry.ts` still carried the public mutation paths after the earlier collection, prompt, and event helper splits. This story extracted registration, update, removal, bulk-registration, and clear behavior into a focused internal helper so the public `ToolRegistry` facade stays stable while the mutation boundary becomes easier to review and evolve.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/tools/registry.ts` | Reduced the public registry facade to delegate mutation paths to focused helpers while preserving the existing public API and event flow. |
| `packages/core/src/tools/registry-mutations.ts` | Added focused helper functions for register, remove, update, bulk register, and clear operations, preserving the existing duplicate/conflict and name-consistency error messages. |
| `packages/core/tests/tools/registry-mutations.test.ts` | Added focused helper coverage for registration conflicts, updates, removals, clear behavior, and bulk-registration edge cases. |
| `packages/core/tests/tools/registry.test.ts` | Preserved the broader public facade coverage over `ToolRegistry` after the mutation extraction. |

## Compatibility Notes

- `ToolRegistry` remains the stable public entrypoint for registration and mutation flows.
- Public runtime behavior for duplicate registration remains unchanged, including the existing error message.
- Public runtime behavior for update name-consistency checks remains unchanged, including the existing rename guidance.
- Public runtime behavior for bulk-registration duplicate and conflict detection remains unchanged.
- Mutation event payloads remain unchanged for register, remove, update, and clear operations.

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/tools/registry.ts`: `0 -> 0` (`0`)
- `packages/core/src/tools/registry-mutations.ts`: `0 -> 0` (`0`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `180 -> 180` (`0`)
- `core` package: `63 -> 63` (`0`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-04-23.)

## Validation

- `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
- `pnpm exec eslint packages/core/src/tools/registry.ts packages/core/src/tools/registry-mutations.ts packages/core/tests/tools/registry.test.ts packages/core/tests/tools/registry-mutations.test.ts`
  - passed cleanly
- `pnpm test --run packages/core/tests/tools/registry.test.ts packages/core/tests/tools/registry-events.test.ts packages/core/tests/tools/registry-collection.test.ts packages/core/tests/tools/registry-prompt.test.ts packages/core/tests/tools/registry-mutations.test.ts`
  - `5 passed` files, `59 passed` tests
- `pnpm lint:explicit-any:baseline --silent`
  - `180/289` warnings, `core 63/119`
- `pnpm test --run`
  - `162 passed | 16 skipped` files
  - `2225 passed | 286 skipped` tests
- `pnpm lint`
  - exit `0`; warnings only

## Test Impact

Added a focused mutation-helper suite so duplicate/conflict handling, update invariants, removal behavior, and clear semantics are exercised directly, while preserving the existing `ToolRegistry` facade suite to catch public-surface regressions.
