# ST-09008: Harden Parallel Workflow Builder Typing

## Summary

Refined the parallel workflow builder to use LangGraph annotation types at the public boundary, remove avoidable `any` and `@ts-expect-error` usage, and keep the unavoidable LangGraph node-registration interop localized to a single typed seam.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/langgraph/builders/parallel.ts` | Replaced `any`-typed state schema input with `AnnotationRoot`/`StateDefinition`-driven generics and tightened parallel/aggregate node update contracts |
| `packages/core/src/langgraph/builders/parallel.ts` | Removed `@ts-expect-error` node registration and `as any` edge wiring, using direct `START`/`END` edges and a localized `addNode()` interop cast instead |
| `packages/core/tests/langgraph/builders/parallel.test.ts` | Added direct edge assertions for fan-out/fan-in wiring and `autoStartEnd: false`, while preserving duplicate-name and aggregate execution coverage |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/langgraph/builders/parallel.ts`: `11 -> 0` (`-11`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `304 -> 295` (`-9`)
- `core` package: `128 -> 119` (`-9`)

(After snapshot captured with `pnpm lint:explicit-any:baseline` on 2026-03-22.)

## Compatibility Notes

- Parallel fan-out/fan-in runtime behavior is unchanged for both direct parallel execution and optional aggregation nodes.
- `autoStartEnd` continues to control whether `START`/`END` edges are added automatically; the new tests now assert that wiring directly.
- LangGraph still requires a widened node-action shape internally. That interop is now isolated to the `addNode()` call site instead of leaking into the exported builder API.

## Validation

- `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
- `pnpm exec eslint packages/core/src/langgraph/builders/parallel.ts packages/core/tests/langgraph/builders/parallel.test.ts`
- `pnpm test --run packages/core/tests/langgraph/builders/parallel.test.ts` -> `8 passed`
- `pnpm lint:explicit-any:baseline`

## Test Impact

Expanded focused automated coverage for duplicate-node validation, aggregate fan-in wiring, and `autoStartEnd` edge behavior.
