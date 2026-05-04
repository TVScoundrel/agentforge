# ST-09035: Agent Test Runner State Contracts

## Summary

ST-09035 tightens the `@agentforge/testing` agent test runner surface by replacing broad agent, input, state, and step `any` contracts with unknown-first generics while preserving the existing runner behavior.

## Contract Changes

- Added `AgentTestAgent<TInput, TState>` for agent-like objects with an `invoke(...)` method.
- Added `AgentTestRunnerStep<TState>` as the typed step-capture boundary for future step capture support.
- Made `AgentTestConfig<TState>` generic so validation hooks receive the typed final state or `undefined` after failed execution.
- Made `AgentTestResult<TState, TStep>` generic so final state and captured steps retain caller-provided types.
- Made `AgentTestRunner<TInput, TState, TStep>` and `createAgentTestRunner(...)` generic over input, final state, and step contracts.
- Exported the new runner contracts from `packages/testing/src/index.ts`.

## Behavior Preservation

The runtime runner flow is unchanged:

- `run(...)` still invokes the supplied agent with the provided input.
- Timeout failures are caught and returned as failed results instead of being thrown.
- State validation still runs only when both `validateState` and `stateValidator` are configured.
- Failed validation still returns a failed result with `State validation failed`.
- `captureSteps` still returns the runner's current empty step list.
- `runMany(...)` still runs all inputs concurrently with `Promise.all(...)`.

## Test Strategy

A source-included typecheck regression was added before production changes in `packages/testing/src/runners/agent-test-runner.typecheck.ts`. It initially failed because the safer exported contracts did not exist and `AgentTestConfig`/`AgentTestResult` were not generic.

Focused runtime coverage was added in `packages/testing/tests/runners/agent-test-runner.test.ts` for:

- Successful runner execution with final state, messages, execution metadata, and optional step capture.
- Timeout failures returned as failed results.
- Validation failures returned as failed results while preserving final state.
- Multi-input `runMany(...)` execution.

## Validation

Focused validation:

- `pnpm --filter @agentforge/testing typecheck` -> passed.
- `pnpm test --run packages/testing/tests/runners/agent-test-runner.test.ts` -> passed (`1` file, `4` tests).
- `pnpm lint:explicit-any:baseline` -> passed and improved from `144/289` to `135/289`; `testing` improved from `14/51` to `5/51`.

Final validation:

- `pnpm test --run` -> passed (`166` files, `2264` tests, `286` skipped).
- `pnpm lint` -> exit `0`; warnings only.
