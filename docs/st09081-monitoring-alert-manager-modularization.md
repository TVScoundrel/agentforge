# ST-09081: Modularize Monitoring Alert Manager and Tests

## Summary

- Reduced `packages/core/src/monitoring/alerts.ts` from `302` lines to a `17` line public facade.
- Extracted focused monitoring helpers for public types, shared logging, error payload shaping, rule evaluation/throttling, channel dispatch, and the `AlertManager` runtime.
- Replaced the `288` line `packages/core/tests/monitoring/alerts.test.ts` monolith with a `4` line entrypoint plus focused alert suites under `packages/core/tests/monitoring/alerts/`.
- Restored the documented `pnpm --filter @agentforge/core test --run` validation path by adding `packages/core/vitest.config.ts` and pointing the core package `test` script at it.

## Production Split

| Module | Lines | Responsibility |
| --- | ---: | --- |
| `alerts.ts` | 17 | Stable public facade |
| `alerts-types.ts` | 94 | Public alert/channel/rule option types |
| `alerts-shared.ts` | 12 | Shared logger + alert summary shaping |
| `alerts-errors.ts` | 36 | Rule, dispatch, callback, and metrics-provider error payload helpers |
| `alerts-rules.ts` | 55 | Rule evaluation + per-rule throttle checks |
| `alerts-channels.ts` | 47 | Built-in/custom channel dispatch logging |
| `alerts-manager.ts` | 99 | `AlertManager` runtime orchestration + factory |

## Test Split

| Module | Lines | Responsibility |
| --- | ---: | --- |
| `alerts.test.ts` | 4 | Entry point |
| `alerts/shared.ts` | 16 | Timer harness + stdout capture |
| `alerts/rule-evaluation.ts` | 166 | Typed rule evaluation, direct-alert timestamp preservation, and channel typing coverage |
| `alerts/throttling.ts` | 33 | Per-rule throttling behavior |
| `alerts/error-handling.ts` | 68 | Callback-failure and metrics-provider-failure logging |
| `alerts/channel-dispatch.ts` | 32 | Channel dispatch logging |

## Compatibility Notes

- Public `AlertManager` and `createAlertManager(...)` exports remain at `packages/core/src/monitoring/alerts.ts`.
- Built-in vs custom channel typing remains unchanged because the original channel validation types were moved intact into `alerts-types.ts`.
- Direct alert behavior remains unchanged, including explicit `timestamp: 0` preservation and callback-failure logging that does not reject `alert()`.
- Monitoring-loop behavior remains unchanged: rule-condition failures and metrics-provider failures are still logged, and rule-triggered alerts still dispatch asynchronously through `alert()`.

## Validation

- `pnpm test --run packages/core/tests/monitoring/alerts.test.ts`
  - Passed: `1` file, `7` tests
- `pnpm --filter @agentforge/core test --run`
  - Passed: `65` files, `643` tests
- `pnpm --filter @agentforge/core typecheck`
  - Passed
- `pnpm lint:explicit-any:baseline`
  - Passed; baseline held at workspace `80/289`, core `19/119`

## Explicit `any` Baseline

- No regression.
- Current baseline after the story:
  - Workspace: `80/289`
  - Core: `19/119`

## CI / Validation Impact

- No CI workflow file change was required.
- The story did require a package-local Vitest config so the documented package-scoped validation command now works from `packages/core` instead of resolving the root include patterns from the wrong working directory.
