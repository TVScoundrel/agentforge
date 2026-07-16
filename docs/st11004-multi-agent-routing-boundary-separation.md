# ST-11004: Multi-Agent Routing Boundary Separation

## Summary

`ST-11004` hardens the multi-agent supervisor so raw worker output no longer becomes the next supervisor routing task by default. The framework now preserves a trusted `supervisorTask` intent in state and reuses worker results only through an explicit untrusted-context transformation.

## What Changed

- Added `supervisorTask` to the multi-agent state model as the trusted orchestration intent channel.
- Replaced the prior "latest message wins" supervisor-task lookup with a trusted-task resolver that falls back to the original user input when no explicit `supervisorTask` is present.
- Changed LLM-based routing prompts to keep `Current task` anchored to the trusted supervisor task while adding completed worker results in a labeled "untrusted context" section.
- Changed follow-up task assignment generation to include the trusted task plus labeled worker-result context instead of handing the next worker raw prior output verbatim.
- Documented the compatibility impact in the multi-agent pattern docs and example overview so downstream adopters know raw worker text is no longer promoted automatically into supervisor routing.

## Validation

Red test captured before the fix:

- `pnpm --filter @agentforge/patterns test --run packages/patterns/tests/multi-agent/routing-llm.test.ts packages/patterns/tests/multi-agent/nodes/supervisor-routing.ts`
  - failed because the LLM routing prompt used injected worker-result text as `Current task`

Green validation after the fix:

- `pnpm --filter @agentforge/patterns test --run packages/patterns/tests/multi-agent/routing-llm.test.ts packages/patterns/tests/multi-agent/nodes/supervisor-routing.ts packages/patterns/tests/multi-agent/state.test.ts`
- `pnpm --filter @agentforge/patterns test --run packages/patterns/tests/multi-agent/nodes.test.ts packages/patterns/tests/multi-agent/agent-system.test.ts`

## Compatibility Impact

Applications that implicitly relied on a worker's raw `task_result` text becoming the next supervisor `Current task` will observe changed routing prompts and follow-up assignment payloads. To preserve that behavior intentionally, downstream code should perform its own transformation from worker output into a new trusted supervisor task instead of depending on the framework default.

## CI Impact

No CI workflow changes are required. The story fits within the existing patterns-package test coverage and repo-wide validation commands.
