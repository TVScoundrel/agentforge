# ST-09038: Extract Data Transformer Object Path Helpers

## Summary

Extracted shared helper functions for nested path lookup plus object property pick/omit behavior in the transformer toolset. The change removes duplicated ad hoc logic from `array-filter`, `array-sort`, `object-pick`, and `object-omit` while keeping runtime behavior unchanged.

## Scope

Touched files:
- `packages/tools/src/data/transformer/tools/array-filter.ts`
- `packages/tools/src/data/transformer/tools/array-sort.ts`
- `packages/tools/src/data/transformer/tools/object-pick.ts`
- `packages/tools/src/data/transformer/tools/object-omit.ts`
- `packages/tools/src/data/transformer/tools/shared.ts`
- `packages/tools/tests/data/transformer/transformer-helpers.test.ts`

## Test Strategy

Test-first path used.

The first failing test targeted the missing shared helper seam directly:
- `pnpm test --run packages/tools/tests/data/transformer/transformer-helpers.test.ts`
- initial failure: `Failed to load url ../../../src/data/transformer/tools/shared.js`

That failure proved the story still lacked the extracted shared helper module before production changes.

## Validation

Focused validation after implementation:
- `pnpm test --run packages/tools/tests/data/transformer/transformer-helpers.test.ts`
- `pnpm exec eslint packages/tools/src/data/transformer/tools/array-filter.ts packages/tools/src/data/transformer/tools/array-sort.ts packages/tools/src/data/transformer/tools/object-pick.ts packages/tools/src/data/transformer/tools/object-omit.ts packages/tools/src/data/transformer/tools/shared.ts packages/tools/tests/data/transformer/transformer-helpers.test.ts`
- `pnpm test --run`
- `pnpm lint`

Coverage added in the focused regression file:
- nested path lookup
- missing nested paths
- primitive root values for nested lookup
- object pick behavior
- object omit behavior
- array filter nested property behavior
- array sort nested property behavior

## Explicit-any Delta

Touched helper/tool files:
- before: `6`
- after: `0`

Notes:
- `array-filter.ts`: `2 -> 0`
- `array-sort.ts`: `2 -> 0`
- `object-pick.ts`: `1 -> 0`
- `object-omit.ts`: `1 -> 0`
- `shared.ts`: introduced with `0`

## Behavior Notes

Preserved behavior includes:
- equality, inequality, comparison, contains, starts-with, and ends-with filtering
- ascending/descending sorting by nested property path
- object projection based on listed properties using the existing `prop in object` lookup behavior
- object omission based on listed properties

The new shared helper module only centralizes these behaviors; it does not broaden scope into `array-map` or `array-group-by`.
