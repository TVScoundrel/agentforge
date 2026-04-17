# ST-09028: Connection Manager Lifecycle and Reconnection Control

## Summary

`packages/tools/src/data/relational/connection/connection-manager.ts` was still carrying the relational connection lifecycle orchestration after vendor initialization moved out in `ST-09027`. This story extracted the shared lifecycle and reconnection control flow into focused helpers while keeping the public `ConnectionManager` behavior unchanged.

## What Changed

| File | Change |
|------|--------|
| `packages/tools/src/data/relational/connection/lifecycle.ts` | Added shared lifecycle helpers for connection state, reconnection scheduling, pending-timer cancellation, in-flight connect waiting, and client shutdown. |
| `packages/tools/src/data/relational/connection/connection-manager.ts` | Delegated lifecycle and reconnection orchestration to the extracted helper module while preserving the public `ConnectionState` and `ReconnectionConfig` exports. |
| `packages/tools/tests/data/relational/connection/connection-manager.test.ts` | Added focused regressions for disconnecting during in-flight initialization and for canceling pending reconnection during close. |

## Compatibility Notes

- `ConnectionManager` remains the public lifecycle entrypoint.
- `ConnectionState` and `ReconnectionConfig` are still exported from `connection-manager.ts`.
- Public runtime behavior for `connect()`, `initialize()`, `disconnect()`, `close()`, `dispose()`, and reconnection scheduling is preserved.

## Explicit-`any` Notes

- `packages/tools/src/data/relational/connection/connection-manager.ts`: `2 -> 2`
- `packages/tools/src/data/relational/connection/lifecycle.ts`: `0 -> 0`
- Workspace baseline after implementation check: `180/289`
- `tools` package baseline after implementation check: `65/67`

## Validation

- `pnpm exec tsc -p packages/tools/tsconfig.json --noEmit`
- `pnpm exec eslint packages/tools/src/data/relational/connection/connection-manager.ts packages/tools/src/data/relational/connection/lifecycle.ts packages/tools/tests/data/relational/connection/connection-manager.test.ts packages/tools/tests/data/relational/connection/vendor-initialization.test.ts`
  - passed with existing warnings only in `connection-manager.ts` and the existing test file warnings
- `pnpm test --run packages/tools/tests/data/relational/connection/connection-manager.test.ts packages/tools/tests/data/relational/connection/vendor-initialization.test.ts`
  - `2 passed` files, `51 passed` tests
