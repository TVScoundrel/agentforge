# ST-09041: Adopt Structured Logger in Conversation Simulator

## Summary

Replaced the verbose `console.log` path in `packages/testing/src/runners/conversation-simulator.ts` with the shared structured logger from `@agentforge/core`. The simulator now keeps verbose logging opt-in, preserves the same `User: ...` and `AI: ...` turn text, and supports optional logger injection so tests can verify the logging route without depending on global stdout.

## Scope

Touched files:
- `packages/testing/src/runners/conversation-simulator.ts`
- `packages/testing/tests/runners/conversation-simulator.test.ts`

## Test Strategy

Test-first path used.

The first failing automated test was added in `packages/testing/tests/runners/conversation-simulator.test.ts`:
- `pnpm test --run packages/testing/tests/runners/conversation-simulator.test.ts`
- initial failure:
  - `expected [] to have a length of 2 but got +0`

That failure proved the new expectation was not yet satisfied: verbose output was still going to `console.log`, and the injected structured logger stream received nothing.

## Logger Verification Approach

The focused tests use two doubles:
- a `CaptureStream` writable stream passed to `createLogger(...)` so emitted log lines can be asserted directly
- a `vi.spyOn(console, 'log')` assertion to prove verbose output no longer routes through the console path

This keeps verification local to the runner tests and avoids mutating process-wide stdout behavior.

## Validation

Focused validation after implementation:
- `pnpm test --run packages/testing/tests/runners/conversation-simulator.test.ts`
- `pnpm --filter @agentforge/testing typecheck`
- `pnpm lint:explicit-any:baseline`

Coverage added in the focused regression file:
- verbose logging routes through the structured logger instead of `console.log`
- verbose-disabled execution emits no logs
- emitted verbose content still contains the same user and AI turn strings

## Explicit-any Delta

Touched files did not introduce new explicit-`any` warnings.

Package and workspace baseline impact:
- `testing`: `3/51 -> 3/51`
- workspace: `104/289 -> 104/289`

## Behavior Notes

Preserved behavior includes:
- verbose logging remains opt-in through `config.verbose`
- non-verbose simulator behavior remains unchanged
- static conversation simulation still appends only the latest agent message each turn
- emitted turn text remains `User: <input>` and `AI: <content>`

The only behavior change is the output sink for verbose mode: it now uses the shared structured logger path instead of direct console writes.
