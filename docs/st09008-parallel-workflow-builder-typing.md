# ST-09008: Harden Parallel Workflow Builder Typing

## Summary

Refined the parallel workflow builder to use LangGraph annotation types at the public boundary, remove avoidable `any` and `@ts-expect-error` usage, and keep the unavoidable LangGraph node-registration interop localized to a single typed seam.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/langgraph/builders/parallel.ts` | Replaced `any`-typed state schema input with `AnnotationRoot`/`StateDefinition`-driven generics, derived node state directly from the schema, and tightened parallel/aggregate node update contracts without a permissive index signature |
| `packages/core/src/langgraph/builders/parallel.ts` | Removed `@ts-expect-error` node registration and `as any` edge wiring, using direct `START`/`END` edges and a localized `addNode()` interop cast instead |
| `packages/core/src/langgraph/builders/parallel.ts` | Kept `ParallelWorkflowOptions.name` as a deprecated compatibility-only no-op so the public API does not type-break before a major release |
| `packages/core/tests/langgraph/builders/parallel.test.ts` | Added direct edge assertions for fan-out/fan-in wiring and `autoStartEnd: false`, while preserving duplicate-name and aggregate execution coverage |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/langgraph/builders/parallel.ts`: `9 -> 0` (`-9`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `304 -> 295` (`-9`)
- `core` package: `128 -> 119` (`-9`)

(After snapshot captured with `pnpm lint:explicit-any:baseline` on 2026-03-22.)

## Compatibility Notes

- Parallel fan-out/fan-in runtime behavior is unchanged for both direct parallel execution and optional aggregation nodes.
- `autoStartEnd` continues to control whether `START`/`END` edges are added automatically; the new tests now assert that wiring directly.
- LangGraph still requires a widened node-action shape internally. That interop is now isolated to the `addNode()` call site instead of leaking into the exported builder API.
- `ParallelWorkflowOptions.name` remains accepted for backward compatibility, but it is still a no-op and documented as deprecated for a future major release.

## Validation

- `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
- `pnpm exec eslint packages/core/src/langgraph/builders/parallel.ts packages/core/tests/langgraph/builders/parallel.test.ts`
- `pnpm test --run packages/core/tests/langgraph/builders/parallel.test.ts` -> `8 passed`
- `pnpm lint:explicit-any:baseline`
- `pnpm test --run` -> `150 passed | 16 skipped` files; `2110 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only (`0` errors)

## Test Impact

Expanded focused automated coverage for duplicate-node validation, aggregate fan-in wiring, and `autoStartEnd` edge behavior.
