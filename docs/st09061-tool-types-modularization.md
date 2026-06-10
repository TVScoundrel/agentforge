# ST-09061: Tool Types Modularization

## Summary

`packages/core/src/tools/types.ts` was reduced from `387` lines to a small public facade that stays well below the `300` line planning cutoff while preserving the stable `./types.js` import surface.

The extracted runtime modules are each focused on one responsibility and also remain below the planning cutoff:

- `packages/core/src/tools/types.ts` (`13` lines)
- `packages/core/src/tools/types-category.ts` (`14` lines)
- `packages/core/src/tools/types-example.ts` (`10` lines)
- `packages/core/src/tools/types-relations.ts` (`11` lines)
- `packages/core/src/tools/types-metadata.ts` (`23` lines)
- `packages/core/src/tools/types-tool.ts` (`13` lines)

The public facade now only re-exports those focused contracts, so downstream imports continue to target the same file even though the implementation responsibility is split internally.

## Test Modularization

The monolithic `packages/core/tests/tools/types.test.ts` was replaced with a small public entrypoint that imports focused suites:

- `packages/core/tests/tools/types/tool-category.ts`
- `packages/core/tests/tools/types/tool-name-and-example.ts`
- `packages/core/tests/tools/types/tool-metadata.ts`
- `packages/core/tests/tools/types/tool-interface.ts`
- `packages/core/tests/tools/types/tool-relations.ts`

This keeps the public test command stable while separating category, example/name, metadata, interface, and relation coverage into reviewable units.

The first split used `*.test.ts` filenames for those focused suites, but Vitest discovered them both directly and through the wrapper import. The final layout uses plain `.ts` suite modules behind `types.test.ts` so the public entrypoint stays stable without duplicate execution.

## Test Strategy And Compatibility

This story is behavior-preserving modularization rather than a behavior change, so a literal failing test for "the file got smaller" would only assert repository structure. The practical test-first substitute was:

1. split the public `packages/core/tests/tools/types.test.ts` surface into focused suites first
2. run the unchanged public entrypoint
3. modularize `packages/core/src/tools/types.ts` behind the same `./types.js` facade
4. re-run the same public entrypoint plus broader validation

Compatibility notes:

- `ToolCategory`, `ToolExample`, `ToolRelations`, `ToolMetadata`, and `Tool` remain publicly reachable from `packages/core/src/tools/types.ts`
- `packages/core/src/tools/index.ts` continues re-exporting from `./types.js`
- no CI or workflow change was required because the story only reorganizes internal modules behind existing public entrypoints

## Validation

- `pnpm test --run packages/core/tests/tools/types.test.ts`
  - before production split: `1` file passed, `24` tests passed
  - after production split: `1` file passed, `24` tests passed
- `pnpm --filter @agentforge/core typecheck`
- `pnpm --filter @agentforge/core exec eslint src/tools/types.ts src/tools/types-category.ts src/tools/types-example.ts src/tools/types-relations.ts src/tools/types-metadata.ts src/tools/types-tool.ts tests/tools/types.test.ts tests/tools/types/tool-category.ts tests/tools/types/tool-name-and-example.ts tests/tools/types/tool-metadata.ts tests/tools/types/tool-interface.ts tests/tools/types/tool-relations.ts`
- `pnpm lint:explicit-any:baseline`
  - workspace: `84/289`
  - core: `23/119`
  - no baseline regression; follow-up baseline file update not included in this behavior-preserving refactor
- `pnpm test --run`
  - `210` files passed, `18` skipped
  - `2311` tests passed, `286` skipped
- `pnpm lint`
  - exit `0`; warnings only, no lint errors introduced by this story
- `git diff --check`

## Explicit-`any` Notes

This story did not increase explicit-`any` usage. The touched tool-type modules remain consistent with the existing baseline, and the explicit-`any` baseline update notice from `pnpm lint:explicit-any:baseline` is deferred to a separate follow-up because the baseline file itself is outside this story's scope.
