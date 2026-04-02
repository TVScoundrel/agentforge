# ST-09020: Tighten Prompt Loader Variable Contracts

## Summary

Tightened the core prompt loader around unknown-first variable contracts so trusted and untrusted template inputs no longer rely on broad `any` maps, while preserving the existing sanitization, substitution, conditional, and prompt-file loading behavior.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/prompt-loader/index.ts` | Replaced prompt variable-map `any` seams with `PromptVariableMap`/`unknown`-first helpers, normalized trusted and untrusted inputs into null-prototype maps before rendering, and kept plain-object fallback behavior for backwards compatibility |
| `packages/core/tests/prompt-loader/index.test.ts` | Added focused coverage for malformed trusted/untrusted option fallback, prototype-pollution regression handling, and `loadPrompt(...)` rendering with mixed trusted/untrusted values and plain-object fallback |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/prompt-loader/index.ts`: `10 -> 0` (`-10`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `229 -> 219` (`-10`)
- `core` package: `106 -> 96` (`-10`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-04-02.)

## Compatibility Notes

- `sanitizeValue(...)` now accepts `unknown` rather than `any`, but keeps the same runtime behavior for `null`, `undefined`, primitives, and arbitrary values stringified into templates.
- `renderTemplate(...)` still treats plain variable objects as trusted for backwards compatibility.
- Trusted variables remain unsanitized, untrusted variables remain sanitized, and conditional blocks continue to evaluate against raw values so `false` and `0` stay falsy.
- Trusted and untrusted variable maps are now normalized onto null-prototype objects before sanitization and merging, so special keys like `__proto__` are treated as data instead of mutating object prototypes.
- `loadPrompt(...)` keeps the same prompt-file lookup and error behavior while routing through the tightened variable-map normalization.

## Validation

- `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
- `pnpm exec eslint packages/core/src/prompt-loader/index.ts packages/core/tests/prompt-loader/index.test.ts`
- `pnpm test --run packages/core/tests/prompt-loader/index.test.ts` -> `1 passed` file, `23 passed` tests
- `pnpm lint:explicit-any:baseline --silent` -> `219/289` warnings, `core 96/119`
- `pnpm test --run` -> `156 passed | 16 skipped` files; `2163 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only

## Test Impact

Expanded the focused prompt-loader suite to cover trusted/untrusted rendering, malformed option fallback, prototype-pollution resistance, and `loadPrompt(...)` file rendering so the contract tightening is exercised at both the string-render and prompt-file boundaries.
