# ST-08001: Explicit `any` Baseline and No-Regression Gate

## Summary

Implemented a repository-level baseline gate for `@typescript-eslint/no-explicit-any` in `packages/**/src/**/*.ts` so warning debt can be reduced incrementally without allowing regressions.

## What Changed

| File | Change |
|------|--------|
| `scripts/check-explicit-any-baseline.mjs` | Added baseline checker that runs ESLint for `packages/**/src/**/*.ts`, compares current warning counts against baseline totals/package caps, and fails on regressions |
| `scripts/no-explicit-any-baseline.json` | Added committed baseline snapshot (`maxWarnings: 496`) with per-package caps |
| `package.json` | Added `lint:explicit-any:baseline` plus `lint:ci` to run full lint + baseline gate in CI flows |
| `.github/workflows/type-safety-baseline.yml` | Added CI workflow to enforce baseline on push/PR to `main` |

## Baseline Snapshot (Captured 2026-03-06)

- Scope: `packages/**/src/**/*.ts`
- Rule: `@typescript-eslint/no-explicit-any`
- Total warnings baseline: `496`

### By package

- `core`: 256
- `tools`: 82
- `patterns`: 82
- `testing`: 51
- `cli`: 25
- `skills`: 0

### Top file hotspots

1. `packages/core/src/tools/registry.ts` — 25
2. `packages/core/src/tools/executor.ts` — 21
3. `packages/core/src/resources/http-pool.ts` — 18
4. `packages/patterns/src/multi-agent/agent.ts` — 17
5. `packages/testing/src/runners/snapshot-testing.ts` — 17
6. `packages/core/src/langchain/converter.ts` — 15
7. `packages/core/src/langgraph/observability/logger.ts` — 15
8. `packages/core/src/langgraph/state.ts` — 13
9. `packages/core/src/tools/composition.ts` — 13
10. `packages/testing/src/helpers/state-builder.ts` — 11

## Local Verification

Run the explicit baseline gate directly:

```bash
pnpm lint:explicit-any:baseline
```

Expected behavior:
- Passes when total and per-package warning counts are at or below baseline.
- Fails when any package or total count rises above baseline, and prints current hotspots for triage.

## Test Impact

No test additions were required because this story adds lint governance tooling and CI wiring, not runtime behavior changes.
