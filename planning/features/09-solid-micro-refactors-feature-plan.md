# Feature Plan: SOLID Micro-Refactors and Type Boundary Hardening

**Epic Range:** EP-09 through EP-09
**Status:** In Progress
**Last Updated:** 2026-04-23
**Active Story:** ST-09032 (Ready)

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

Current `@typescript-eslint/no-explicit-any` baseline check (`pnpm lint:explicit-any:baseline`, 2026-04-16):

- Total: `180` warnings (`src/**`)
- By package: `core 63`, `tools 65`, `testing 31`, `patterns 15`, `cli 6`

Top runtime hotspots informing this feature slice:

1. `packages/tools/src/data/relational/connection/connection-manager.ts` still couples lifecycle, reconnection, query execution, session handling, metrics, and health checks even after ST-09027 extracted vendor initialization
2. `packages/core/src/tools/registry.ts` still carries public registration, mutation, and prompt option shaping responsibilities after the collection/prompt/event helper splits
3. `packages/core/src/tools/lifecycle.ts` remains one of the largest remaining core explicit-`any` hotspots and mixes lifecycle hooks, health checks, stats, and LangChain interop behind broad generic defaults
4. `packages/core/src/resources/database-pool.ts` still exposes broad connection and query parameter contracts behind a mock adapter surface that is small enough for a focused hardening pass
5. `packages/testing/src/runners/snapshot-testing.ts` is the largest remaining testing-package explicit-`any` hotspot and is a good fit for a standalone unknown-first state normalization story
6. `packages/testing/src/runners/agent-test-runner.ts` still exposes broad agent/state/step contracts and is a natural follow-on once snapshot/state runner contracts are tightened
7. `ST-09030` merged the connection-manager execution/session extraction slice, and the next active extraction target is the tool-registry registration/mutation split in `ST-09031`
8. The next follow-on slice should keep EP-09 open for one more short burst rather than creating a new epic before the remaining runtime and testing hotspots are sequenced

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
- `ST-09018` merged after tightening the shared testing assertion and state-builder helpers, lowering the workspace explicit-`any` baseline from `253` to `233` and the `testing` package from `51` to `31` while adding focused runtime tests plus source-included type regressions.
- `ST-09019` merged after tightening the reflection agent factory around typed route maps and direct compile inference, lowering the workspace explicit-`any` baseline from `233` to `229` and the `patterns` package from `23` to `19`.
- `ST-09020` merged after tightening the prompt-loader variable contracts around unknown-first trusted/untrusted maps, lowering the workspace explicit-`any` baseline from `229` to `219` and the `core` package from `106` to `96`, with follow-up fixes for null-prototype map handling, own-property option detection, and documented own-enumerable compatibility boundaries.
- `ST-09021` merged after tightening the streaming WebSocket helper contracts around structural socket types and unknown-first payload handling, lowering the workspace explicit-`any` baseline from `219` to `205` and the `core` package from `96` to `82`.
- `ST-09022` merged after tightening the shared deduplication helper contracts around unknown-first normalization and null-prototype cache-key handling, lowering the workspace explicit-`any` baseline from `205` to `201` and the `patterns` package from `19` to `15`.
- `ST-09023` merged after tightening the core tool builder fluent typing surface, lowering the workspace explicit-`any` baseline from `201` to `195` and the `core` package from `82` to `76`, with follow-up fixes for branched metadata isolation, clone-failure messaging, and `this`-binding compatibility.
- `ST-09024` merged after tightening the LangGraph interrupt contracts around JSON-safe custom payloads, JSON-object metadata, and safer resume values, lowering the workspace explicit-`any` baseline from `195` to `182` and the `core` package from `76` to `63`.
- `ST-09027` merged after extracting relational connection-manager vendor initialization into focused PostgreSQL/MySQL/SQLite helper adapters, lowering the workspace explicit-`any` baseline from `182` to `180` and the `tools` package from `67` to `65`, with follow-up fixes for logger attribution and vendor/connection type pairing.
- `ST-09029` merged after modularizing the plan-execute node layer into focused planner, executor, replanner, finisher, logger, and serialization helpers behind the stable public facade, with review-driven follow-up fixes for structured and array-based model-content normalization, finisher response compatibility, prompt formatting, undefined serialization semantics, and GraphInterrupt propagation.
- `ST-09030` merged after extracting relational connection-manager query execution and dedicated-session adapter handling into focused helpers, preserving MySQL tuple normalization, SQLite non-query normalization, and dedicated PostgreSQL/MySQL session behavior while leaving the workspace explicit-`any` baseline unchanged at `180` and `tools` unchanged at `65`.
- `ST-09031` merged after extracting the remaining tool-registry registration, update, removal, bulk-registration, and clear paths into a focused internal helper while preserving the stable public facade, mutation error semantics, and emitted events, and the next active Epic 9 target is `ST-09032`.
- `EP-09` remains open as the daily hardening stream, with the active queue now centered on tool-registry extraction, lifecycle hardening, and the remaining testing-contract follow-ons.
- A fresh follow-on slice is now queued behind that work for connection-manager execution/session extraction, registry registration/mutation extraction, managed-tool lifecycle hardening, database-pool contract tightening, and testing runner type-boundary cleanup.

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

- EP-09: ST-09001, ST-09002, ST-09003, ST-09004, ST-09005, ST-09006, ST-09007, ST-09008, ST-09009, ST-09010, ST-09011, ST-09012, ST-09013, ST-09014, ST-09015, ST-09016, ST-09017, ST-09018, ST-09019, ST-09020, ST-09021, ST-09022, ST-09023, ST-09024, ST-09025, ST-09026, ST-09027, ST-09028, ST-09029, ST-09030, ST-09031, ST-09032, ST-09033, ST-09034, ST-09035

---

## Validation and Rollout Expectations

- Maintain behavior parity for touched modules through focused tests plus full-suite verification
- Record warning deltas per story and avoid regressions against the global baseline gate
- Keep stories mergeable independently to support daily execution cadence
- Preserve public API compatibility unless explicitly called out in story documentation
- Treat build/release warning cleanup as complete only when `pnpm build` output is cleaner and documented

---

## Related Planning Documents

- `planning/epics-and-stories.md` (EP-09 and ST-09001 through ST-09035)
- `planning/checklists/epic-09-story-tasks.md`
- `planning/kanban-queue.md`
- `scripts/no-explicit-any-baseline.json`
