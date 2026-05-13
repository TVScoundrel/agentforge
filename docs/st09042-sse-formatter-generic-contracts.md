# ST-09042: Tighten SSE Formatter Generic Event Contracts

## Summary

Tightened the shared SSE formatter contracts in `packages/core/src/streaming/types.ts` and `packages/core/src/streaming/sse.ts` so the public generic defaults are unknown-first instead of broad `any`. The change preserves formatter runtime behavior while forcing untyped event mappers to treat input as unknown unless they opt into a concrete payload shape.

## Scope

Touched files:
- `packages/core/src/streaming/types.ts`
- `packages/core/src/streaming/sse.ts`
- `packages/core/src/streaming/__tests__/sse.test.ts`
- `packages/core/tests/streaming/sse.typecheck.ts`

## Test Strategy

Test-first path used.

The first failing automated gate was a standalone typecheck fixture for `createSSEFormatter(...)`:
- `./node_modules/.bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --types node packages/core/tests/streaming/sse.typecheck.ts`
- initial failure included:
  - `Unused '@ts-expect-error' directive.`

That failure proved the default SSE formatter generic still widened mapper input enough to allow direct property access without an explicit payload type.

## Validation

Focused validation after implementation:
- `./node_modules/.bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --types node packages/core/tests/streaming/sse.typecheck.ts`
- `pnpm test --run packages/core/src/streaming/__tests__/sse.test.ts`
- `pnpm --filter @agentforge/core typecheck`
- `pnpm lint:explicit-any:baseline`

Full validation before review:
- `pnpm test --run`
- `pnpm lint`
- `git diff --check`

Coverage added or strengthened in the focused regression files:
- typed event mappers using an explicit formatter payload generic
- default JSON serialization fallback with stable event IDs
- retry prelude emission
- multi-line SSE event formatting
- rejection of direct property access on untyped mapper input

## Explicit-any Delta

Touched source files:
- `packages/core/src/streaming/types.ts` and `packages/core/src/streaming/sse.ts`: `3 -> 0`

Package and workspace baseline impact:
- `core`: `33/119 -> 28/119`
- workspace: `104/289 -> 99/289`

## Behavior Notes

Preserved behavior includes:
- default JSON serialization for unmapped stream items
- mapper-driven event formatting with per-item event IDs
- retry prelude emission before streamed items
- heartbeat timer setup/reset semantics
- multi-line SSE `data:` formatting

The only contract tightening is at the generic boundary: callers that do not declare a formatter payload type now receive `unknown` mapper input and must narrow or annotate it explicitly.
