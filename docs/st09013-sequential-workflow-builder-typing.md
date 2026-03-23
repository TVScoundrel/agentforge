# ST-09013: Harden Sequential Workflow Builder Typing

## Summary

Refined the sequential workflow builder to derive state and update typing directly from the provided LangGraph schema, remove avoidable `any` edge/schema seams, and keep the unavoidable LangGraph node-registration interop localized to a single typed boundary.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/langgraph/builders/sequential.ts` | Replaced the broad `any`-typed schema input with `AnnotationRoot`/`StateDefinition`-driven generics, deriving workflow state from the supplied schema instead of a free state parameter |
| `packages/core/src/langgraph/builders/sequential.ts` | Removed `START`/`END` `as any` edge wiring and localized the remaining LangGraph `addNode()` widening to one `GraphNodeAction` interop seam |
| `packages/core/src/langgraph/builders/sequential.ts` | Kept `SequentialWorkflowOptions.name` as a deprecated compatibility-only no-op, removed the deprecated explicit-state overload, and bound both state and update typing directly to the supplied LangGraph schema |
| `packages/core/src/langgraph/builders/sequential.ts` | Wrapped `StateGraph` construction so invalid runtime schema inputs are rethrown as a targeted `Annotation.Root(...)` contract error with the original failure attached as `cause` |
| `packages/core/tests/langgraph/builders/sequential.test.ts` | Added direct edge assertions for sequential wiring, `autoStartEnd: false`, schema-derived type inference coverage, and runtime regressions for rejecting non-annotation and fake-`spec` schemas |
| `packages/core/src/langgraph/builders/sequential.typecheck.ts` | Added a source-included type-level regression file so normal core `typecheck` covers schema-derived inference and locks in that explicit state generics are rejected |

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/langgraph/builders/sequential.ts`: `8 -> 0` (`-8`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `289 -> 281` (`-8`)
- `core` package: `119 -> 111` (`-8`)

(Captured with `pnpm lint:explicit-any:baseline` on 2026-03-23.)

## Compatibility Notes

- Sequential runtime behavior is unchanged for normal start-to-end execution; the builder still chains nodes in declaration order.
- `autoStartEnd` continues to control whether `START`/`END` edges are added automatically, and the new tests assert that wiring directly.
- LangGraph still widens node registration internally. That interop is now isolated to the `addNode()` call site instead of leaking into the public builder API.
- `SequentialWorkflowOptions.name` remains accepted for backward compatibility, but it is still a no-op and documented as deprecated for a future major release.
- `createSequentialWorkflow<MyState>(...)` is no longer supported; callers must rely on schema-derived inference from a real LangGraph `Annotation.Root(...)` schema.
- The builder no longer exposes a fallback where state or update types can drift away from the supplied schema; both are now derived from `Annotation.Root(...)`.
- Non-LangGraph schema objects now fail with a clear targeted error at graph construction time, while preserving the original LangGraph failure as `cause`.
- A dedicated source-included type-level regression file covers the compile-time inference path under the normal core `typecheck` command without pulling the entire legacy test tree into this story.

## Validation

- `pnpm --filter @agentforge/core typecheck`
- `pnpm exec eslint packages/core/src/langgraph/builders/sequential.ts packages/core/src/langgraph/builders/sequential.typecheck.ts packages/core/tests/langgraph/builders/sequential.test.ts`
- `pnpm test --run packages/core/tests/langgraph/builders/sequential.test.ts` -> `14 passed`
- `pnpm lint:explicit-any:baseline`
- `pnpm test --run` -> `152 passed | 16 skipped` files; `2123 passed | 286 skipped` tests
- `pnpm lint` -> exit `0`; warnings only (`0` errors)

## Test Impact

Expanded focused automated coverage for schema-derived typing, direct sequential edge wiring, and `autoStartEnd` edge behavior.
