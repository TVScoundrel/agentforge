# ST-09088: Harden Multi-Agent Runnable Config and GraphInterrupt Detection

## Summary

The multi-agent patterns layer still had two brittle runtime-boundary shortcuts after the earlier modularization work:

- `toRunnableConfig(...)` accepted any record and cast it straight to `RunnableConfig`, which could leak arbitrary caller keys into wrapped ReAct agent invocation.
- `isGraphInterrupt(...)` depended on `constructor.name === 'GraphInterrupt'`, which breaks if a compatible interrupt class arrives through a different package boundary or has an unstable constructor name.

This story hardens both seams without changing the public multi-agent or shared error-handling APIs.

## Implementation

- Replaced the bare `RunnableConfig` cast in [`packages/patterns/src/multi-agent/utils-shared.ts`](../packages/patterns/src/multi-agent/utils-shared.ts) with LangChain's own `pickRunnableConfigKeys(...)` helper.
- Added undefined-value cleanup so malformed worker config records collapse to `undefined` instead of forwarding an inert object full of unsupported keys.
- Preserved supported runtime forwarding for real runnable options such as `configurable.thread_id`, `tags`, `metadata`, and `recursionLimit`.
- Hardened [`packages/patterns/src/shared/error-handling.ts`](../packages/patterns/src/shared/error-handling.ts) so interrupt detection accepts either `error.name === 'GraphInterrupt'` or the existing constructor-name compatibility path.
- Added focused regression coverage in:
  - [`packages/patterns/tests/multi-agent/utils/wrap-react-agent.suite.ts`](../packages/patterns/tests/multi-agent/utils/wrap-react-agent.suite.ts)
  - [`packages/patterns/tests/shared/error-handling.test.ts`](../packages/patterns/tests/shared/error-handling.test.ts)

## Test Strategy

This story used red-first focused coverage because both hardening seams are small public runtime boundaries:

- Added a `withErrorHandling(...)` regression that throws a `GraphInterrupt`-named error whose constructor name is unstable.
- Added wrapped ReAct coverage that proves supported runnable config keys survive worker-thread namespacing while arbitrary caller keys are dropped.
- Added a malformed-config case to prove arbitrary worker config records now collapse away instead of reaching `agent.invoke(...)`.

## Validation

- Red-first run: `pnpm --filter @agentforge/patterns test --run packages/patterns/tests/multi-agent/utils.test.ts packages/patterns/tests/shared/error-handling.test.ts` -> failed in `rethrows GraphInterrupt-like errors when the constructor name is unstable` because the wrapper returned `{ status: 'failed', error: 'pause for human input' }` instead of rethrowing
- Focused patterns tests: `pnpm --filter @agentforge/patterns test --run packages/patterns/tests/multi-agent/utils.test.ts packages/patterns/tests/shared/error-handling.test.ts` -> `2` passed files, `15` passed tests
- Package typecheck: `pnpm --filter @agentforge/patterns typecheck` -> passed
- Explicit-`any` baseline: `pnpm lint:explicit-any:baseline` -> passed at `workspace 80/289`, `patterns 2/28`
- Workspace lint: `pnpm lint` -> passed with warnings only (`0` errors); touched `patterns` package remained warning-only
- Full suite: `pnpm test --run` -> `224` passed, `9` skipped files; `2516` passed, `110` skipped tests

## Compatibility Notes

- Public imports and signatures for `wrapReActAgent(...)`, `toRunnableConfig(...)`, `isGraphInterrupt(...)`, and `withErrorHandling(...)` are unchanged.
- The old constructor-name compatibility fixture still passes, but interrupt detection no longer depends solely on that fragile signal.
- No CI workflow change is required for this story because the existing patterns-scoped and workspace validation commands already cover the touched surface.
