# ST-09021: Harden Streaming WebSocket and Message Contracts

## Summary

Tightened the core streaming WebSocket helpers around structural socket contracts and unknown-first message payload handling so realtime integrations no longer depend on broad `any` boundaries while preserving the current connection, parsing, send, and broadcast behavior.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/streaming/types.ts` | Added structural WebSocket socket/message/close-reason contracts, made `WebSocketMessage` generic on payload data, and replaced broad handler `any` types with typed callback boundaries |
| `packages/core/src/streaming/websocket.ts` | Removed broad `ws`, `message`, and `data` `any` seams, localized the generic socket interop cast, kept string JSON parsing behavior intact, and preserved send/broadcast open-socket checks |
| `packages/core/src/streaming/index.ts` | Re-exported the new WebSocket contract types through the public streaming entrypoint |
| `packages/core/src/streaming/__tests__/websocket.test.ts` | Replaced the broad mock handler map with typed handlers and added focused coverage for raw non-string payload passthrough alongside existing parsing, error, and broadcast behavior |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/streaming/websocket.ts`: `6 -> 0` (`-6`)
- `packages/core/src/streaming/types.ts`: `7 -> 2` (`-5`)

Remaining warnings in `packages/core/src/streaming/types.ts` are the pre-existing SSE generic defaults and were left out of scope for this story.

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `219 -> 205` (`-14`)
- `core` package: `96 -> 82` (`-14`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-04-03.)

## Compatibility Notes

- `createWebSocketHandler(...)` still parses string payloads as JSON when possible and still passes non-JSON strings through unchanged.
- Non-string message payloads are still forwarded unchanged to `onMessage(...)`; the callback boundary is now `unknown` instead of `any`.
- `sendMessage(...)` and `broadcast(...)` still serialize the message once with `JSON.stringify(...)` and still send only when `readyState === 1`.
- The WebSocket helper types now describe a minimal structural socket contract instead of `any`, which is compatible with common Node/browser WebSocket implementations that provide `on(...)`, `send(...)`, `ping()`, `terminate()`, and `readyState`.
- Close reasons are now typed as string-or-binary payloads rather than just `string`, matching the broader runtime behavior of WebSocket implementations without changing the forwarding behavior.

## Validation

- `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
- `pnpm exec eslint packages/core/src/streaming/websocket.ts packages/core/src/streaming/types.ts packages/core/src/streaming/index.ts packages/core/src/streaming/__tests__/websocket.test.ts`
- `pnpm test --run packages/core/src/streaming/__tests__/websocket.test.ts` -> `1 passed` file, `14 passed` tests
- `pnpm lint:explicit-any:baseline --silent` -> `205/289` warnings, `core 82/119`
- `pnpm test --run` -> `156 passed | 16 skipped` files; `2166 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only

## Test Impact

Expanded the focused WebSocket suite so parsing, raw payload passthrough, error forwarding, close handling, send behavior, and broadcast behavior are all covered against the tightened socket/message contracts.
