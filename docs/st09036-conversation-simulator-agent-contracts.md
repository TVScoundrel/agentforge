# ST-09036: Conversation Simulator Agent Contracts

## Summary

Tighten `ConversationSimulator` around the same unknown-first agent and message extraction seam used by the agent test runner, so multi-turn testing no longer depends on a broad `agent: any` contract.

## Test Strategy

- Pre-implementation type regression: `pnpm --filter @agentforge/testing typecheck` failed because `createConversationSimulator<ExampleState>(...)` was not generic yet.
- Focused runtime coverage targets static simulation, dynamic simulation, explicit max-turn stopping, configured stop conditions, and malformed invoke results.

## Implementation Notes

- `ConversationSimulator` now accepts `AgentTestAgent<ConversationSimulatorInput, TState>` instead of a broad `any`.
- Message extraction reuses the agent test runner's unknown-first `extractMessages(...)` helper.
- A missing or malformed invoke-result `messages` payload now surfaces as a captured simulator error through the existing `completed/error/stopReason` result path.

## Validation

- `pnpm --filter @agentforge/testing typecheck`:
  - Before implementation: failed on `createConversationSimulator<ExampleState>(...)` because the factory accepted zero type arguments.
  - After implementation: passed.
- `pnpm test --run packages/testing/tests/runners/conversation-simulator.test.ts` passed (`1` file, `5` tests).
- Full-suite and lint validation pending.
- Explicit-`any` warning delta pending final lint/baseline verification.
