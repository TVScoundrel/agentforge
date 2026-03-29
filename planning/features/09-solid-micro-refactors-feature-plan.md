# Feature Plan: SOLID Micro-Refactors and Type Boundary Hardening

**Epic Range:** EP-09 through EP-09
**Status:** In Progress
**Last Updated:** 2026-03-29
**Active Story:** ST-09018 (In Review)

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

Current `@typescript-eslint/no-explicit-any` baseline check (`pnpm lint:explicit-any:baseline`, 2026-03-29):

- Total: `233` warnings (`src/**`)
- By package: `core 106`, `tools 67`, `testing 31`, `patterns 23`, `cli 6`

Top runtime hotspots informing this feature slice:

1. `packages/core/src/langgraph/builders/sequential.ts` still carries an easy schema/edge `any` boundary that mirrors the already-completed parallel builder cleanup
2. `packages/patterns/src/plan-execute/types.ts` still exposes a small but high-leverage `Tool<any, any>[]` boundary in active EP-09 code
3. `packages/patterns/src/multi-agent/nodes.ts` was split behind the stable public entrypoint in `ST-09015`, with follow-up hardening landed for log redaction, workload invariants, interrupt propagation, and model-content serialization
4. `ST-09017` has centralized repeated CLI command-level `catch (error: any)` handling behind a shared helper and is now merged
5. `ST-09018` has tightened `packages/testing/src/helpers/assertions.ts` and `packages/testing/src/helpers/state-builder.ts`, reducing the `testing` package warning floor from `51` to `31` and is now in review
6. `packages/core/src/prompt-loader/index.ts`, `packages/core/src/streaming/websocket.ts`, and `packages/patterns/src/reflection/agent.ts` form the next small runtime boundary-hardening slice after the testing-helper cleanup
7. `packages/core/src/tools/registry.ts` and `packages/tools/src/data/relational/connection/connection-manager.ts` remain larger SRP targets that need multi-story decomposition rather than one oversized cleanup
8. `packages/patterns/src/plan-execute/nodes.ts` has grown into a larger mixed-responsibility module and has become the next plan-execute modularization target after the ST-09014 shared contract cleanup

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
- `ST-09013` merged with an intentional breaking tightening to the sequential workflow builder contract: explicit state generics were removed, and downstream callers must rely on schema-derived inference from `Annotation.Root(...)`.
- `ST-09014` merged after tightening the shared plan-execute tool and schema boundaries, lowering the workspace explicit-`any` baseline from `289` to `278` and the `patterns` package from `28` to `25`.
- `ST-09015` merged after splitting the multi-agent node runtime into focused supervisor, worker, aggregator, and shared helper modules, lowering the workspace explicit-`any` baseline from `278` to `276` and the `patterns` package from `25` to `23`.
- `ST-09016` merged after tightening the audit/health monitoring payload contracts, lowering the workspace explicit-`any` baseline from `276` to `271` and the `core` package from `111` to `106`, with follow-up fixes for falsy JSON payload retention, structured startup logging, and explicit zero timestamps.
- `ST-09017` merged after centralizing CLI command error handling, lowering the workspace explicit-`any` baseline from `271` to `253` and the `cli` package from `24` to `6`, with follow-up fixes for preserved output ordering, spinner sequencing, and a `never`-typed shared exit helper.
- `ST-09018` is in review after tightening the shared testing assertion and state-builder helpers, lowering the workspace explicit-`any` baseline from `253` to `233` and the `testing` package from `51` to `31` while adding focused runtime tests plus source-included type regressions.
- `EP-09` remains open as the daily hardening stream, with the next follow-on slice now centered on testing helper hardening, plan-execute node modularization, prompt-loading contracts, reflection routing, and the larger registry/connection-manager split work.
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

- EP-09: ST-09001, ST-09002, ST-09003, ST-09004, ST-09005, ST-09006, ST-09007, ST-09008, ST-09009, ST-09010, ST-09011, ST-09012, ST-09013, ST-09014, ST-09015, ST-09016, ST-09017, ST-09018, ST-09019, ST-09020, ST-09021, ST-09022, ST-09023, ST-09024, ST-09025, ST-09026, ST-09027, ST-09028, ST-09029

---

## Validation and Rollout Expectations

- Maintain behavior parity for touched modules through focused tests plus full-suite verification
- Record warning deltas per story and avoid regressions against the global baseline gate
- Keep stories mergeable independently to support daily execution cadence
- Preserve public API compatibility unless explicitly called out in story documentation
- Treat build/release warning cleanup as complete only when `pnpm build` output is cleaner and documented

---

## Related Planning Documents

- `planning/epics-and-stories.md` (EP-09 and ST-09001 through ST-09029)
- `planning/checklists/epic-09-story-tasks.md`
- `planning/kanban-queue.md`
- `scripts/no-explicit-any-baseline.json`
