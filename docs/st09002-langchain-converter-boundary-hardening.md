# ST-09002: Tighten LangChain Converter Runtime Boundary

## Summary

Refactored the LangChain converter boundary to replace explicit `any` contracts with generic or runtime-erased types, while splitting output serialization and JSON-schema extraction into focused helpers.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/langchain/converter.ts` | Replaced exported `any`-based converter signatures with generic tool inputs and a runtime-erased multi-tool boundary |
| `packages/core/src/langchain/converter.ts` | Extracted `serializeToolResult()` to isolate LangChain stringification from tool invocation |
| `packages/core/src/langchain/converter.ts` | Extracted schema guards and `extractToolSchema()` so JSON-schema unwrapping is separated from public API functions |
| `packages/core/tests/langchain/converter.test.ts` | Added focused serialization edge-case coverage for array and `null` outputs while preserving existing object/string/primitive/schema assertions |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/langchain/converter.ts`: `15 -> 0` (`-15`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `372 -> 357` (`-15`)
- `core` package: `176 -> 161` (`-15`)

(After snapshot captured with `pnpm lint:explicit-any:baseline` on 2026-03-13.)

## Compatibility Notes

- Public API behavior remains unchanged for `toLangChainTool`, `toLangChainTools`, `getToolJsonSchema`, and `getToolDescription`.
- LangChain-facing tool outputs still resolve to strings, with arrays and objects serialized as formatted JSON and primitives stringified directly.

## Validation

- `pnpm exec eslint packages/core/src/langchain/converter.ts packages/core/tests/langchain/converter.test.ts`
- `pnpm test --run packages/core/tests/langchain/converter.test.ts` -> `14 passed`
- `pnpm lint:explicit-any:baseline`

## Test Impact

Expanded focused automated coverage for converter serialization boundaries and retained the existing schema/metadata assertions.
