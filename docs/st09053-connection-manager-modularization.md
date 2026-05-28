# ST-09053: Connection Manager Modularization

## Summary

This story modularizes the remaining oversized relational connection-manager runtime facade and its coupled connection-manager test cluster without changing the public `ConnectionManager` API.

## Runtime Split

Before:

- `packages/tools/src/data/relational/connection/connection-manager.ts`: `640` lines

After:

- `packages/tools/src/data/relational/connection/connection-manager.ts`: `255` lines
- `packages/tools/src/data/relational/connection/connection-manager-runtime.ts`: extracted initialization, close/cleanup, health-probe, SQLite non-query detection, and pool-metrics helpers

The public facade now keeps:

- lifecycle entrypoints (`connect`, `disconnect`, `dispose`, `close`)
- query/session public methods (`execute`, `executeInConnection`)
- state/reconnection wiring

The extracted runtime helper now owns:

- initialization success/error flow
- partial-connection cleanup
- shutdown behavior
- health checks
- pool metrics calculation
- SQLite non-query detection shared by query and session execution

## Test Split

Before:

- `packages/tools/tests/data/relational/connection-manager.test.ts`: `465` lines
- `packages/tools/tests/data/relational/connection/connection-manager.test.ts`: `695` lines
- `packages/tools/tests/data/relational/connection-lifecycle.test.ts`: `525` lines

After:

- `packages/tools/tests/data/relational/connection/connection-manager-config.test.ts`: `202` lines
- `packages/tools/tests/data/relational/connection/connection-manager-sqlite-runtime.test.ts`: `176` lines
- `packages/tools/tests/data/relational/connection/connection-manager-lifecycle.mocked.test.ts`: `283` lines
- `packages/tools/tests/data/relational/connection/connection-manager-operations.mocked.test.ts`: `268` lines
- `packages/tools/tests/data/relational/connection/query-session-extraction.test.ts`: retained focused query/session coverage
- `packages/tools/tests/data/relational/connection/vendor-initialization.test.ts`: retained focused vendor initialization coverage
- `packages/tools/tests/data/relational/connection/connection-lifecycle-state.test.ts`: `51` lines
- `packages/tools/tests/data/relational/connection/connection-lifecycle-events.test.ts`: `47` lines
- `packages/tools/tests/data/relational/connection/connection-lifecycle-behavior.test.ts`: `72` lines
- `packages/tools/tests/data/relational/connection/connection-lifecycle-reconnection.test.ts`: `167` lines
- `packages/tools/tests/data/relational/connection/connection-lifecycle-edge-cases.test.ts`: `92` lines
- `packages/tools/tests/data/relational/connection/connection-manager.mock-harness.ts`: shared mocked driver harness
- `packages/tools/tests/data/relational/connection/sqlite-bindings.ts`: shared runtime binding guard

This keeps constructor/config, mocked lifecycle, query/session behavior, real SQLite runtime checks, and lifecycle edge cases in separate suites instead of one cluster of monolithic files.

## Test Strategy

The practical test-first path for this story was to split the existing connection-manager test cluster before reducing the production facade.

The first focused gate after the split was:

```bash
pnpm test --run packages/tools/tests/data/relational/connection/*.test.ts
```

That immediately surfaced harness wiring issues in the new mocked-suite extraction before any runtime facade changes were finalized. After fixing the harness, the same focused gate passed and served as the safety net for the production split.

## Explicit-`any` Impact

No baseline regression:

- workspace: `84/289`
- tools: `53/67`

This story is structural. It improves responsibility boundaries and reviewability without expanding explicit-`any` usage.

## Validation

Focused:

- `pnpm --filter @agentforge/tools typecheck`
- `pnpm test --run packages/tools/tests/data/relational/connection/*.test.ts` -> `9` files passed, `2` skipped; `77` tests passed, `27` skipped

Story-level connection slice:

- `pnpm test --run packages/tools/tests/data/relational/connection/*.test.ts`

Repository gates:

- `pnpm lint:explicit-any:baseline` -> workspace `84/289`, tools `53/67`
- `pnpm test --run` -> `197` files passed, `18` skipped; `2312` tests passed, `287` skipped
- `pnpm lint` -> passed with existing warning baseline only

## Compatibility Notes

- Public `ConnectionManager` imports remain unchanged.
- Existing query execution, dedicated session execution, connection health checks, reconnection scheduling, and event semantics are preserved.
- The extraction only moves internal runtime logic behind the same public class surface.
