# ST-09025: Extract Tool Registry Collection and Search Operations

## Summary

Extracted the tool registry’s collection and search behavior into a focused helper module so the main `ToolRegistry` class stops owning both storage/event flows and basic lookup logic.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/tools/registry.ts` | Delegated `getAll`, `getByCategory`, `getByTag`, `search`, and `getNames` to a dedicated collection/search helper while keeping the public registry API unchanged |
| `packages/core/src/tools/registry-collection.ts` | Added focused helper functions for ordered tool listing, category/tag filtering, and case-insensitive search across tool name, display name, and description |
| `packages/core/tests/tools/registry-collection.test.ts` | Added focused runtime coverage for ordered tool listing, category/tag filtering, and name/display-name/description search behavior |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/tools/registry.ts`: `8 -> 8` (`0`)
- `packages/core/src/tools/registry-collection.ts`: `0 -> 0` (`0`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `182 -> 182` (`0`)
- `core` package: `63 -> 63` (`0`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-04-08.)

## Compatibility Notes

- Public `ToolRegistry` lookup behavior remains unchanged for `getAll`, `getByCategory`, `getByTag`, `search`, and `getNames`.
- Search remains case-insensitive and still matches against tool name, display name, and description.
- The extraction is internal only; no new tool-registry helper APIs were added to the public `@agentforge/core` export surface.

## Validation

- `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
- `pnpm exec eslint packages/core/src/tools/registry.ts packages/core/src/tools/registry-collection.ts packages/core/tests/tools/registry.test.ts packages/core/tests/tools/registry-collection.test.ts`
- `pnpm test --run packages/core/tests/tools/registry.test.ts packages/core/tests/tools/registry-collection.test.ts` -> `2 passed` files, `46 passed` tests
- `pnpm lint:explicit-any:baseline --silent` -> `182/289` warnings, `core 63/119`
- `pnpm test --run` -> pending
- `pnpm lint` -> pending

## Test Impact

Added a focused registry-collection test suite so the extracted lookup/search helpers have direct coverage without relying only on the broader `ToolRegistry` integration tests.
