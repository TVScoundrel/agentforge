# ST-09022: Harden Shared Deduplication Utility Contracts

## Summary

Tightened the shared deduplication helpers around unknown-first normalization and cache-key generation so the ReAct and Plan-Execute runtimes no longer depend on broad `any` inputs while preserving the current deduplication behavior.

## What Changed

| File | Change |
|------|--------|
| `packages/patterns/src/shared/deduplication.ts` | Replaced broad normalization and cache-key `any` seams with `unknown` plus explicit plain-object guards, and normalized sorted objects onto null-prototype maps so special keys are treated as data |
| `packages/patterns/tests/shared/deduplication.test.ts` | Added focused coverage for the `__proto__` special-key path while retaining existing cache-key normalization and metrics checks |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/patterns/src/shared/deduplication.ts`: `4 -> 0` (`-4`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `205 -> 201` (`-4`)
- `patterns` package: `19 -> 15` (`-4`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-04-03.)

## Compatibility Notes

- `generateToolCallCacheKey(...)` still produces stable keys for nested plain objects whose property order differs only by insertion order.
- Arrays are still order-sensitive and are still serialized without reordering.
- Non-plain objects are still passed through unchanged into `JSON.stringify(...)`; only plain objects and arrays are recursively normalized.
- Special keys such as `__proto__` are now handled as data during normalization instead of mutating the intermediate normalized object shape.

## Validation

- `pnpm exec eslint packages/patterns/src/shared/deduplication.ts packages/patterns/tests/shared/deduplication.test.ts`
- `pnpm exec tsc -p packages/patterns/tsconfig.json --noEmit`
- `pnpm test --run packages/patterns/tests/shared/deduplication.test.ts` -> `1 passed` file, `13 passed` tests
- `pnpm test --run packages/patterns/tests/react/deduplication.test.ts packages/patterns/tests/plan-execute/deduplication.test.ts packages/patterns/tests/shared/deduplication.test.ts` -> `3 passed` files, `25 passed` tests
- `pnpm lint:explicit-any:baseline --silent` -> `201/289` warnings, `patterns 15/28`
- `pnpm test --run` -> `156 passed | 16 skipped` files; `2170 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only

## Test Impact

Expanded the shared deduplication utility coverage with a special-key regression and re-ran the ReAct and Plan-Execute deduplication suites so the shared helper remains validated through its two primary runtime consumers.
