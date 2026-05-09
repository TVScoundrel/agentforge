# ST-09040: Tighten Human-in-Loop Streaming Resume Contracts

## Summary

Tightened the human-in-loop SSE resume event boundary in `packages/core/src/streaming/human-in-loop.ts` so resume payloads use the same JSON-safe contract as LangGraph interrupt resume flows. The change preserves existing event names, payload shape, and resume event ID formatting while removing broad `any` from the public resume event helpers.

## Scope

Touched files:
- `packages/core/src/streaming/human-in-loop.ts`
- `packages/core/tests/streaming/human-in-loop.test.ts`
- `packages/core/tests/streaming/human-in-loop.typecheck.ts`

## Test Strategy

Test-first path used.

The first failing automated gate was a standalone typecheck fixture for `formatResumeEvent(...)` and `ResumeEventData`:
- `./node_modules/.bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --types node packages/core/tests/streaming/human-in-loop.typecheck.ts`
- initial failure included:
  - `Unused '@ts-expect-error' directive.`

That failure proved the resume boundary still accepted non-serializable values because the public helper contract was still typed with broad `any`.

## Validation

Focused validation after implementation:
- `./node_modules/.bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --types node packages/core/tests/streaming/human-in-loop.typecheck.ts`
- `pnpm test --run packages/core/tests/streaming/human-in-loop.test.ts`
- `pnpm --filter @agentforge/core typecheck`
- `pnpm lint:explicit-any:baseline`

Coverage added in the focused regression files:
- primitive resume value serialization
- object resume value serialization
- stable `resume-<interruptId>` event IDs
- rejection of non-serializable resume payloads in both helper calls and `ResumeEventData`

## Explicit-any Delta

Touched helper file:
- `packages/core/src/streaming/human-in-loop.ts`: `2 -> 0`

Package and workspace baseline impact:
- `core`: `35/119 -> 33/119`
- workspace: `106/289 -> 104/289`

## Behavior Notes

Preserved behavior includes:
- `human_request`, `human_response`, `interrupt`, `resume`, `agent_waiting`, and `agent_resumed` SSE event names
- `resume-<interruptId>` event ID formatting
- serialized primitive and object resume payloads in `event.data`
- unchanged waiting/resumed event formatting

The contract change aligns resume SSE payloads with the existing `InterruptPayload` type already used by interrupt resume commands and options, without widening scope beyond the human-in-loop streaming helpers.
