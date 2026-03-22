# Feature Plan: SOLID Micro-Refactors and Type Boundary Hardening

**Epic Range:** EP-09 through EP-09
**Status:** In Progress
**Last Updated:** 2026-03-22
**Active Story:** ST-09009 (In Progress)

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
- The explicit-`any` baseline continues to trend down while the committed no-regression cap is tightened to match actual improvements
- Release/build feedback becomes quieter and more actionable by removing easy package metadata warnings

**Business Value:**
- Improves maintainability and reviewability of the framework without large risky rewrites
- Lowers long-term cost of feature development by strengthening extension contracts
- Keeps lint/type-safety quality visibly improving between larger feature deliveries

---

## Current Hotspot Snapshot

Current `@typescript-eslint/no-explicit-any` baseline check (`pnpm lint:explicit-any:baseline`, 2026-03-22):

- Total: `292` warnings (`src/**`)
- By package: `core 119`, `tools 67`, `testing 51`, `patterns 31`, `cli 24`

Top runtime hotspots informing this feature slice:

1. `packages/tools/src/agent/ask-human/tool.ts` (5)
2. `packages/patterns/src/plan-execute/agent.ts` (4)
3. `scripts/no-explicit-any-baseline.json` still allows the pre-EP-09 cap of `496` total warnings despite the current `292`
4. `packages/skills/package.json`, `packages/tools/package.json`, and `packages/testing/package.json` still emit `exports.types` ordering warnings during `pnpm build`

Recent improvement snapshot:

- `ST-09002` removed `15` explicit-`any` warnings from `packages/core/src/langchain/converter.ts` and improved the `core` baseline from `176` to `161`.
- `ST-09003` removed `13` explicit-`any` warnings from `packages/core/src/langgraph/state.ts` and improved the `core` baseline from `161` to `148`.
- `ST-09004` removed `20` explicit-`any` warnings from `packages/core/src/langgraph/observability/logger.ts` and `packages/core/src/monitoring/alerts.ts`, improving the `core` baseline from `148` to `128`.
- `ST-09005` removed `19` explicit-`any` warnings from `packages/patterns/src/react/nodes.ts` and `packages/patterns/src/shared/agent-builder.ts`, improving the workspace baseline from `324` to `305` and the `patterns` baseline from `50` to `31`.
- `ST-09008` reduced explicit-`any` warnings in `packages/core/src/langgraph/builders/parallel.ts`, improving the workspace baseline from `304` to `295` and the `core` baseline from `128` to `119`.
- `ST-09009` has reduced explicit-`any` warnings in `packages/tools/src/agent/ask-human/tool.ts` from `3` to `0` so far, improving the workspace baseline from `295` to `292` and the `tools` baseline from `70` to `67`.
- The current baseline check now reports `292` warnings total and `cli 24`, so the committed caps are stale and worth tightening in a follow-up story.

---

## Scope

### In Scope
- Runtime code hardening in `@agentforge/core` and `@agentforge/patterns`
- Targeted runtime code hardening in `@agentforge/tools`
- SOLID-oriented refactors that keep behavior unchanged while tightening contracts
- Focused test updates for touched modules
- Story-level documentation with before/after warning deltas
- Small quality-gate follow-ups that keep lint/build/release verification aligned with the current codebase

### Out of Scope
- Broad API redesigns that require breaking changes
- Full workspace elimination of explicit `any` in a single epic
- Large architecture rewrites spanning unrelated modules

---

## Story Coverage by Epic

- EP-09: ST-09001, ST-09002, ST-09003, ST-09004, ST-09005, ST-09006, ST-09007, ST-09008, ST-09009, ST-09010, ST-09011, ST-09012

---

## Validation and Rollout Expectations

- Maintain behavior parity for touched modules through focused tests plus full-suite verification
- Record warning deltas per story and avoid regressions against the global baseline gate
- Keep stories mergeable independently to support daily execution cadence
- Preserve public API compatibility unless explicitly called out in story documentation
- Treat build/release warning cleanup as complete only when `pnpm build` output is cleaner and documented

---

## Related Planning Documents

- `planning/epics-and-stories.md` (EP-09 and ST-09001 through ST-09012)
- `planning/checklists/epic-09-story-tasks.md`
- `planning/kanban-queue.md`
- `scripts/no-explicit-any-baseline.json`
