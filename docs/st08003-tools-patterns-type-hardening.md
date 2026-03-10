# ST-08003: Tools/Patterns Runtime Type Hardening

## Scope
Hardening pass for high-warning runtime files in:
- `packages/patterns/src/**`
- `packages/tools/src/**`

This story focused on top-warning files with behavior-preserving refactors from `any` to `unknown` and concrete helper types.

## Files Touched
- `packages/patterns/src/multi-agent/agent.ts`
- `packages/patterns/src/multi-agent/utils.ts`
- `packages/patterns/src/multi-agent/types.ts`
- `packages/tools/src/data/neo4j/connection.ts`
- `packages/tools/src/data/neo4j/utils/result-formatter.ts`

## Type Design Notes
- Replaced broad `any`-typed graph/tool boundaries with `unknown` + narrowing helpers.
- Added record/result extraction helpers for ReAct agent outputs to keep runtime safety while preserving existing behavior.
- Replaced Neo4j query parameter/result `any` signatures with typed `unknown` boundaries and safe conversions.
- Kept public API signatures compatible.
- Intentional bug fix: `wrapReActAgent` now passes through the configured `verbose` flag to `handleNodeError` in the catch path, so error logging is no longer silently suppressed when `verbose=true`.

## Warning Delta (`@typescript-eslint/no-explicit-any`)
Captured using:
- `pnpm exec eslint packages/tools/src packages/patterns/src --ext .ts -f json`

### Aggregate (tools + patterns `src/**`)
- Before: `164`
- After: `120`
- Delta: `-44`

### Package Split
- `packages/tools/src/**`: `82 -> 70` (`-12`)
- `packages/patterns/src/**`: `82 -> 50` (`-32`)

### Touched File Deltas
- `packages/patterns/src/multi-agent/agent.ts`: `17 -> 0`
- `packages/patterns/src/multi-agent/utils.ts`: `10 -> 0`
- `packages/patterns/src/multi-agent/types.ts`: `5 -> 0`
- `packages/tools/src/data/neo4j/connection.ts`: `6 -> 0`
- `packages/tools/src/data/neo4j/utils/result-formatter.ts`: `6 -> 0`

## Validation
Focused validation:
- `pnpm --filter @agentforge/patterns typecheck`
- `pnpm --filter @agentforge/tools typecheck`
- `pnpm exec eslint <touched files>`
- `pnpm test --run packages/patterns/tests/multi-agent/agent.test.ts packages/patterns/tests/multi-agent/utils.test.ts packages/tools/tests/data/neo4j.test.ts`
  - Result: `20 passed`, `13 skipped` (`neo4j` integration suite skipped by design unless enabled)

Full-suite validation and full lint are tracked in the story checklist before PR readiness.

Full validation before PR readiness:
- `pnpm test --run`
  - Result: `146` passed, `16` skipped test files (`162` total)
  - Result: `2074` passed, `286` skipped tests (`2360` total)
- `pnpm lint`
  - Result: exit code `0` (no lint errors)
  - Warning baseline snapshot:
    - `packages/cli`: `27` warnings
    - `packages/core`: `233` warnings
    - `packages/tools`: `208` warnings
    - `packages/patterns`: `72` warnings
    - `packages/testing`: `57` warnings
    - `packages/skills`: `2` warnings
