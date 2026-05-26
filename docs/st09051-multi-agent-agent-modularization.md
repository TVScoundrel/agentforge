# ST-09051: Multi-Agent Agent Modularization

## Summary

`packages/patterns/src/multi-agent/agent.ts` was reduced from `535` lines to `155` lines by turning it into a small public facade over focused internal modules:

- `packages/patterns/src/multi-agent/agent-graph.ts`
- `packages/patterns/src/multi-agent/agent-runtime.ts`
- `packages/patterns/src/multi-agent/agent-workers.ts`
- `packages/patterns/src/multi-agent/agent-builder.ts`
- `packages/patterns/src/multi-agent/agent-types.ts`

The public API still exposes `createMultiAgentSystem`, `registerWorkers`, `createWorkersRegistry`, and `MultiAgentSystemBuilder` from the same entry point, while graph assembly, worker capability normalization, runtime worker injection, and builder-time worker conversion now live behind explicit seams.

## Test Modularization

The monolithic `packages/patterns/tests/multi-agent/agent.test.ts` was replaced with focused public-behavior suites:

- `packages/patterns/tests/multi-agent/agent-system.test.ts`
- `packages/patterns/tests/multi-agent/agent-register-workers.test.ts`
- `packages/patterns/tests/multi-agent/agent-tools.test.ts`
- `packages/patterns/tests/multi-agent/agent-builder.test.ts`

This keeps system creation, deprecated compiled-system registration, tool-name mapping, stream wrapping, and builder registration independently reviewable instead of coupling every orchestration assertion to one file.

## Compatibility Notes

- `packages/patterns/src/multi-agent/agent.ts` remains the stable public facade and continues to re-export `MultiAgentSystemBuilder`.
- Compiled-system `invoke(...)` and `stream(...)` still merge worker capability state into the initial input before delegating to the compiled LangGraph runtime.
- Deprecated `registerWorkers(system, workers)` still updates `_workerRegistry` and wraps runtime methods only once.
- Builder-time worker registration still normalizes AgentForge and LangChain-style tool names to the same worker capability shape used by the compiled-system registration path.

## Test Strategy

A structurally failing test for "this file is still too large" would only assert repository layout, not orchestration behavior. For this story, the meaningful contract is preserving public multi-agent creation, worker registration, worker-tool normalization, and wrapped runtime semantics while splitting the oversized runtime and test files. The practical test-first substitute was to split the existing public-behavior coverage into focused suites first, then refactor the runtime behind those seams and rerun the targeted orchestration tests.

## Validation

- `pnpm test --run packages/patterns/tests/multi-agent/agent-system.test.ts packages/patterns/tests/multi-agent/agent-register-workers.test.ts packages/patterns/tests/multi-agent/agent-tools.test.ts packages/patterns/tests/multi-agent/agent-builder.test.ts`
  - `4` files passed, `17` tests passed
- `pnpm --filter @agentforge/patterns typecheck`
- `pnpm --filter @agentforge/patterns exec eslint src/multi-agent/agent.ts src/multi-agent/agent-types.ts src/multi-agent/agent-workers.ts src/multi-agent/agent-runtime.ts src/multi-agent/agent-graph.ts src/multi-agent/agent-builder.ts tests/multi-agent/agent-system.test.ts tests/multi-agent/agent-register-workers.test.ts tests/multi-agent/agent-tools.test.ts tests/multi-agent/agent-builder.test.ts`
- `pnpm lint:explicit-any:baseline`
  - workspace: `84/289`
  - patterns: `2/28`
- `pnpm test --run`
  - `190` files passed, `16` skipped
  - `2317` tests passed, `286` skipped
- `pnpm lint`
  - passed with existing workspace warnings only
- `git diff --check`

## Explicit-`any` Notes

- This story did not increase the explicit-`any` baseline.
- The touched multi-agent modules stayed at `patterns: 2/28`.
