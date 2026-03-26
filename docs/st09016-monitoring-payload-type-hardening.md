# ST-09016: Harden Monitoring Audit and Health Payload Types

## Summary

Tightened the monitoring audit and health payload contracts so the public monitoring helpers no longer expose broad `any` payload fields, while preserving the current runtime behavior for JSON-safe observability data.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/monitoring/audit.ts` | Replaced broad audit `input`, `output`, metadata, and storage config payloads with shared JSON-safe observability contracts |
| `packages/core/src/monitoring/health.ts` | Replaced health-check metadata `Record<string, any>` with the shared JSON-object payload contract |
| `packages/core/tests/monitoring/audit-health.test.ts` | Added focused coverage for audit payload preservation, health metadata handling, and `onCheckFail` error propagation |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/monitoring/audit.ts`: `4 -> 0` (`-4`)
- `packages/core/src/monitoring/health.ts`: `1 -> 0` (`-1`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `276 -> 271` (`-5`)
- `core` package: `111 -> 106` (`-5`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-03-26.)

## Compatibility Notes

- Monitoring runtime behavior remains the same for JSON-safe payloads and metadata; this story only tightens the TypeScript surface to match the observability payload contracts already used elsewhere in `@agentforge/core`.
- `AuditLogger` storage configuration remains structurally open to JSON-safe nested objects, preserving current in-memory and callback behavior.
- `HealthChecker` result metadata remains optional and free-form within JSON-object constraints, which aligns with the current runtime usage patterns.

## Validation

- `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
- `pnpm exec eslint packages/core/src/monitoring/audit.ts packages/core/src/monitoring/health.ts packages/core/tests/monitoring/audit-health.test.ts`
- `pnpm test --run packages/core/tests/monitoring/audit-health.test.ts packages/core/tests/monitoring/alerts.test.ts` -> `2 passed` files, `10 passed` tests
- `pnpm test --run` -> `153 passed | 16 skipped` files; `2137 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only (`0` errors)

## Test Impact

Added focused automated coverage for audit payload preservation and health-check metadata handling, then validated the change through the full workspace test suite and lint pass. No manual-only gap remains for the changed surface.
