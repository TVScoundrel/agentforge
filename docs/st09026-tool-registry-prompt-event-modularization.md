# ST-09026: Modularize Tool Registry Prompt Rendering and Event Paths

## Summary

Extracted the tool registry's prompt-generation, LangChain conversion, and event-emission logic into focused internal helpers so `ToolRegistry` no longer mixes storage operations with formatting and observer orchestration.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/tools/registry.ts` | Delegated event registration/emission, LangChain conversion, and prompt generation to dedicated helpers while preserving the public `ToolRegistry` API |
| `packages/core/src/tools/registry-events.ts` | Added focused event helper functions for handler registration, deregistration, and safe event emission with error logging |
| `packages/core/src/tools/registry-prompt.ts` | Added focused helper functions for LangChain conversion plus grouped/full/minimal prompt generation and relation formatting |
| `packages/core/tests/tools/registry-events.test.ts` | Added direct runtime coverage for event helper registration/removal and safe emission when handlers throw |
| `packages/core/tests/tools/registry-prompt.test.ts` | Added direct runtime coverage for grouped prompt output and minimal-mode supplementary content rendering |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/tools/registry.ts`: `8 -> 8` (`0`)
- `packages/core/src/tools/registry-events.ts`: `0 -> 0` (`0`)
- `packages/core/src/tools/registry-prompt.ts`: `0 -> 0` (`0`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `182 -> 182` (`0`)
- `core` package: `63 -> 63` (`0`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-04-09.)

## Compatibility Notes

- Public `ToolRegistry` behavior remains unchanged for event registration/removal, safe event emission, `toLangChainTools()`, and `generatePrompt()`.
- Prompt generation still supports grouped category output, minimal supplementary mode, category filtering, relations, examples, notes, and limitations.
- The extraction is internal only; no new helper APIs were added to the public `@agentforge/core` export surface.

## Validation

- `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
- `pnpm exec eslint packages/core/src/tools/registry.ts packages/core/src/tools/registry-collection.ts packages/core/src/tools/registry-events.ts packages/core/src/tools/registry-prompt.ts packages/core/tests/tools/registry.test.ts packages/core/tests/tools/registry-collection.test.ts packages/core/tests/tools/registry-events.test.ts packages/core/tests/tools/registry-prompt.test.ts`
- `pnpm test --run packages/core/tests/tools/registry.test.ts packages/core/tests/tools/registry-collection.test.ts packages/core/tests/tools/registry-events.test.ts packages/core/tests/tools/registry-prompt.test.ts` -> `4 passed` files, `50 passed` tests
- `pnpm lint:explicit-any:baseline --silent` -> `182/289` warnings, `core 63/119`
- `pnpm test --run` -> `159 passed | 16 skipped` files; `2185 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only

## Test Impact

Added direct helper coverage for the extracted event and prompt modules while keeping the existing `ToolRegistry` integration suite in place to catch public-surface regressions.
