# Feature Plan: SOLID Micro-Refactors and Type Boundary Hardening

**Epic Range:** EP-09 through EP-09
**Status:** In Progress
**Last Updated:** 2026-06-29
**Active Story:** ST-09077 - Stabilize Release-Time pnpm Validation Path (Ready)

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

Current `@typescript-eslint/no-explicit-any` baseline check (`pnpm lint:explicit-any:baseline`, 2026-06-12):

- Total: `84` warnings (`src/**`)
- By package: `cli 6`, `core 23`, `patterns 2`, `testing 0`, `tools 53`

Top runtime hotspots informing this feature slice:

1. Runtime files above the planning cutoff of `300` lines remain first-class modularization candidates, especially `packages/tools/src/data/relational/query/batch-executor.ts` (`367`), `packages/tools/src/data/relational/tools/relational-insert/executor.ts` (`365`), `packages/tools/src/data/relational/query/stream-executor.ts` (`359`), `packages/core/src/langgraph/middleware/caching.ts` (`342`), `packages/tools/src/data/neo4j/embeddings/embedding-manager.ts` (`332`), `packages/tools/src/data/relational/tools/relational-delete/executor.ts` (`324`), `packages/patterns/src/multi-agent/utils.ts` (`322`), `packages/skills/src/activation.ts` (`319`), `packages/tools/src/data/relational/tools/relational-update/executor.ts` (`319`), and `packages/core/src/resources/pool.ts` (`316`).
2. Their coupled test files are also oversized or tightly coupled and should be modularized in the same stories so production and verification boundaries stay aligned, especially `packages/core/src/langgraph/middleware/__tests__/caching.test.ts` (`280`), `packages/tools/tests/data/neo4j.test.ts` (`261`), `packages/patterns/tests/multi-agent/utils.test.ts` (`299`), `packages/skills/tests/activation.test.ts` (`618`), and the relational executor suites in `packages/tools/tests/data/relational/tools/`.
3. Modularization stories are only complete when they avoid the "shrink the facade, move the blob" failure mode: newly extracted production modules should also stay below the `300` line cutoff unless a documented exception is explicitly accepted in the story notes.
4. Shared-helper seams that still expose duplication or unsafe internal shortcuts remain valid follow-on slices when they can be tightened without changing behavior, especially the duplicated shared-cache wrapper logic and broad internal cache/error casts in `packages/core/src/langgraph/middleware/caching.ts`.
5. The next follow-on slices should keep EP-09 open for another short burst of small SOLID/DRY improvements rather than creating a new epic for the same quality lane.

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
- `ST-09036` removed two broad `agent: any` seams from `packages/testing/src/runners/conversation-simulator.ts`, improving the workspace baseline from `135` to `133` and the `testing` baseline from `5` to `3`.
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
- `ST-09032` merged after tightening the managed-tool lifecycle surface around unknown-first generic defaults, JSON-safe health metadata, typed LangChain interop, and lifecycle concurrency handling while lowering the workspace explicit-`any` baseline from `180` to `170` and the `core` package from `63` to `53`.
- `ST-09034` merged after tightening snapshot runner contracts around unknown-first state normalization, typed snapshot diffs, normalized message snapshots, plain-object-only recursive normalization, and non-plain root diffs in `@agentforge/testing`.
- `ST-09033` merged after tightening database pool adapter query parameter/result contracts around exported unknown-first aliases, lowering the workspace explicit-`any` baseline from `153` to `144` and the `core` package from `53` to `44`.
- `ST-09035` merged after tightening the agent test runner around exported unknown-first agent, state, result, and step contracts, lowering the workspace explicit-`any` baseline from `144` to `135` and the `testing` package from `14` to `5`, with follow-up fixes for timeout cleanup, malformed message guards, zero-timeout semantics, and validation-hook documentation accuracy.
- `ST-09036` through `ST-09040` were added on 2026-05-03 as small SOLID/DRY follow-on slices covering conversation simulator contracts, ReAct builder/prompt boundaries, data transformer helper extraction, core mock-tool testing contracts, and human-in-loop streaming resume typing.
- `ST-09036` merged on 2026-05-05 after tightening conversation simulator contracts around the shared `AgentTestAgent` and unknown-first message extraction seam, lowering the workspace explicit-`any` baseline from `135` to `133` and the `testing` package from `5` to `3`.
- `ST-09041` was added on 2026-05-05 to move `ConversationSimulator` verbose diagnostics from direct `console.log` calls onto the repo's structured logging path without changing simulator behavior.
- `ST-09040` merged on 2026-05-09 after tightening human-in-loop resume SSE payloads around the shared JSON-safe `InterruptPayload` contract, lowering the workspace explicit-`any` baseline from `106` to `104` and the `core` package from `35` to `33`.
- `ST-09041` merged on 2026-05-12 after moving `ConversationSimulator` verbose output onto the shared structured logger path, preserving opt-in turn emission semantics and absorbing a review follow-up to align logger naming with the repo convention.
- `ST-09042` through `ST-09047` were added on 2026-05-09 to keep the EP-09 queue stocked with the next small hardening slices across SSE formatter contracts, error reporter payloads, testing mock-tool factories, multi-agent routing decisions, and schema-level tool payload boundaries.
- `ST-09042` merged on 2026-05-13 after tightening the shared SSE formatter generics around unknown-first defaults, preserving retry, heartbeat, JSON fallback, and event sequencing behavior while lowering the workspace explicit-`any` baseline from `104` to `99` and the `core` package from `33` to `28`.
- `ST-09043` merged on 2026-05-15 after tightening error reporter state, metadata, and serialized payload contracts around unknown-first and JSON-safe boundaries, preserving runtime behavior while lowering the workspace explicit-`any` baseline from `99` to `94` and the `core` package from `28` to `23`.
- `ST-09044` merged on 2026-05-16 after tightening schema-driven mock-tool factory contracts, preserving delayed/error helper semantics while lowering the workspace explicit-`any` baseline from `94` to `91` and the `testing` package from `3` to `0`.
- `ST-09045` merged on 2026-05-17 after tightening the multi-agent routing decision boundary around schema-aligned structured output, preserving routing behavior while adding review-driven follow-up fixes for content-based fallback parsing, routing-specific parse diagnostics, structured-output compatibility fallbacks, warn-level observability, and a dedicated modularization follow-on story for the growing routing module and its coupled tests.
- `ST-09048` was added on 2026-05-17 to modularize `packages/patterns/src/multi-agent/routing.ts` and its coupled routing tests after the routing decision contract work, keeping both files from becoming the next oversized multi-responsibility hotspot.
- `ST-09048` merged on 2026-05-19 after reducing `packages/patterns/src/multi-agent/routing.ts` from `373` lines to a `51` line facade, extracting focused internal routing modules, and replacing the `538` line routing test monolith with focused strategy test files plus a shared fixture while keeping the explicit-`any` baseline flat at `workspace 90/289` and `patterns 2/28`.
- `ST-09046` merged on 2026-05-20 after replacing blanket transformer `z.any()` schema seams with shared unknown-first contracts, preserving array/object transformer runtime behavior through review-driven special-key hardening and output-shape compatibility fixes while keeping the explicit-`any` baseline flat at `workspace 90/289` and `tools 59/67`.
- `ST-09047` merged on 2026-05-21 after tightening JSON and HTTP payload schema boundaries, preserving JSON query/merge and HTTP helper behavior while incorporating review-driven array-guard and prototype-pollution hardening. This lowered the workspace explicit-`any` baseline from `90` to `84` and the `tools` package from `59` to `53`.
- `ST-09049` through `ST-09054` were added on 2026-05-19 to keep EP-09 stocked with modularization work driven by the new `300` line cutoff rule for runtime and test files, covering core tool registry/builder, multi-agent orchestration, relational query/connection management, and reflection nodes.
- `ST-09053` merged on 2026-05-28 after reducing `packages/tools/src/data/relational/connection/connection-manager.ts` from `640` lines to a `255` line public facade, then splitting the former `355` line runtime helper into focused initialization, cleanup, health, and runtime-type modules while replacing the connection-manager test monoliths with focused connection suites and keeping the explicit-`any` baseline flat at `workspace 84/289` and `tools 53/67`.
- `ST-09054` merged on 2026-05-29 after reducing `packages/patterns/src/reflection/nodes.ts` from `350` lines to a `13` line public facade, extracting focused generator, reflector, reviser, finisher, and shared-helper modules while replacing the reflection node test monolith with focused node suites and keeping the explicit-`any` baseline flat at `workspace 84/289` and `patterns 2/28`.
- `ST-09049` merged on 2026-05-22 after reducing `packages/core/src/tools/registry.ts` from `446` lines to a `107` line public facade, extracting focused query/mutation/type modules, and replacing the `832` line registry test monolith with focused API suites while keeping the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`.
- `ST-09055` through `ST-09060` were added on 2026-05-28 to keep EP-09 stocked with the next concrete modularization and schema-hardening slices, using the `300` line cutoff as an explicit trigger for runtime/test decomposition and reserving smaller stories for remaining unknown-first schema payload seams.
- `ST-09055` merged on 2026-06-04 after reducing `packages/tools/src/data/relational/schema/schema-inspector.ts` from `725` lines to a `126` line public facade, extracting focused shared, PostgreSQL, MySQL, and SQLite runtime helpers while replacing the schema-inspector test monolith with focused PostgreSQL, cache, and filter suites and keeping the explicit-`any` baseline flat at `workspace 84/289` and `tools 53/67`.
- `ST-09056` merged on 2026-06-05 after reducing `packages/skills/src/registry.ts` from `506` lines to a `101` line public facade, extracting focused discovery, event, prompt, query, and shared-type helpers while replacing the `419` line registry test monolith with focused discovery, query, event, and rescan suites. The story preserved `SkillRegistry` public behavior, absorbed review follow-ups for temp-dir cleanup, shared-type alignment, and documentation accuracy, and kept the explicit-`any` baseline flat at `workspace 84/289` and `skills 0/0`.
- `ST-09061` through `ST-09066` were added on 2026-06-05 to keep EP-09 stocked beyond the current lane with another modularization-first batch, prioritizing large runtime files in `core` and `patterns` before the remaining schema-hardening slices so future fixes land on smaller modules instead of monoliths.
- `ST-09058` merged on 2026-06-06 after shrinking `packages/core/src/tools/lifecycle.ts` from a `405` line mixed-responsibility runtime to an `11` line public facade, extracting focused managed-tool, hook, health, and shared-type modules, replacing the `574` line lifecycle test monolith with focused initialization, execution, cleanup, and health suites, and absorbing review follow-ups for direct implementation-type imports and cleaner internal initialize dependencies while keeping the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`.
- `ST-09059` merged on 2026-06-08 after tightening ReAct schema payload contracts around JSON-safe metadata, finite numeric metadata values, unknown-first tool payload seams, and package-enforced contract typechecks while keeping the explicit-`any` baseline flat at `workspace 84/289` and `patterns 2/28`.
- `ST-09060` merged on 2026-06-08 after tightening multi-agent schema payload contracts around JSON-safe metadata objects and unknown-first handoff context, then folding the review-driven shared JSON-safe helper extraction, plain-object enforcement, null-prototype map compatibility, and ReAct metadata documentation follow-up into the final PR while keeping the explicit-`any` baseline flat at `workspace 84/289` and `patterns 2/28`.
- `ST-09061` merged on 2026-06-10 after shrinking `packages/core/src/tools/types.ts` to a stable facade, splitting the coupled tests into focused suites behind the same public entrypoint, and absorbing follow-up typing and documentation accuracy fixes without changing queue readiness.
- `ST-09062` merged on 2026-06-11 after shrinking `packages/core/src/tools/executor.ts` from `356` lines to a roughly `175` line public facade, extracting focused retry, metrics, and shared-type helpers, replacing the executor test monolith with focused method-handling, retry-policy, and metrics suites, and absorbing review follow-ups for timeout cleanup, logger naming, tool-name compatibility, tracker/documentation accuracy, and the synchronous queue helper while keeping the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`.
- `ST-09063` merged on 2026-06-12 after shrinking `packages/patterns/src/multi-agent/nodes/worker.ts` from `357` lines to a `140` line public worker facade, extracting focused model-invocation, workload/error-bookkeeping, and shared worker-type helpers, then splitting the `1156` line multi-agent node test monolith into focused suites while absorbing review follow-ups for split-test imports, a flaky aggregator assertion, and a redundant worker-model cast with the explicit-`any` baseline flat at `workspace 84/289` and `patterns 2/28`.
- `ST-09067` through `ST-09074` were added on 2026-06-12 to replenish EP-09 beyond the current ready lane with another dependency-safe batch of modularization-first slices across relational batch/executor helpers, middleware caching, Neo4j embeddings, multi-agent utilities, and skill activation.
- `ST-09064` merged on 2026-06-13 after shrinking `packages/core/src/langgraph/middleware/presets.ts` from `365` lines to a small public facade, extracting focused logging, retry/timing, composition, and shared preset modules, and replacing the `286` line preset test monolith with focused suites while keeping the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`.
- `ST-09065` merged on 2026-06-13 after shrinking `packages/core/src/langgraph/state.ts` from `361` lines to a `13` line public facade, extracting focused state annotation, validation, merge, reducer/default, and shared-type helpers while replacing the `507` line `packages/core/tests/langgraph/state.test.ts` monolith with focused annotation, validation, merge, and workflow suites behind the same public entrypoint. The story preserved public state-helper behavior, kept the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`, and required no CI changes.
- `ST-09066` merged on 2026-06-16 after modularizing the shared resource pool runtime and test surface into focused helper modules and suites, preserving the public pooling facade while absorbing follow-up fixes for concurrent creation limits, teardown races, structured pool logging, and health-check callback error normalization with the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`.
- `ST-09067` merged on 2026-06-16 after shrinking `packages/tools/src/data/relational/query/batch-executor.ts` from a `367` line mixed-responsibility runtime to a `19` line public facade, extracting focused option, runtime, execution, benchmark, and shared-type modules while preserving public imports and batch behavior. The story also replaced the old batch-executor test monolith with a public entrypoint plus focused chunking, retry, failure, and benchmark suites, absorbed review follow-ups for non-discovered suite naming and documentation count accuracy, and kept the explicit-`any` baseline flat at `workspace 84/289` and `tools 53/67`.
- `ST-09068` merged on 2026-06-17 after shrinking `packages/core/src/langgraph/middleware/caching.ts` from a `342` line mixed-responsibility runtime to a `52` line public facade, extracting focused cache type, option-resolution, cache-store, entry-lifecycle, wrapper-flow, and shared-cache helpers while preserving public imports and runtime behavior. The story also replaced the old caching middleware test monolith with focused `withCache(...)` and shared-cache suites, absorbed review follow-ups for documentation accuracy, deterministic timer control, empty-string cache-key eviction, and refreshed line-count evidence, and improved the explicit-`any` baseline from `84/289` overall and `23/119` in `core` to `80/289` overall and `19/119` in `core`.
- `ST-09069` merged on 2026-06-18 after shrinking `packages/tools/src/data/neo4j/embeddings/embedding-manager.ts` from a `332` line mixed-responsibility runtime to a `151` line public facade, extracting focused provider-factory, environment-resolution, generation-flow, and shared-helper modules while preserving provider defaults, singleton initialization helpers, environment variable semantics, and public generation APIs. The story also replaced the old embedding-manager test surface with a public entrypoint plus focused initialization, provider-selection, and generation suites, absorbed review follow-ups for eager provider validation, empty-string environment-model fallback preservation, and tighter helper boundaries, and kept the explicit-`any` baseline flat at `workspace 80/289` and `tools 53/67`.
- `ST-09070` merged on 2026-06-23 after shrinking `packages/patterns/src/multi-agent/utils.ts` from a `322` line mixed-responsibility runtime to an `11` line public facade, extracting focused ReAct-agent detection, result-shape/serialization, shared runtime-guard, and wrapped worker-execution modules while preserving public imports, assignment selection, worker-specific checkpoint namespaces, response serialization, and wrapped error handling. The story also replaced the monolithic utility test surface with a public entrypoint plus focused detection and wrap-agent suites, absorbed the characterization-fixture follow-up for the constructor-name detection guard, and kept the explicit-`any` baseline flat at `workspace 80/289` and `patterns 2/28`.
- `ST-09071` merged on 2026-06-24 after shrinking `packages/skills/src/activation.ts` from a `319` line mixed-responsibility runtime to a `46` line public facade, extracting focused activation-tool, resource-tool, path-guard, content, shared-helper, and schema modules while preserving the public activation API, trust-policy decisions, emitted events, and imports. The story also replaced the monolithic activation test surface with focused activation-tools, activate-skill, read-skill-resource, and resolve-resource-path suites, absorbed the symlink-fixture cleanup follow-up before merge, and kept the explicit-`any` baseline flat at `workspace 80/289` and `skills 0/0`.
- `ST-09072` merged on 2026-06-25 after shrinking `packages/tools/src/data/relational/tools/relational-insert/executor.ts` from `365` lines to a `91` line public facade, extracting focused shared normalization/defaulting, single-query execution, and batch orchestration helpers while preserving `executeInsert(...)`, batch semantics, benchmark metadata, transaction routing, inserted-id derivation, and error handling. The story also replaced the monolithic insert-executor test body with focused result-shaping, batch-mode, and error-handling suites and kept the explicit-`any` baseline flat at `workspace 80/289` and `tools 53/67`.
- `ST-09073` merged on 2026-06-27 after shrinking `packages/tools/src/data/relational/tools/relational-update/executor.ts` from a `319` line mixed-responsibility runtime to a `92` line public facade, extracting focused shared normalization/defaulting, single-query execution, and batch orchestration helpers while preserving `executeUpdate(...)`, batch semantics, optimistic-lock behavior, benchmark metadata, transaction routing, and error handling. The story also replaced the monolithic update-executor test body with focused result-shaping, batch-mode, and error-handling suites, kept the explicit-`any` baseline flat at `workspace 80/289` and `tools 53/67`, and advanced the ready lane to `ST-09074`.
- `ST-09074` merged on 2026-06-28 after shrinking `packages/tools/src/data/relational/tools/relational-delete/executor.ts` from a `324` line mixed-responsibility runtime to a `97` line public facade, extracting focused shared normalization/defaulting, single-query execution, and batch orchestration helpers while preserving `executeDelete(...)`, soft-delete semantics, benchmark metadata, transaction routing, and error handling. The story also replaced the monolithic delete-executor test body with focused result-shaping, batch-mode, and error-handling suites, kept the explicit-`any` baseline flat at `workspace 80/289` and `tools 53/67`, and left `ST-09075` plus `ST-09076` as the next dependency-ready ready-lane stories.
- `ST-09075` through `ST-09076` were added on 2026-06-23 as targeted follow-on hardening slices so the post-review concerns from `ST-09070` land as explicit backlog work instead of lingering as undocumented debt. These stories keep EP-09 focused on small, behavior-aware robustness improvements without pulling attention away from the current ready modularization lane.
- `ST-09077` was added on 2026-06-29 after the `0.16.61` patch release exposed that the documented `pnpm build`/`pnpm test` release-validation path can still be interrupted by environment/policy preflight before the real build runs. The story captures that release-process friction as explicit EP-09 hardening work instead of leaving the workaround tribal.
- `EP-09` remains open as the daily hardening stream, with `ST-09075` and `ST-09076` now at the front of the ready lane after `ST-09074` merged.
- `ST-09077` was promoted to the front of the ready lane on 2026-06-29 because the release-process friction is now a higher-priority maintainer pain point than the two remaining patterns follow-up slices.
- The refreshed follow-on queue now extends beyond the current Ready lane so another few weeks of small SOLID/DRY and modularization work can be pulled without re-planning the epic.

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

- EP-09: ST-09001, ST-09002, ST-09003, ST-09004, ST-09005, ST-09006, ST-09007, ST-09008, ST-09009, ST-09010, ST-09011, ST-09012, ST-09013, ST-09014, ST-09015, ST-09016, ST-09017, ST-09018, ST-09019, ST-09020, ST-09021, ST-09022, ST-09023, ST-09024, ST-09025, ST-09026, ST-09027, ST-09028, ST-09029, ST-09030, ST-09031, ST-09032, ST-09033, ST-09034, ST-09035, ST-09036, ST-09037, ST-09038, ST-09039, ST-09040, ST-09041, ST-09042, ST-09043, ST-09044, ST-09045, ST-09046, ST-09047, ST-09048, ST-09049, ST-09050, ST-09051, ST-09052, ST-09053, ST-09054, ST-09055, ST-09056, ST-09057, ST-09058, ST-09059, ST-09060, ST-09061, ST-09062, ST-09063, ST-09064, ST-09065, ST-09066, ST-09067, ST-09068, ST-09069, ST-09070, ST-09071, ST-09072, ST-09073, ST-09074, ST-09075, ST-09076, ST-09077

---

## Validation and Rollout Expectations

- Maintain behavior parity for touched modules through focused tests plus full-suite verification
- Record warning deltas per story and avoid regressions against the global baseline gate
- Keep stories mergeable independently to support daily execution cadence
- Preserve public API compatibility unless explicitly called out in story documentation
- Treat build/release warning cleanup as complete only when `pnpm build` output is cleaner and documented

---

## Related Planning Documents

- `planning/epics-and-stories.md` (EP-09 and ST-09001 through ST-09077)
- `planning/checklists/epic-09-story-tasks.md`
- `planning/kanban-queue.md`
- `scripts/no-explicit-any-baseline.json`
