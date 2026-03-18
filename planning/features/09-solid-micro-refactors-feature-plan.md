# Feature Plan: SOLID Micro-Refactors and Type Boundary Hardening

**Epic Range:** EP-09 through EP-09
**Status:** In Progress
**Last Updated:** 2026-03-18
**Active Story:** ST-09005 (Ready)

---

## Feature Overview

**Objective:** Establish a steady stream of small, behavior-preserving refactors that improve SOLID adherence and type boundaries in runtime-facing code.

**Target Users:**
- AgentForge maintainers reducing technical debt without delivery disruption
- Contributors extending core/patterns modules who need clearer contracts
- Downstream consumers who benefit from safer TypeScript inference and fewer runtime ambiguities

**Desired Outcomes:**
- Incremental daily stories can be completed in one working day each
- High-leverage explicit-`any` hotspots in runtime code are reduced with no API regressions
- Modules with mixed responsibilities are split into clearer boundaries where practical
- The explicit-`any` baseline continues to trend down from current `385` warnings in `packages/**/src/**/*.ts`

**Business Value:**
- Improves maintainability and reviewability of the framework without large risky rewrites
- Lowers long-term cost of feature development by strengthening extension contracts
- Keeps lint/type-safety quality visibly improving between larger feature deliveries

---

## Current Hotspot Snapshot

Current `@typescript-eslint/no-explicit-any` baseline check (`pnpm lint:explicit-any:baseline`, 2026-03-16):

- Total: `324` warnings (`src/**`)
- By package: `core 128`, `tools 70`, `testing 51`, `patterns 50`, `cli 25`

Top runtime hotspots informing this feature slice:

1. `packages/patterns/src/react/nodes.ts` (10)
2. `packages/core/src/langgraph/builders/parallel.ts` (9)
3. `packages/patterns/src/shared/agent-builder.ts` (9)
4. `packages/tools/src/agent/ask-human/tool.ts` (8)
5. `packages/patterns/src/plan-execute/agent.ts` (4)

Follow-on modularization candidates:

- `packages/patterns/src/react/nodes.ts` is still `437` lines long, so a dedicated SRP-focused split remains worthwhile even as the explicit-`any` hotspot is being reduced.
- After the runtime split, `packages/patterns/tests/react/nodes.test.ts` should be reshaped to match the final module boundaries so reasoning/action/observation tests stay maintainable.

`ST-09002` removed `15` explicit-`any` warnings from `packages/core/src/langchain/converter.ts` and improved the `core` baseline from `176` to `161`.
`ST-09003` removed `13` explicit-`any` warnings from `packages/core/src/langgraph/state.ts` and improved the `core` baseline from `161` to `148`.
`ST-09004` removed `20` explicit-`any` warnings from `packages/core/src/langgraph/observability/logger.ts` and `packages/core/src/monitoring/alerts.ts`, improving the `core` baseline from `148` to `128`.

---

## Scope

### In Scope
- Runtime code hardening in `@agentforge/core` and `@agentforge/patterns`
- SOLID-oriented refactors that keep behavior unchanged while tightening contracts
- Focused test updates for touched modules
- Story-level documentation with before/after warning deltas

### Out of Scope
- Broad API redesigns that require breaking changes
- Full workspace elimination of explicit `any` in a single epic
- Large architecture rewrites spanning unrelated modules

---

## Story Coverage by Epic

- EP-09: ST-09001, ST-09002, ST-09003, ST-09004, ST-09005, ST-09006, ST-09007

---

## Validation and Rollout Expectations

- Maintain behavior parity for touched modules through focused tests plus full-suite verification
- Record warning deltas per story and avoid regressions against the global baseline gate
- Keep stories mergeable independently to support daily execution cadence
- Preserve public API compatibility unless explicitly called out in story documentation

---

## Related Planning Documents

- `planning/epics-and-stories.md` (EP-09 and ST-09001 through ST-09007)
- `planning/checklists/epic-09-story-tasks.md`
- `planning/kanban-queue.md`
- `scripts/no-explicit-any-baseline.json`
