# ST-09059: ReAct Schema Payload Contracts

## Summary

`ST-09059` tightens the ReAct runtime schemas around message metadata, thought metadata, tool-call arguments, and tool-result payloads without changing ReAct runtime behavior. Message and thought metadata now require JSON-safe structures, while tool-call arguments and tool results remain unknown-first so tool payloads stay flexible without relying on broad `z.any()` seams.

## Test Strategy

This story had a practical test-first seam, so the implementation started with focused schema tests before production changes:

- add runtime schema assertions in `packages/patterns/tests/react/state.test.ts` for JSON-safe metadata acceptance/rejection boundaries
- add compile-time assertions in `packages/patterns/tests/react/contracts.typecheck.ts` so inferred metadata, arguments, and result types no longer flow through broad `any`

No CI change was required because the existing focused React state test, `@agentforge/patterns` typecheck, workspace test suite, lint, and explicit-`any` baseline gate already cover the touched surfaces.

## Contract Changes

- `MessageSchema.metadata` now uses a JSON-safe object contract instead of `z.record(z.any())`
- `ThoughtSchema.metadata` now uses a JSON-safe object contract instead of `z.record(z.any())`
- `ToolCallSchema.arguments` now uses `z.record(z.unknown())` instead of `z.record(z.any())`
- `ToolResultSchema.result` now uses `z.unknown()` instead of `z.any()`

## Behavior Preserved

- ReAct reasoning, action, observation, and prompt behavior remain unchanged
- tool-call arguments remain unknown-first and continue to accept non-JSON values such as `bigint` when runtime behavior depends on that flexibility
- tool-result payloads remain unknown-first and continue to support non-JSON result values for downstream formatting/serialization paths
- message/tool scratchpad behavior and observation stringification remain unchanged

## Explicit-`any` Baseline

- `pnpm lint:explicit-any:baseline` remained stable at `84/289` workspace warnings
- `@agentforge/patterns` remained stable at `2/28`

## Validation

- Focused schema test:
  - `pnpm test --run packages/patterns/tests/react/state.test.ts`
  - initial failing result: `should reject non-JSON-safe metadata values`
  - final result: `1` file passed, `15` tests passed
- Package checks:
  - `pnpm --filter @agentforge/patterns typecheck`
  - `pnpm --filter @agentforge/patterns exec eslint src/react/schemas.ts tests/react/state.test.ts tests/react/contracts.typecheck.ts`
- Workspace checks:
  - `pnpm lint:explicit-any:baseline` -> workspace `84/289`, `patterns 2/28`
  - `pnpm test --run` -> `210` files passed, `18` skipped; `2310` tests passed, `286` skipped
  - `pnpm lint` -> passed with warnings only
  - `git diff --check`

## Notes

- The workspace test count increased from `2307` to `2310` because this story added three focused ReAct schema assertions in `packages/patterns/tests/react/state.test.ts`.
