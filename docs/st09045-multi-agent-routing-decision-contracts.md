# ST-09045: Multi-Agent Routing Decision Contracts

## Summary

`ST-09045` tightens the LLM routing boundary in `@agentforge/patterns` so multi-agent supervisor routing consumes schema-aligned decisions instead of relying on a broad cast.

## What Changed

- Replaced the `config.model.invoke(messages) as any` seam in [`packages/patterns/src/multi-agent/routing.ts`](../packages/patterns/src/multi-agent/routing.ts) with a small routing-decision helper that:
  - prefers `withStructuredOutput(RoutingDecisionSchema)` when the model exposes it
  - falls back to parsing direct model output through `RoutingDecisionSchema`
  - normalizes the final decision back onto the existing `llm-based` runtime shape
  - warns when structured output is unavailable and the direct-output fallback path is used
  - preserves structured-output parse/schema failures as hard errors instead of silently retrying unstructured routing
- Removed the direct structured-output rewiring from [`packages/patterns/src/multi-agent/agent.ts`](../packages/patterns/src/multi-agent/agent.ts) so the routing module owns the decision boundary instead of the system factory.
- Added focused regression coverage in [`packages/patterns/tests/multi-agent/routing.test.ts`](../packages/patterns/tests/multi-agent/routing.test.ts) for:
  - structured-output routing with parallel targets
  - direct-output fallback parsing when `withStructuredOutput` is unavailable
  - array-based content with mixed non-text blocks
  - unsupported structured-output models that require direct-output fallback
  - unsupported `withStructuredOutput(...)` setup that throws before invocation
  - invalid structured-output decisions that must surface without retry

## Test Strategy

This story used a practical test-first runtime seam rather than a source-included typecheck fixture.

- The first failing test proved that `llmBasedRouting` ignored an available `withStructuredOutput(...)` path and therefore never consumed the structured routing decision surface.
- After implementation, focused runtime and package type validation were enough to verify both the runtime behavior and the type-boundary tightening without expanding the public API.

## Validation

- Failing test before implementation:
  - `pnpm test --run packages/patterns/tests/multi-agent/routing.test.ts`
  - failure mode: `withStructuredOutput` was never called by `llmBasedRouting`
- Focused validation after implementation:
  - `pnpm test --run packages/patterns/tests/multi-agent/routing.test.ts`
  - `pnpm test --run packages/patterns/tests/multi-agent/routing.test.ts packages/patterns/tests/multi-agent/nodes.test.ts`
  - `pnpm --filter @agentforge/patterns typecheck`
  - `pnpm lint:explicit-any:baseline`
- Full validation before review:
  - `pnpm test --run` -> `171` files passed, `16` skipped; `2297` tests passed, `286` skipped
  - `pnpm lint` passed with warnings only and `0` errors
  - `git diff --check` passed

## Explicit-`any` Delta

- `packages/patterns/src/multi-agent/routing.ts`: `1 -> 0`
- `patterns` baseline: `3/28 -> 2/28`
- workspace baseline: `91/289 -> 90/289`

## Outcome

The supervisor routing boundary now consumes structured routing decisions through schema-aligned parsing instead of a broad cast, while preserving:

- LLM-based routing
- round-robin routing
- skill-based routing
- load-balanced routing
- rule-based routing
- parallel target routing behavior
