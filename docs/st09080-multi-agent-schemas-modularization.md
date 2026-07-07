# ST-09080: Modularize Multi-Agent Schemas and Schema-Centric Tests

## Summary

`packages/patterns/src/multi-agent/schemas.ts` had grown into a 291-line mixed-responsibility schema surface covering message contracts, routing, worker/task payloads, and handoff/status payloads in one file. `packages/patterns/tests/multi-agent/state.test.ts` had also become a coupled 371-line suite that mixed state-behavior assertions with schema validation coverage.

This story keeps the public `packages/patterns/src/multi-agent/schemas.ts` import path stable while splitting the schema surface into focused domain modules:

- `schemas.ts` -> 38-line public facade
- `schemas-message.ts` -> 29 lines
- `schemas-routing.ts` -> 25 lines
- `schemas-worker.ts` -> 34 lines
- `schemas-handoff.ts` -> 23 lines

On the test side, the schema assertions moved into a dedicated `packages/patterns/tests/multi-agent/schemas.test.ts` suite (266 lines) and the state suite was reduced to state-specific behavior only (`packages/patterns/tests/multi-agent/state.test.ts` now 97 lines).

## Compatibility Notes

- Public schema and type exports remain available from `packages/patterns/src/multi-agent/schemas.ts`.
- No schema field names, defaults, refinements, or validation semantics were changed.
- The story also restored the documented package-scoped validation path by adding `packages/patterns/vitest.config.ts` and wiring the package test scripts to the workspace-root Vitest runner, so `pnpm --filter @agentforge/patterns test --run` now resolves the intended patterns suite correctly.

## Test Strategy

- This was a behavior-preserving modularization, so a red test for new runtime behavior was not practical.
- Instead, the existing schema assertions were first split into a dedicated characterization suite, and that focused coverage was used as the compatibility harness for the production extraction.

## Validation

- `pnpm test --run packages/patterns/tests/multi-agent/state.test.ts packages/patterns/tests/multi-agent/schemas.test.ts`
  - Passed: 2 files, 23 tests
- `pnpm --filter @agentforge/patterns test --run`
  - Passed: 34 files, 293 tests
- `pnpm --filter @agentforge/patterns typecheck`
  - Passed
- `pnpm lint:explicit-any:baseline`
  - Passed: workspace `80/289`, patterns `2/28`
- `pnpm test --run`
  - Passed: 224 files, 2513 tests; 9 files, 110 tests skipped
- `pnpm lint`
  - Passed with pre-existing workspace warnings only

## CI Impact

- No CI workflow change was required.
- The only validation-path change was local package script/config wiring for `@agentforge/patterns`, aligning it with the already-restored package-local approach used by `@agentforge/tools` and `@agentforge/cli`.
