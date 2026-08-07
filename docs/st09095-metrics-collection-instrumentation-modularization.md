# ST-09095: Metrics Collection and Node Instrumentation Modularization

## Scope

Split the core metrics surface into focused contracts, in-memory collector/timer runtime, and LangGraph node-instrumentation modules while retaining `metrics.ts` as the stable public facade.

## Design

- `metrics/contracts.ts` owns `MetricType`, `MetricEntry`, `Timer`, `Metrics`, and `MetricsNodeOptions`.
- `metrics/collector.ts` owns namespaced counter, gauge, histogram, timer, label, snapshot, and clear behavior.
- `metrics/node-instrumentation.ts` owns invocation, success, error, and duration tracking around synchronous and asynchronous nodes.
- `metrics.ts` re-exports the existing public API so downstream import paths remain unchanged.

## Test Strategy

This story is behavior-preserving, so characterization-first coverage is safer than inventing an intentionally failing behavioral requirement. Before production changes, the existing suite was split into collector/timer and node-instrumentation modules and expanded to characterize label-isolated counters, counter reset after clear, deterministic timer recording, option-controlled tracking, and error rethrow behavior. The characterization suite passed against the original implementation before the production split and after it.

## CI Assessment

No CI workflow change is required. Existing focused core tests, the core typecheck, package/workspace tests, workspace lint, build validation, and explicit-`any` baseline gate cover the extracted modules and stable facade.

## Validation

- Characterization baseline: `pnpm --filter @agentforge/core test --run tests/langgraph/observability/metrics.test.ts` — 1 file and 9 tests passed against the unchanged implementation.
- Post-refactor focused validation: the same command — 1 file and 9 tests passed.
- `pnpm --filter @agentforge/core typecheck` — passed.
- `pnpm --filter @agentforge/core test --run` — passed, 650 tests.
- `pnpm release:validate` — build passed; 231 test files passed, 9 skipped; 2,559 tests passed, 110 skipped.
- `pnpm lint` — passed with existing warnings and zero errors.
- `pnpm typecheck` — passed across all six packages.
- `pnpm lint:explicit-any:baseline` — passed at 45/289 warnings with no regression.
- `git diff --check` — passed.
