# ST-09037: ReAct Builder and Prompt Boundary Contracts

**Story:** ST-09037 - Tighten ReAct Builder and Prompt Boundary Contracts
**Epic:** EP-09 - SOLID Micro-Refactors and Type Boundary Hardening
**Status:** In Progress

## Scope

This story narrows the ReAct setup surface around tool collections, checkpointers, compiled graph return typing, and prompt helper descriptors without changing public runtime behavior.

Touched production files:
- `packages/patterns/src/react/types.ts`
- `packages/patterns/src/react/builder.ts`
- `packages/patterns/src/react/agent.ts`
- `packages/patterns/src/react/prompts.ts`

Touched focused tests:
- `packages/patterns/tests/react/builder.test.ts`
- `packages/patterns/tests/react/prompts.test.ts`
- `packages/patterns/tests/react/contracts.typecheck.ts`

## Test Strategy

First failing test path:
- A standalone typecheck fixture at `packages/patterns/tests/react/contracts.typecheck.ts` asserts the narrowed contracts for:
  - compiled ReAct graph state/update typing
  - builder `withCheckpointer(...)`
  - builder tool-array input
  - prompt tool descriptor schema typing
- Before the refactor, the targeted typecheck failed because the ReAct builder/agent/prompt seams still exposed broad `any` contracts and unused `@ts-expect-error` assertions.

Focused validation:
- `./node_modules/.bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --types node packages/patterns/tests/react/contracts.typecheck.ts`
- `pnpm test --run packages/patterns/tests/react/builder.test.ts packages/patterns/tests/react/agent.test.ts packages/patterns/tests/react/integration.test.ts packages/patterns/tests/react/prompts.test.ts`
- `pnpm --filter @agentforge/patterns typecheck`

Broader validation:
- `pnpm lint:explicit-any:baseline`
- `pnpm test --run`
- `pnpm lint`

## Explicit `any` Delta

Touched-file deltas:
- `packages/patterns/src/react/types.ts`: `2 -> 0`
- `packages/patterns/src/react/builder.ts`: `5 -> 0`
- `packages/patterns/src/react/agent.ts`: `4 -> 0`
- `packages/patterns/src/react/prompts.ts`: `1 -> 0`

Aggregate impact:
- touched ReAct files: `12 -> 0`
- `patterns` baseline: `15/28 -> 3/28`
- workspace baseline: `133/289 -> 121/289`

## Implementation Notes

- Introduced shared ReAct-local aliases for tool sources, checkpointer inputs, prompt tool descriptors, and the compiled graph return type.
- Preserved deprecated `withLLM(...)`, tool-array and `ToolRegistry` inputs, custom stop-condition routing, and `checkpointer: true` parent-graph behavior.
- Added prompt helper coverage for tool formatting, scratchpad rendering, and thought rendering order.
