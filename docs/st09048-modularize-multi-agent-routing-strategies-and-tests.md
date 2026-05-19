# ST-09048: Modularize Multi-Agent Routing Strategies and Tests

## Summary

This story split the multi-agent routing implementation and its coupled tests into focused modules while preserving the public `packages/patterns/src/multi-agent/routing.ts` entrypoint and existing routing behavior.

## What Changed

### Production modularization

- Reduced `packages/patterns/src/multi-agent/routing.ts` from `373` lines to a `51` line facade.
- Extracted focused internal modules under `packages/patterns/src/multi-agent/routing-internal/`:
  - `llm-routing.ts`
  - `round-robin-routing.ts`
  - `skill-based-routing.ts`
  - `load-balanced-routing.ts`
  - `rule-based-routing.ts`
  - `worker-selection.ts`
  - `types.ts`
- Kept these public exports backward compatible:
  - `DEFAULT_SUPERVISOR_SYSTEM_PROMPT`
  - `llmBasedRouting`
  - `roundRobinRouting`
  - `skillBasedRouting`
  - `loadBalancedRouting`
  - `ruleBasedRouting`
  - `getRoutingStrategy`
  - `logger`

### Test modularization

- Removed the `538` line monolithic `packages/patterns/tests/multi-agent/routing.test.ts` file.
- Split routing coverage into focused modules:
  - `packages/patterns/tests/multi-agent/routing-worker-selection.test.ts`
  - `packages/patterns/tests/multi-agent/routing-rule-based.test.ts`
  - `packages/patterns/tests/multi-agent/routing-llm.test.ts`
  - `packages/patterns/tests/multi-agent/routing-registry.test.ts`
  - shared fixture: `packages/patterns/tests/multi-agent/routing.fixtures.ts`

## Test Strategy

The first behavior-preserving step was the test split, not the production split.

1. Modularized the routing tests against the original `routing.ts` implementation.
2. Ran the focused routing plus `nodes` suite to prove behavior stayed stable before production extraction.
3. Extracted the production modules behind the stable facade.
4. Re-ran focused, package, and full-suite validation.

### First behavior-preserving gate

`pnpm test --run packages/patterns/tests/multi-agent/routing-worker-selection.test.ts packages/patterns/tests/multi-agent/routing-rule-based.test.ts packages/patterns/tests/multi-agent/routing-llm.test.ts packages/patterns/tests/multi-agent/routing-registry.test.ts packages/patterns/tests/multi-agent/nodes.test.ts`

Result after test modularization and before production extraction:

- `5` files passed
- `56` tests passed

## Validation

Focused checks:

- `pnpm --filter @agentforge/patterns typecheck`
- `pnpm test --run packages/patterns/tests/multi-agent/routing-worker-selection.test.ts packages/patterns/tests/multi-agent/routing-rule-based.test.ts packages/patterns/tests/multi-agent/routing-llm.test.ts packages/patterns/tests/multi-agent/routing-registry.test.ts packages/patterns/tests/multi-agent/nodes.test.ts`
  - `5` files passed
  - `56` tests passed
- `pnpm lint:explicit-any:baseline`
  - workspace: `90/289`
  - patterns: `2/28`
- `git diff --check`

Full checks:

- `pnpm test --run`
  - `174` files passed
  - `16` files skipped
  - `2304` tests passed
  - `286` tests skipped
- `pnpm lint`
  - passed with the existing warning baseline only

## File Size and Responsibility Impact

Production:

- facade: `routing.ts` `373` -> `51`
- extracted internals total: `381`
- result: the public surface is now easy to review while strategy responsibilities are isolated

Tests:

- monolith: `routing.test.ts` `538` -> removed
- split suite + fixture total: `552`
- result: slightly larger total test footprint, but responsibility is partitioned by strategy instead of mixed in one file

## Explicit-`any` Impact

- No baseline regression
- workspace remains `90/289`
- patterns remains `2/28`

This story was about modularity and reviewability, not further `any` reduction.
