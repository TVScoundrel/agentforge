# Feature Plan: SOLID Micro-Refactors and Type Boundary Hardening

**Epic Range:** EP-09 through EP-09
**Status:** In Progress
**Last Updated:** 2026-03-23
**Active Story:** ST-09013 (In Review)

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

Current `@typescript-eslint/no-explicit-any` baseline check (`pnpm lint:explicit-any:baseline`, 2026-03-23):

- Total: `289` warnings (`src/**`)
- By package: `core 119`, `tools 67`, `testing 51`, `patterns 28`, `cli 24`

Top runtime hotspots informing this feature slice:

1. `packages/core/src/langgraph/builders/sequential.ts` still carries an easy schema/edge `any` boundary that mirrors the already-completed parallel builder cleanup
2. `packages/patterns/src/plan-execute/types.ts` still exposes a small but high-leverage `Tool<any, any>[]` boundary in active EP-09 code
3. `packages/patterns/src/multi-agent/nodes.ts` remains a large mixed-responsibility module (`632` lines) and is a clear modularization candidate
4. `packages/core/src/monitoring/audit.ts` and `packages/core/src/monitoring/health.ts` still expose broad payload `any` fields in released monitoring contracts
5. `packages/cli/src/commands/**` still repeat command-level `catch (error: any)` handling in multiple entrypoints
6. `packages/testing/src/helpers/assertions.ts` and `packages/testing/src/helpers/state-builder.ts` still concentrate a large share of the remaining `testing` package `any` warnings
7. `packages/core/src/prompt-loader/index.ts`, `packages/core/src/streaming/websocket.ts`, and `packages/patterns/src/reflection/agent.ts` form the next small runtime boundary-hardening slice
8. `packages/core/src/tools/registry.ts` and `packages/tools/src/data/relational/connection/connection-manager.ts` remain larger SRP targets that need multi-story decomposition rather than one oversized cleanup

Recent improvement snapshot:

- `ST-09002` removed `15` explicit-`any` warnings from `packages/core/src/langchain/converter.ts` and improved the `core` baseline from `176` to `161`.
- `ST-09003` removed `13` explicit-`any` warnings from `packages/core/src/langgraph/state.ts` and improved the `core` baseline from `161` to `148`.
- `ST-09004` removed `20` explicit-`any` warnings from `packages/core/src/langgraph/observability/logger.ts` and `packages/core/src/monitoring/alerts.ts`, improving the `core` baseline from `148` to `128`.
- `ST-09005` removed `19` explicit-`any` warnings from `packages/patterns/src/react/nodes.ts` and `packages/patterns/src/shared/agent-builder.ts`, improving the workspace baseline from `324` to `305` and the `patterns` baseline from `50` to `31`.
- `ST-09008` reduced explicit-`any` warnings in `packages/core/src/langgraph/builders/parallel.ts`, improving the workspace baseline from `304` to `295` and the `core` baseline from `128` to `119`.
- `ST-09009` has reduced explicit-`any` warnings in `packages/tools/src/agent/ask-human/tool.ts` from `3` to `0` so far, improving the workspace baseline from `295` to `292` and the `tools` baseline from `70` to `67`.
- `ST-09010` has reduced explicit-`any` warnings in `packages/patterns/src/plan-execute/agent.ts` from `3` to `0`, improving the workspace baseline from `292` to `289` and the `patterns` baseline from `31` to `28`.
- `ST-09011` tightened the committed explicit-`any` baseline caps from `496` to the current measured `289`, aligning the no-regression gate with the post-EP-09 warning floor.
- `ST-09012` removed the remaining `exports.types` ordering warnings from `@agentforge/skills`, `@agentforge/tools`, and `@agentforge/testing`, quieting the routine build output without changing published entrypoint targets.
- `EP-09` remains open as the daily hardening stream, with the next follow-on slice targeting sequential builder typing, plan-execute shared contracts, monitoring payloads, CLI error handling, testing helpers, and multi-agent modularization.
- A second follow-on slice is now queued for prompt loading, reflection routing, streaming websocket contracts, shared deduplication helpers, core tool builder typing, interrupt contracts, and split-out registry/connection-manager modularization.

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

- EP-09: ST-09001, ST-09002, ST-09003, ST-09004, ST-09005, ST-09006, ST-09007, ST-09008, ST-09009, ST-09010, ST-09011, ST-09012, ST-09013, ST-09014, ST-09015, ST-09016, ST-09017, ST-09018, ST-09019, ST-09020, ST-09021, ST-09022, ST-09023, ST-09024, ST-09025, ST-09026, ST-09027, ST-09028

---

## Validation and Rollout Expectations

- Maintain behavior parity for touched modules through focused tests plus full-suite verification
- Record warning deltas per story and avoid regressions against the global baseline gate
- Keep stories mergeable independently to support daily execution cadence
- Preserve public API compatibility unless explicitly called out in story documentation
- Treat build/release warning cleanup as complete only when `pnpm build` output is cleaner and documented

---

## Related Planning Documents

- `planning/epics-and-stories.md` (EP-09 and ST-09001 through ST-09028)
- `planning/checklists/epic-09-story-tasks.md`
- `planning/kanban-queue.md`
- `scripts/no-explicit-any-baseline.json`
