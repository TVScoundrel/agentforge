# ST-09098: Plan-Execute Parsing and Test Modularization

## Summary

Planner and replanner nodes now share the typed `parseModelResponse` helper for model-content normalization, JSON parsing, and contextual parse errors. Existing planner and replanner factories, state transitions, logging, and serialization fallbacks are unchanged.

The oversized plan-execute node suite now has a small discoverable entrypoint that imports focused planner, executor, replanner, finisher, and shared model-response modules from `packages/patterns/tests/plan-execute/nodes/`.

## Test strategy

The helper contract was covered first with string content, text-part array content, and contextual invalid-JSON assertions. The existing node characterization coverage was then split without changing its behavior; all 32 plan-execute node tests pass.

## Validation

- `pnpm --filter @agentforge/patterns test --run packages/patterns/tests/plan-execute/nodes.test.ts`
- `pnpm --filter @agentforge/patterns typecheck`
- `pnpm lint`
- Full workspace test suite and build before PR finalization

No CI or validation automation change is required: the existing package Vitest discovery still executes the small public entrypoint, and the focused modules are intentionally not named `*.test.ts`.
