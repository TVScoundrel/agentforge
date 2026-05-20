# ST-09046: Tighten Transformer Schema Value Contracts

## Summary

Replaced blanket `z.any()` schema boundaries in `packages/tools/src/data/transformer/types.ts` with shared unknown-first transformer schemas, while preserving runtime behavior for array and object transformer tools.

## What Changed

- introduced shared schema building blocks:
  - `transformerValueSchema`
  - `transformerArraySchema`
  - `transformerObjectSchema`
- rewired:
  - `arrayFilterSchema`
  - `arrayMapSchema`
  - `arraySortSchema`
  - `arrayGroupBySchema`
  - `objectPickSchema`
  - `objectOmitSchema`
- added focused schema coverage in `packages/tools/tests/data/transformer/transformer-types.test.ts`

## Test Strategy

- first failing test:
  - `pnpm test --run packages/tools/tests/data/transformer/transformer-types.test.ts`
  - failed because transformer schemas still exposed `ZodAny` boundaries
- focused follow-up validation:
  - `pnpm test --run packages/tools/tests/data/transformer/transformer-types.test.ts packages/tools/tests/data/transformer/transformer-helpers.test.ts`
  - `pnpm --filter @agentforge/tools typecheck`
  - `pnpm lint:explicit-any:baseline`

## Behavior Notes

- runtime behavior remains unchanged:
  - array filter/map/sort/group-by still accept primitive and object array elements
  - object pick/omit still accept object values with nested data
- this story narrows schema contracts without changing the existing shared-helper behavior from `ST-09038`

## Explicit-`any` Impact

- touched file: `packages/tools/src/data/transformer/types.ts`
- blanket schema `z.any()` seams removed from:
  - array element inputs
  - comparison value input
  - object property values
- workspace baseline gate remains green at `90/289`
- tools baseline gate remains green at `59/67`
