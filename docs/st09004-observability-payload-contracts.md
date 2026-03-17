# ST-09004: Refine Observability Payload Contracts

## Summary

Introduced a shared JSON-safe payload contract for observability code paths and applied it to the core logger and alert manager without changing current logging or alert behavior.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/langgraph/observability/payload.ts` | Added reusable `JsonPrimitive`, `JsonValue`, and `JsonObject` contracts for JSON-safe observability payloads |
| `packages/core/src/langgraph/observability/logger.ts` | Replaced broad `Record<string, any>` payload/context types in `LogEntry`, `Logger`, and `LoggerImpl` with shared JSON-safe contracts |
| `packages/core/src/monitoring/alerts.ts` | Typed alert payloads, channel config, and rule metrics around JSON-safe contracts and extracted focused helpers for alert summaries and rule error payloads |
| `packages/core/src/langgraph/observability/index.ts` | Re-exported shared payload types through the observability barrel |
| `packages/core/src/langgraph/index.ts` | Re-exported shared payload types through the LangGraph public surface |
| `packages/core/tests/langgraph/observability/logger.test.ts` | Added nested JSON-safe payload coverage and removed a lingering `any` from the capture stream helper |
| `packages/core/tests/monitoring/alerts.test.ts` | Added focused alert-manager coverage for typed rule execution, throttling, and channel delivery logging |

## Explicit `any` Warning Delta

### Story scope hotspots

- `packages/core/src/langgraph/observability/logger.ts`: `15 -> 0` (`-15`)
- `packages/core/src/monitoring/alerts.ts`: `5 -> 0` (`-5`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `344 -> 324` (`-20`)
- `core` package: `148 -> 128` (`-20`)

(After snapshot captured with `pnpm lint:explicit-any:baseline` on 2026-03-16.)

## Compatibility Notes

- Logger output formatting remains unchanged for both pretty and JSON modes.
- Alert manager runtime behavior remains unchanged for rule evaluation, throttling, callback delivery, and channel logging.
- The new payload contracts intentionally stay JSON-safe so downstream integrations get stable serialized shapes instead of ad hoc object boundaries.

## Validation

- `pnpm exec eslint packages/core/src/langgraph/observability/payload.ts packages/core/src/langgraph/observability/logger.ts packages/core/src/langgraph/observability/index.ts packages/core/src/langgraph/index.ts packages/core/src/monitoring/alerts.ts packages/core/tests/langgraph/observability/logger.test.ts packages/core/tests/monitoring/alerts.test.ts`
- `pnpm test --run packages/core/tests/langgraph/observability/logger.test.ts packages/core/tests/monitoring/alerts.test.ts` -> `22 passed`
- `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
- `pnpm --filter @agentforge/core build`
- `pnpm lint:explicit-any:baseline`
- `pnpm test --run` -> `148 passed | 16 skipped` files; `2093 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only (`0` errors)

## Test Impact

Expanded focused automated coverage for nested logger payload serialization and typed alert-rule execution behavior.
