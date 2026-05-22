# ST-09049: Tool Registry Modularization

## Summary

`packages/core/src/tools/registry.ts` was reduced from `446` lines to a `107` line public facade by moving the remaining public query and mutation groupings into focused internal modules:

- `packages/core/src/tools/registry-query-api.ts`
- `packages/core/src/tools/registry-mutation-api.ts`
- `packages/core/src/tools/registry-types.ts`

The public imports remain stable through `packages/core/src/tools/registry.ts` and `packages/core/src/tools/index.ts`.

## Test Modularization

The monolithic `packages/core/tests/tools/registry.test.ts` (`832` lines) was replaced with focused public-API suites that mirror the runtime seams:

- `packages/core/tests/tools/registry-crud.test.ts` (`155` lines)
- `packages/core/tests/tools/registry-query-api.test.ts` (`91` lines)
- `packages/core/tests/tools/registry-bulk-api.test.ts` (`131` lines)
- `packages/core/tests/tools/registry-events-api.test.ts` (`154` lines)
- `packages/core/tests/tools/registry-langchain-api.test.ts` (`50` lines)
- `packages/core/tests/tools/registry-prompt-api.test.ts` (`230` lines)

This keeps registry CRUD, query, bulk mutation, event, LangChain, and prompt behavior independently reviewable without coupling every public behavior to one file.

## Compatibility Notes

- `ToolRegistry`, `RegistryEvent`, `EventHandler`, and `PromptOptions` remain exported from `packages/core/src/tools/registry.ts`.
- Registry registration, lookup, update, remove, clear, LangChain conversion, and prompt generation behavior stayed behind the same public methods.
- Event emission still flows through the existing registry event helpers, so handler semantics and error isolation are unchanged.

## Validation

- `pnpm test --run packages/core/tests/tools/registry-crud.test.ts packages/core/tests/tools/registry-query-api.test.ts packages/core/tests/tools/registry-bulk-api.test.ts packages/core/tests/tools/registry-events-api.test.ts packages/core/tests/tools/registry-langchain-api.test.ts packages/core/tests/tools/registry-prompt-api.test.ts`
  - `6` files passed, `43` tests passed
- `pnpm --filter @agentforge/core typecheck`
- `pnpm --filter @agentforge/core exec eslint src/tools/registry.ts src/tools/registry-types.ts src/tools/registry-query-api.ts src/tools/registry-mutation-api.ts tests/tools/registry-crud.test.ts tests/tools/registry-query-api.test.ts tests/tools/registry-bulk-api.test.ts tests/tools/registry-events-api.test.ts tests/tools/registry-langchain-api.test.ts tests/tools/registry-prompt-api.test.ts`
- `pnpm lint:explicit-any:baseline`
  - workspace: `84/289`
  - core: `23/119`

## Explicit-`any` Notes

- This story did not increase the explicit-`any` baseline.
- The touched registry split files do not introduce new explicit-`any` warnings.
