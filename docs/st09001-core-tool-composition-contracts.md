# ST-09001: Harden Core Tool Composition Contracts

## Summary

Refactored core tool composition utilities to remove explicit `any` from public contracts, tighten runtime-erased boundaries with `unknown`, and keep composition responsibilities clearer and easier to maintain.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/tools/composition.ts` | Replaced broad `any` signatures with generic `ComposedTool<TInput, TOutput>` and typed config contracts (`ConditionalConfig`, `ComposeToolConfig`) |
| `packages/core/src/tools/composition.ts` | Added focused helper functions (`isConditionalStep`, `calculateRetryDelay`, `toError`) to separate workflow orchestration from utility concerns |
| `packages/core/src/tools/composition.ts` | Added invalid retry-option guard (`maxAttempts` must be an integer `>= 1`) to fail fast for misconfiguration |
| `packages/core/src/tools/composition.ts` | Updated `timeout()` to clear scheduled timeout handles after `Promise.race` settles, preventing stale timers when tools complete successfully |
| `packages/core/tests/tools/composition.test.ts` | Added 8 focused tests for `sequential`, `parallel`, `conditional`, `composeTool`, `retry`, `timeout`, and `cache` behavior |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/tools/composition.ts`: `13 -> 0` (`-13`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `385 -> 372` (`-13`)
- `core` package: `189 -> 176` (`-13`)

(After snapshot captured with `pnpm lint:explicit-any:baseline` on 2026-03-12.)

## Compatibility Notes

- Public helper behavior is preserved: existing composition utilities still execute sequential, parallel, conditional, retry, timeout, and cache flows the same way.
- The retry path now throws a clear configuration error when `maxAttempts < 1` instead of entering an invalid loop path.

## Validation

- `pnpm exec eslint packages/core/src/tools/composition.ts packages/core/tests/tools/composition.test.ts`
- `pnpm test --run packages/core/tests/tools/composition.test.ts` (updated to 9 focused tests after timeout cleanup regression guard)
- `pnpm lint:explicit-any:baseline`
- `pnpm test --run` -> `147 passed | 16 skipped` files; `2084 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only (`0` errors)

## Test Impact

Added focused automated tests for behavior-sensitive composition flows. No skipped or manual-only validations were introduced.
