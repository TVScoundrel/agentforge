# ST-09060: Multi-Agent Schema Payload Contracts

## Summary

`ST-09060` tightens the multi-agent runtime schemas around message metadata, task-result metadata, and handoff context without changing multi-agent routing or execution behavior. Message and task-result metadata now require JSON-safe structures, while handoff context remains unknown-first so worker-to-worker coordination can still pass through richer runtime values when needed. During review, the JSON-safe object validator was extracted into a shared helper and ReAct message/thought metadata now use that same contract, which also rejects non-plain runtime objects while still allowing normal objects and null-prototype JSON maps.

## Test Strategy

This story had a practical test-first seam, so implementation started with focused multi-agent schema assertions before production changes:

- add runtime schema assertions in `packages/patterns/tests/multi-agent/state.test.ts` for JSON-safe metadata acceptance/rejection boundaries and unknown-first handoff context compatibility
- add compile-time assertions in `packages/patterns/tests/multi-agent/contracts.typecheck.ts` and wire them into the package typecheck config so inferred metadata and handoff context types no longer flow through broad `any`

No CI change was required because the existing focused multi-agent state test, package typecheck, workspace test suite, lint, and explicit-`any` baseline gate already cover the touched surfaces once the compile-time assertions are included in `packages/patterns/tsconfig.typecheck.json`.

## Contract Changes

- `AgentMessageSchema.metadata` now uses a JSON-safe object contract instead of `z.record(z.any())`
- `TaskResultSchema.metadata` now uses a JSON-safe object contract instead of `z.record(z.any())`
- `HandoffRequestSchema.context` now uses `z.unknown()` instead of `z.any()`
- ReAct `MessageSchema.metadata` and `ThoughtSchema.metadata` now use the shared JSON-safe object contract as part of the review-driven helper extraction

## Behavior Preserved

- Multi-agent routing, worker handoff, execution metadata, and context-passing behavior remain unchanged
- handoff context remains unknown-first and continues to accept non-JSON values when runtime coordination needs that flexibility
- message flow, task completion flow, and supervisor/worker coordination semantics remain unchanged
- ReAct message and thought metadata remain optional, but now reject non-JSON-safe runtime objects such as class instances while accepting plain objects and null-prototype JSON maps

## Explicit-`any` Baseline

- `pnpm lint:explicit-any:baseline` remained stable at `84/289` workspace warnings
- `@agentforge/patterns` remained stable at `2/28`

## Validation

- Focused schema test:
  - `pnpm test --run packages/patterns/tests/multi-agent/state.test.ts`
  - initial failing result: `should reject non-JSON-safe metadata while preserving unknown-first handoff context`
  - final result: `1` file passed, `23` tests passed
- Package checks:
  - `pnpm --filter @agentforge/patterns typecheck`
  - `pnpm --filter @agentforge/patterns exec eslint src/multi-agent/schemas.ts tests/multi-agent/state.test.ts tests/multi-agent/contracts.typecheck.ts`
- Workspace checks:
  - `pnpm lint:explicit-any:baseline` -> workspace `84/289`, `patterns 2/28`
  - `pnpm test --run` -> `210` files passed, `18` skipped; `2311` tests passed, `286` skipped
  - `pnpm lint` -> passed with warnings only
  - `git diff --check`

## Notes

- The story added one focused runtime regression in `packages/patterns/tests/multi-agent/state.test.ts` plus a dedicated type-level contract assertion file for the multi-agent schema boundary.
- The workspace test count increased from `2310` to `2311` because this story added one focused multi-agent schema assertion in `packages/patterns/tests/multi-agent/state.test.ts`.
- Review follow-ups extracted `packages/patterns/src/shared/json-schemas.ts`, switched ReAct metadata fields to that helper, tightened plain-object enforcement, and then widened it to preserve support for `Object.create(null)` JSON maps.
