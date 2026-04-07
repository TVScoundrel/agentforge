# ST-09023: Tighten Core Tool Builder Fluent Typing

## Summary

Refined the core tool builder so schema and implementation chaining preserve stronger generic contracts without relying on `(this as any)` seams, while keeping the fluent API behavior unchanged for both normal and safe tool construction flows.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/tools/builder.ts` | Replaced type-changing builder mutations with typed builder copies, preserving schema-first, invoke-first, and safe-builder chaining without `(this as any)` seams |
| `packages/core/src/tools/builder.typecheck.ts` | Added source-included type regressions covering schema-first, invoke-first, and `implementSafe(...)` chaining |
| `packages/core/tests/tools/builder.test.ts` | Added focused runtime coverage for schema-first chaining, invoke-first execution behavior, post-`implementSafe(...)` fluent chaining, and metadata isolation across branched builders |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/tools/builder.ts`: `6 -> 0` (`-6`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `201 -> 195` (`-6`)
- `core` package: `82 -> 76` (`-6`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-04-07.)

## Compatibility Notes

- The fluent builder API remains chainable in both the common schema-first flow and the older invoke-first flow.
- Built tools still validate metadata and schema descriptions through `createTool(...)`.
- `implementSafe(...)` still returns the same `{ success, data?, error? }` result shape while preserving downstream fluent builder calls.

## Validation

- `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
- `pnpm exec eslint packages/core/src/tools/builder.ts packages/core/src/tools/builder.typecheck.ts packages/core/tests/tools/builder.test.ts`
- `pnpm test --run packages/core/tests/tools/builder.test.ts` -> `1 passed` file, `31 passed` tests
- `pnpm lint:explicit-any:baseline --silent` -> `195/289` warnings, `core 76/119`
- `pnpm test --run` -> `156 passed | 16 skipped` files; `2173 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only

## Test Impact

Added one source-included type regression file plus focused runtime builder cases for schema/invoke chaining, safe-builder execution, and metadata isolation so branched fluent builders stay independent without changing public builder ergonomics.
