# ST-09024: Tighten LangGraph Interrupt Type Contracts

## Summary

Tightened the shared LangGraph interrupt contracts so human-request and approval flows keep their explicit domain shapes while custom interrupt payloads, metadata, and resume values move to safer JSON-first boundaries.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/langgraph/interrupts/types.ts` | Replaced broad `any` interrupt boundaries with generic interrupt contracts, explicit approval payload types, JSON-safe custom interrupt/resume payload aliases, and JSON-object metadata/context contracts |
| `packages/core/src/langgraph/interrupts/utils.ts` | Updated approval/custom interrupt helpers to use the tighter contracts while preserving current helper behavior and custom-interrupt payload inference |
| `packages/core/src/langgraph/interrupts/contracts.typecheck.ts` | Added source-included type regressions for approval interrupts, generic custom interrupts, and resume command/options payload typing |
| `packages/core/tests/langgraph/interrupts/utils.test.ts` | Added focused runtime coverage for JSON-safe primitive and array custom interrupt payloads and localized the `HumanRequest` test type import to the interrupt module |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/langgraph/interrupts/types.ts`: `10 -> 0` (`-10`)
- `packages/core/src/langgraph/interrupts/utils.ts`: `3 -> 0` (`-3`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `195 -> 182` (`-13`)
- `core` package: `76 -> 63` (`-13`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-04-07.)

## Compatibility Notes

- Human-request interrupts still carry the same `HumanRequest` shape, including optional context, timeout handling, suggestions, and response metadata.
- Approval-required interrupts keep the same runtime payload keys: `action`, `description`, and optional `context`.
- Custom interrupts still accept object, array, and primitive payloads, but the public contract is now JSON-safe instead of `any`.
- Resume commands and resume options now expose JSON-safe payload/value contracts while keeping the existing `resume`, `value`, and optional `metadata` fields unchanged.

## Validation

- `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
- `pnpm exec eslint packages/core/src/langgraph/interrupts/types.ts packages/core/src/langgraph/interrupts/utils.ts packages/core/src/langgraph/interrupts/contracts.typecheck.ts packages/core/tests/langgraph/interrupts/utils.test.ts`
- `pnpm test --run packages/core/tests/langgraph/interrupts/utils.test.ts packages/core/tests/streaming/human-in-loop.test.ts` -> `2 passed` files, `20 passed` tests
- `pnpm lint:explicit-any:baseline --silent` -> `182/289` warnings, `core 63/119`
- `pnpm test --run` -> `156 passed | 16 skipped` files; `2178 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only

## Test Impact

Added one source-included type regression file and expanded focused interrupt utility coverage so custom interrupt payload inference, approval payload typing, and resume command/value contracts stay precise without changing the existing human-in-the-loop runtime helpers.
