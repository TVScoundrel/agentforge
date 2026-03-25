# ST-09015: Modularize Multi-Agent Node Responsibilities

## Summary

Split the multi-agent node implementation into focused supervisor, worker, aggregator, and shared helper modules while keeping `packages/patterns/src/multi-agent/nodes.ts` as the stable public entrypoint.

## Module Layout

### Before

- `packages/patterns/src/multi-agent/nodes.ts` contained supervisor routing, worker execution, aggregation, ID generation, tool conversion, and content serialization in one 600+ line file

### After

- `packages/patterns/src/multi-agent/nodes.ts` is a thin public export surface
- `packages/patterns/src/multi-agent/nodes/supervisor.ts` owns coordinator routing and workload assignment behavior
- `packages/patterns/src/multi-agent/nodes/worker.ts` owns worker execution selection, workload bookkeeping, and node-level error handling
- `packages/patterns/src/multi-agent/nodes/aggregator.ts` owns aggregation behavior and default response synthesis
- `packages/patterns/src/multi-agent/nodes/shared.ts` centralizes ID generation, assignment lookup, tool conversion, and content serialization helpers

## What Changed

| File | Change |
|------|--------|
| `packages/patterns/src/multi-agent/nodes.ts` | Reduced the public entrypoint to stable re-exports only |
| `packages/patterns/src/multi-agent/nodes/supervisor.ts` | Moved supervisor routing, assignment creation, and workload-increment logic into a dedicated module |
| `packages/patterns/src/multi-agent/nodes/worker.ts` | Moved worker execution selection, LLM invocation, workload decrementing, and error-result handling into a dedicated module |
| `packages/patterns/src/multi-agent/nodes/aggregator.ts` | Moved aggregation behavior and default system prompt handling into a dedicated module |
| `packages/patterns/src/multi-agent/nodes/shared.ts` | Added shared helpers for IDs, assignment lookup, tool conversion, and response serialization to reduce duplication across node types |
| `packages/patterns/tests/multi-agent/nodes.test.ts` | Added focused coverage for custom worker handoff-state preservation while validating the split through the public node entrypoint |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/patterns/src/multi-agent/nodes.ts`: `2 -> 0` (`-2`)
- New split modules were introduced without new explicit-`any` warnings

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `278 -> 276` (`-2`)
- `patterns` package: `25 -> 23` (`-2`)

(Captured with `pnpm lint:explicit-any:baseline` on 2026-03-25.)

## Compatibility Notes

- Public imports remain unchanged through `packages/patterns/src/multi-agent/nodes.ts`
- The logger namespace remains `agentforge:patterns:multi-agent:nodes`, so existing log filtering continues to work
- Supervisor, worker, and aggregator runtime behavior stays the same; the change is organizational plus the addition of focused regression coverage for worker handoff-state preservation

## Validation

- `pnpm exec tsc -p packages/patterns/tsconfig.json --noEmit`
- `pnpm exec eslint packages/patterns/src/multi-agent/nodes.ts packages/patterns/src/multi-agent/nodes/*.ts packages/patterns/tests/multi-agent/nodes.test.ts`
- `pnpm test --run packages/patterns/tests/multi-agent/nodes.test.ts packages/patterns/tests/multi-agent/agent.test.ts` -> `45 passed`
- `pnpm test --run packages/patterns/tests/multi-agent/nodes.test.ts` -> `29 passed`
- `pnpm lint:explicit-any:baseline`
- `pnpm test --run` -> `152 passed | 16 skipped` files; `2130 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only (`0` errors)

## Test Impact

Updated focused automated multi-agent node coverage and added an explicit handoff-state preservation regression for worker execution results. No manual-only test gap remains for the changed surface.
