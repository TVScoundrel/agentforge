# ST-09075: Harden ReAct Agent Detection Beyond Constructor Names

## Summary

`isReActAgent(...)` previously treated `CompiledGraph` and `CompiledStateGraph` constructor names as the deciding runtime signal once `invoke` and `stream` were present. That works in today's LangGraph build, but it is brittle if those class names are minified or otherwise rewritten. This story hardens detection by preferring stable compiled-graph runtime shape evidence and keeping constructor names only as a compatibility fallback.

## Implementation

- Added layered detection in `packages/patterns/src/multi-agent/utils-react-detection.ts`.
- The new primary path accepts objects that expose the compiled LangGraph runtime shape we actually depend on: `invoke`, `stream`, `getGraph`, `getGraphAsync`, and a `builder` with graph-construction methods.
- Preserved the old `CompiledGraph` / `CompiledStateGraph` constructor-name check as a fallback so the existing characterization fixture and any lightweight compatible wrappers still pass unchanged.

## Test Strategy

This story used a focused red-first regression test because the public contract is small and directly testable. The new test creates a real compiled ReAct agent, masks its constructor name, and proves `isReActAgent(...)` should still return `true` when the compiled runtime shape remains intact. That assertion failed before the implementation change and passed afterward.

## Validation

- Red-first run: `./node_modules/.bin/vitest run --config .tmp/vitest.st09075.config.mjs` -> failed with `expected false to be true` for the masked-constructor compiled agent fixture
- Focused utility suites: `./node_modules/.bin/vitest run --config .tmp/vitest.st09075.config.mjs` -> `2` passed files, `9` passed tests
- Package typecheck: `pnpm --filter @agentforge/patterns typecheck` -> passed
- Explicit-`any` baseline: `pnpm lint:explicit-any:baseline` -> passed at `workspace 80/289`, `patterns 2/28`

## Compatibility Notes

- Public imports and the `isReActAgent(...)` signature are unchanged.
- Existing constructor-name-based positive fixtures still pass, but real compiled LangGraph instances no longer depend on those names staying stable.
- No CI workflow change was required for this story; the existing validation surface was sufficient once the focused `.suite.ts` runner was invoked explicitly.
