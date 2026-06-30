# Done Stories Archive

**Purpose:** Track completed and merged stories for the Relational Database Access Tool project.

**Last Updated:** 2026-06-30

---

## Completed Stories

### ST-09076: Align Wrapped ReAct Error Assignment Selection
- **Merged:** 2026-06-30
- **PR:** https://github.com/TVScoundrel/agentforge/pull/146 (commit 3e713735)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 2 hours
- **Outcome:** Aligned `wrapReActAgent(...)` so both success and error branches resolve through the same incomplete-assignment selector in `packages/patterns/src/multi-agent/utils-react-wrapper.ts`, preventing wrapped worker failures from targeting already-completed assignments when an active assignment still exists for the same worker. The story added a focused regression in the wrapped multi-agent utility suite, documented the compatibility rationale in `docs/st09076-wrap-react-error-assignment-alignment.md`, and removed the remaining full-suite review blocker by adding explicit timeout headroom to the three known cold-start-sensitive tests while keeping the explicit-`any` baseline flat at `workspace 80/289` and `patterns 2/28`.

### ST-09075: Harden ReAct Agent Detection Beyond Constructor Names
- **Merged:** 2026-06-29
- **PR:** https://github.com/TVScoundrel/agentforge/pull/145 (commit c553a9ba)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Hardened `@agentforge/patterns` ReAct-agent detection by replacing constructor-name-only gating in `packages/patterns/src/multi-agent/utils-react-detection.ts` with layered compiled-LangGraph runtime-shape checks while preserving constructor-name fallback compatibility for lightweight wrappers. The story added a regression test that uses a real compiled ReAct agent with a masked constructor name, documented the compatibility rationale in `docs/st09075-react-agent-detection-hardening.md`, kept the explicit-`any` baseline flat at `workspace 80/289` and `patterns 2/28`, and advanced the ready lane to `ST-09076`.

### ST-09077: Stabilize Release-Time pnpm Validation Path
- **Merged:** 2026-06-28
- **PR:** https://github.com/TVScoundrel/agentforge/pull/144 (commit 99f91adf)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Stabilized the canonical release-time maintainer validation path by committing the required `pnpm-workspace.yaml` build approvals, adding a shared approval validator plus repo-level guard script/tests, switching the root `test` script to non-watch `vitest run`, and standardizing the release documentation and helper script on `pnpm release:validate`. The story preserved the underlying `pnpm build` plus `pnpm test` flow, kept publish/sign/tag/smoke-test behavior unchanged, and left `ST-09075` plus `ST-09076` as the next deterministic ready-lane stories.

### ST-09074: Modularize Relational Delete Executor and Tests
- **Merged:** 2026-06-28
- **PR:** https://github.com/TVScoundrel/agentforge/pull/143 (commit 2b6dab8a)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/tools` relational delete execution by shrinking `packages/tools/src/data/relational/tools/relational-delete/executor.ts` from a `324` line mixed-responsibility runtime to a `97` line public facade, extracting focused shared normalization/defaulting, single-query execution, and batch orchestration modules while preserving the public `executeDelete(...)` surface, soft-delete semantics, synthetic benchmark metadata, transaction routing, and error handling. The story also replaced the monolithic delete-executor test body with a public entrypoint plus focused result-shaping, batch-mode, and error-handling suites, corrected the review-raised explicit-`any` evidence to the comparable `workspace 80/289` and `tools 53/67` baseline, and left `ST-09075` plus `ST-09076` as the next dependency-ready ready-lane stories.

### ST-09073: Modularize Relational Update Executor and Tests
- **Merged:** 2026-06-27
- **PR:** https://github.com/TVScoundrel/agentforge/pull/142 (commit 9aa32e8c)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/tools` relational update execution by shrinking `packages/tools/src/data/relational/tools/relational-update/executor.ts` from a `319` line mixed-responsibility runtime to a `92` line public facade, extracting focused shared normalization/defaulting, single-query execution, and batch orchestration modules while preserving the public `executeUpdate(...)` surface, batch semantics, optimistic-lock behavior, synthetic benchmark metadata, transaction routing, and error handling. The story also replaced the monolithic update-executor test body with a public entrypoint plus focused result-shaping, batch-mode, and error-handling suites, kept the explicit-`any` baseline flat at `workspace 80/289` and `tools 53/67`, and advanced the ready lane to `ST-09074` because no additional dependency grooming was required.

### ST-09072: Modularize Relational Insert Executor and Tests
- **Merged:** 2026-06-25
- **PR:** https://github.com/TVScoundrel/agentforge/pull/141 (commit 8df274a7)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/tools` relational insert execution by shrinking `packages/tools/src/data/relational/tools/relational-insert/executor.ts` from a `365` line mixed-responsibility runtime to a `91` line public facade, extracting focused shared normalization/defaulting, single-query execution, and batch orchestration modules while preserving the public `executeInsert(...)` surface, batch semantics, synthetic benchmark metadata, transaction routing, inserted-id derivation, and error handling. The story also replaced the monolithic insert-executor test body with a public entrypoint plus focused result-shaping, batch-mode, and error-handling suites, kept the explicit-`any` baseline flat at `workspace 80/289` and `tools 53/67`, and required no additional queue grooming because `ST-09073` through `ST-09076` were already dependency-ready in `Ready`.

### ST-09071: Modularize Skill Activation Runtime and Tests
- **Merged:** 2026-06-24
- **PR:** https://github.com/TVScoundrel/agentforge/pull/140 (commit b78af7e2)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/skills` activation handling by shrinking `packages/skills/src/activation.ts` from a `319` line mixed-responsibility runtime to a `46` line public facade, extracting focused activation-tool, resource-tool, path-guard, content, shared-helper, and schema modules while preserving `createActivateSkillTool`, `createReadSkillResourceTool`, `createSkillActivationTools`, `resolveResourcePath`, trust-policy decisions, emitted events, and public imports. The story also replaced the monolithic activation test surface with a public entrypoint plus focused activation-tools, activate-skill, read-skill-resource, and resolve-resource-path suites, absorbed the symlink-fixture cleanup follow-up before merge, kept the explicit-`any` baseline flat at `workspace 80/289` and `skills 0/0`, and promoted `ST-09075` plus `ST-09076` from `Backlog` to `Ready` because their `ST-09070` dependency was already merged.

### ST-09070: Modularize Multi-Agent Utilities and Tests
- **Merged:** 2026-06-23
- **PR:** https://github.com/TVScoundrel/agentforge/pull/139 (commit 3c6fe3a8)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/patterns` multi-agent utility handling by shrinking `packages/patterns/src/multi-agent/utils.ts` from a `322` line mixed-responsibility runtime to an `11` line public facade, extracting focused ReAct-agent detection, result-shape/serialization, shared runtime-guard, and wrapped worker-execution modules while preserving public imports, assignment selection, worker-specific checkpoint namespaces, response serialization, and wrapped error handling. The story also replaced the monolithic utility test surface with a public entrypoint plus focused detection and wrap-agent suites, absorbed the characterization-fixture follow-up for the constructor-name detection guard, and kept the explicit-`any` baseline flat at `workspace 80/289` and `patterns 2/28`.

### ST-09069: Modularize Neo4j Embedding Manager and Tests
- **Merged:** 2026-06-18
- **PR:** https://github.com/TVScoundrel/agentforge/pull/138 (commit db08fff7)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/tools` embedding management by shrinking `packages/tools/src/data/neo4j/embeddings/embedding-manager.ts` from a `332` line mixed-responsibility runtime to a `151` line public facade, extracting focused provider-factory, environment-resolution, generation-flow, and shared-helper modules while preserving provider defaults, environment variable semantics, singleton initialization helpers, and public generation APIs. The story also replaced the old embedding-manager test surface with a public entrypoint plus focused initialization, provider-selection, and generation suites, absorbed review follow-ups for eager provider validation, empty-string environment-model fallback preservation, and tighter helper boundaries, and kept the explicit-`any` baseline flat at `workspace 80/289` and `tools 53/67`.

### ST-09068: Modularize LangGraph Caching Middleware and Tests
- **Merged:** 2026-06-17
- **PR:** https://github.com/TVScoundrel/agentforge/pull/137 (commit 7972b7f6)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/core` caching middleware by shrinking `packages/core/src/langgraph/middleware/caching.ts` from a `342` line mixed-responsibility runtime to a `52` line public facade, extracting focused cache type, option-resolution, cache-store, entry-lifecycle, wrapper-flow, and shared-cache helpers while preserving `withCache(...)`, `createSharedCache(...)`, public imports, callback hooks, and caching behavior. The story also replaced the old caching test monolith with focused `withCache(...)` and shared-cache suites behind the same public entrypoint, absorbed review follow-ups for documentation accuracy, type-only imports, deterministic timer control, empty-string cache-key eviction, and refreshed story-doc evidence, and improved the explicit-`any` baseline from `84/289` overall and `23/119` in `core` to `80/289` overall and `19/119` in `core`.

### ST-09067: Modularize Relational Batch Executor and Tests
- **Merged:** 2026-06-16
- **PR:** https://github.com/TVScoundrel/agentforge/pull/136 (commit 7421d92c)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/tools` batch execution by shrinking `packages/tools/src/data/relational/query/batch-executor.ts` from a `367` line mixed-responsibility runtime to a `19` line public facade, extracting focused option validation/chunking, runtime helpers, execution flow, benchmark logic, and shared batch types while preserving public imports, progress callbacks, failure semantics, and benchmark behavior. The story also replaced the old batch-executor test monolith with a public entrypoint plus focused chunking, retry, failure, and benchmark suites, absorbed review follow-ups to prevent duplicate Vitest discovery and to correct documented file-size evidence, kept the explicit-`any` baseline flat at `workspace 84/289` and `tools 53/67`, and unblocked `ST-09072` through `ST-09074` for promotion into `Ready`.

### ST-09066: Modularize Core Resource Pool and Tests
- **Merged:** 2026-06-16
- **PR:** https://github.com/TVScoundrel/agentforge/pull/135 (commit 1fdb3bb3)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/core` resource pooling by shrinking `packages/core/src/resources/pool.ts` from a `316` line mixed-responsibility runtime into a `106` line public facade with focused acquisition, eviction, health-check, lifecycle, runtime, and shared-type helper modules while preserving the stable `ConnectionPool` and `createConnectionPool(...)` surface. The story also replaced the shared pool test monolith with focused acquisition, eviction, and lifecycle suites behind the same public entrypoint, absorbed review-driven fixes for concurrent create/max enforcement, draining and clear races, eviction and health-check interleavings, structured logging, and health-check callback error normalization, and kept the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119` with no CI changes required.

### ST-09065: Modularize LangGraph State Helpers and Tests
- **Merged:** 2026-06-13
- **PR:** https://github.com/TVScoundrel/agentforge/pull/134 (commit caf8512a)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/core` LangGraph state helpers by shrinking `packages/core/src/langgraph/state.ts` from a `361` line mixed-responsibility runtime to a `13` line public facade, extracting focused annotation, validation, merge, reducer/default, and shared-type modules while preserving public imports and reducer semantics. The story also replaced the `507` line `packages/core/tests/langgraph/state.test.ts` monolith with focused annotation, validation, merge, and workflow suites behind the same public entrypoint, kept the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`, and required no CI changes because the existing validation commands and public facade remained intact.

### ST-09064: Modularize LangGraph Middleware Presets and Tests
- **Merged:** 2026-06-13
- **PR:** https://github.com/TVScoundrel/agentforge/pull/133 (commit aa6ca8e6)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/core` middleware presets by shrinking `packages/core/src/langgraph/middleware/presets.ts` from a `365` line mixed-responsibility runtime to a small public facade, extracting focused logging, retry/timing, composition, and shared preset-type helpers while preserving preset ordering, public imports, and behavior. The story also replaced the `286` line preset test monolith with focused production, development, testing, and export-surface suites, absorbed follow-up review fixes before merge, kept the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`, and promoted `ST-09067` through `ST-09071` from `Backlog` to `Ready` because their dependencies were already satisfied.

### ST-09063: Modularize Multi-Agent Worker Node and Tests
- **Merged:** 2026-06-12
- **PR:** https://github.com/TVScoundrel/agentforge/pull/132 (commit 5daa6ee5)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/patterns` multi-agent worker-node handling by shrinking `packages/patterns/src/multi-agent/nodes/worker.ts` from a `357` line mixed-responsibility runtime to a `140` line public worker facade, extracting focused model-invocation, workload/error-bookkeeping, and shared worker-type helpers while preserving `createWorkerNode(...)`, handoff propagation, workload ownership, error handling, and public imports. The story also replaced the `1156` line `packages/patterns/tests/multi-agent/nodes.test.ts` monolith with focused supervisor, worker, and aggregator suites behind the same public entrypoint, absorbed review follow-ups for split-test type imports, a flaky aggregator assertion, and a redundant worker-model cast, and kept the explicit-`any` baseline flat at `workspace 84/289` and `patterns 2/28`.

### ST-09062: Modularize Core Tool Executor and Tests
- **Merged:** 2026-06-11
- **PR:** https://github.com/TVScoundrel/agentforge/pull/131 (commit 71497951)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/core` tool execution by shrinking `packages/core/src/tools/executor.ts` from a `356` line mixed-responsibility runtime to a roughly `175` line public facade, extracting focused retry, metrics, and shared-type helpers while preserving the stable `./executor.js` import surface, invoke-first dispatch, deprecated execute fallback, timeout/error semantics, callbacks, and queue status behavior. The story also replaced the `293` line executor test monolith with focused method-handling, retry-policy, and metrics suites behind the same public entrypoint, then absorbed review follow-ups for timeout cleanup, logger naming, top-level tool-name compatibility, tracker/documentation accuracy, and the synchronous internal queue helper while keeping the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`.

### ST-09061: Modularize Core Tool Types and Tests
- **Merged:** 2026-06-10
- **PR:** https://github.com/TVScoundrel/agentforge/pull/130 (commit 32c56006)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/core` tool type contracts by shrinking `packages/core/src/tools/types.ts` from a `387` line mixed-responsibility file to a `13` line public facade, extracting focused category, example, relations, metadata, and core-tool contract modules while preserving the stable `./types.js` import surface. The story also replaced the monolithic `packages/core/tests/tools/types.test.ts` coverage with focused suites behind the same public entrypoint, absorbed review follow-ups to restore the deprecated `execute` typing contract, switch the Zod dependency to a type-only import, and correct the final documentation evidence, kept the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`, and required no additional queue promotion because the ready lane was already dependency-satisfied.

### ST-09060: Tighten Multi-Agent Schema Payload Contracts
- **Merged:** 2026-06-08
- **PR:** https://github.com/TVScoundrel/agentforge/pull/129 (commit f29629b)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened `@agentforge/patterns` multi-agent runtime schema payload boundaries by replacing broad metadata `z.any()` seams with shared JSON-safe metadata objects and narrowing handoff context to unknown-first while preserving worker handoff flexibility. The story added focused multi-agent schema acceptance/rejection tests plus package-enforced typecheck assertions, then absorbed review follow-ups to extract a shared JSON-safe helper, reject non-plain runtime objects, preserve `Object.create(null)` JSON-map compatibility, and document the resulting ReAct metadata validation tightening, all while keeping the explicit-`any` baseline flat at `workspace 84/289` and `patterns 2/28`.

### ST-09059: Tighten ReAct Schema Payload Contracts
- **Merged:** 2026-06-08
- **PR:** https://github.com/TVScoundrel/agentforge/pull/128 (commit 754a0ff)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened `@agentforge/patterns` ReAct runtime schema payload boundaries by replacing broad metadata/result `z.any()` seams with JSON-safe metadata objects plus unknown-first tool payload contracts, then absorbing review follow-ups to reject non-finite metadata numbers and to wire the new `contracts.typecheck.ts` assertions into `@agentforge/patterns` package typecheck coverage. The story added focused ReAct schema acceptance/rejection tests, preserved runtime reasoning/action/observation behavior and non-JSON tool payload flexibility, kept the explicit-`any` baseline flat at `workspace 84/289` and `patterns 2/28`, and required no additional queue promotion because the ready lane was already dependency-satisfied.

### ST-09058: Modularize Core Tool Lifecycle and Tests
- **Merged:** 2026-06-06
- **PR:** https://github.com/TVScoundrel/agentforge/pull/127 (commit ea26ba1)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/core` managed-tool lifecycle handling by shrinking `packages/core/src/tools/lifecycle.ts` from a `405` line mixed-responsibility file to an `11` line public facade, extracting focused managed-tool orchestration, hook, health, internal-state, and error helper modules while preserving `ManagedTool` initialization, execution, cleanup, health-check, auto-cleanup, and public import behavior. The story also replaced the `574` line lifecycle test monolith with focused initialization, execution, cleanup, and health suites, absorbed review follow-ups for direct implementation-type imports and a tighter internal initialize dependency shape, kept the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`, and promoted `ST-09059`, `ST-09060`, `ST-09064`, `ST-09065`, and `ST-09066` from `Backlog` to `Ready` because all remaining backlog dependencies are now satisfied.

### ST-09057: Modularize Relational Transaction Flow and Tests
- **Merged:** 2026-06-05
- **PR:** https://github.com/TVScoundrel/agentforge/pull/126 (commit f6bbb9f)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/tools` transaction handling by shrinking `packages/tools/src/data/relational/query/transaction.ts` from a `419` line mixed-responsibility file to a `14` line public facade, extracting focused transaction type, option-resolution, managed-lifecycle, and orchestration helpers while preserving `withTransaction()` behavior, savepoint flow, timeout cancellation, vendor-specific isolation handling, and public imports. The story also replaced the `338` line query transaction test monolith with focused lifecycle, options, and savepoint suites plus shared test utilities, absorbed review follow-ups for tracker accuracy, SQL-aligned helper typing, and refreshed evidence counts, and kept the explicit-`any` baseline flat at `workspace 84/289` and `tools 53/67`.

### ST-09056: Modularize Skills Registry and Tests
- **Merged:** 2026-06-05
- **PR:** https://github.com/TVScoundrel/agentforge/pull/125 (commit ed8ed92)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/skills` registry handling by shrinking `packages/skills/src/registry.ts` from a `506` line mixed-responsibility file to a `101` line public facade, extracting focused discovery, event, prompt, query, and shared-type helpers while preserving `SkillRegistry` discovery order, duplicate precedence, prompt output, event semantics, and public imports. The story also replaced the `419` line `packages/skills/tests/registry.test.ts` monolith with focused discovery, query, event, and rescan suites plus shared test utilities, absorbed review follow-ups for per-test temp-dir cleanup, public type alignment, and documentation accuracy, and kept the explicit-`any` baseline flat at `workspace 84/289` and `skills 0/0`.

### ST-09055: Modularize Relational Schema Inspector and Tests
- **Merged:** 2026-06-04
- **PR:** https://github.com/TVScoundrel/agentforge/pull/124 (commit 798d1aa)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 5 hours
- **Outcome:** Modularized `@agentforge/tools` relational schema inspection by shrinking `packages/tools/src/data/relational/schema/schema-inspector.ts` from a `725` line mixed-responsibility file to a `126` line public facade, extracting focused shared, PostgreSQL, MySQL, and SQLite runtime helpers while preserving schema metadata shape, cache invalidation behavior, vendor-specific inspection results, and public imports. The story also replaced the old schema-inspector test monolith with focused PostgreSQL, cache, and filter suites plus shared test utilities, absorbed review follow-ups for unsupported-vendor failure hardening, safer SQLite column assembly, and corrected documentation test counts, and kept the explicit-`any` baseline flat at `workspace 84/289` and `tools 53/67`.

### ST-09054: Modularize Reflection Nodes and Tests
- **Merged:** 2026-05-29
- **PR:** https://github.com/TVScoundrel/agentforge/pull/123 (commit 9228bf5)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/patterns` reflection nodes by shrinking `packages/patterns/src/reflection/nodes.ts` from a `350` line mixed-responsibility file to a `13` line public facade, extracting focused generator, reflector, reviser, finisher, and shared-helper modules while preserving reflection behavior, logging names, iteration semantics, and public exports. The story also replaced the `353` line `packages/patterns/tests/reflection/nodes.test.ts` monolith with focused generator, reflector, reviser, and finisher suites, kept the explicit-`any` baseline flat at `workspace 84/289` and `patterns 2/28`, and promoted `ST-09059` plus `ST-09060` from `Backlog` to `Ready` because their dependencies `ST-09037` and `ST-09045` were already merged.

### ST-09053: Modularize Relational Connection Manager and Tests
- **Merged:** 2026-05-28
- **PR:** https://github.com/TVScoundrel/agentforge/pull/122 (commit 34390b9)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 5 hours
- **Outcome:** Modularized `@agentforge/tools` relational connection management by shrinking `packages/tools/src/data/relational/connection/connection-manager.ts` from a `640` line mixed-responsibility file to a `255` line public facade, then splitting the extracted runtime logic into focused initialization, cleanup, health, and runtime-type modules instead of leaving a second oversized helper. The story also replaced three monolithic connection-manager and lifecycle suites with focused connection, lifecycle, config, operations, and SQLite runtime tests, preserved public `ConnectionManager` behavior and imports, kept the explicit-`any` baseline flat at `workspace 84/289` and `tools 53/67`, and promoted `ST-09058` from `Backlog` to `Ready` to keep the lane at capacity after merge.

### ST-09052: Modularize Relational Query Builder and Tests
- **Merged:** 2026-05-27
- **PR:** https://github.com/TVScoundrel/agentforge/pull/121 (commit 9b0a2ac)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 5 hours
- **Outcome:** Modularized `@agentforge/tools` relational query building by shrinking `packages/tools/src/data/relational/query/query-builder.ts` from a `731` line mixed-responsibility file to a `43` line public facade, extracting focused internal type, condition, insert, mutation, and select modules while preserving public builder exports, SQL output, parameter ordering, identifier quoting, and vendor-specific behavior. The story also replaced the `688` line `packages/tools/tests/data/relational/query/query-builder.test.ts` monolith with focused insert, update, delete, and select suites, kept the explicit-`any` baseline flat at `workspace 84/289` and `tools 53/67`, and required no queue promotion because `Backlog` remained empty after merge.

### ST-09051: Modularize Multi-Agent Orchestration Agent and Tests
- **Merged:** 2026-05-26
- **PR:** https://github.com/TVScoundrel/agentforge/pull/120 (commit 96eef82)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/patterns` multi-agent orchestration by shrinking `packages/patterns/src/multi-agent/agent.ts` from a `535` line mixed-responsibility file to a `155` line public facade, extracting focused graph-assembly, runtime worker-injection, worker-normalization, builder, and shared-type modules while preserving `createMultiAgentSystem`, `registerWorkers`, `createWorkersRegistry`, and `MultiAgentSystemBuilder` behavior and export paths. The story also replaced the `655` line `packages/patterns/tests/multi-agent/agent.test.ts` monolith with focused system, registration, tool-mapping, and builder suites, kept the explicit-`any` baseline flat at `workspace 84/289` and `patterns 2/28`, and absorbed a review follow-up to route the deprecated compiled-system registration warning through the shared patterns logger.

### ST-09050: Modularize Core Tool Builder and Tests
- **Merged:** 2026-05-23
- **PR:** https://github.com/TVScoundrel/agentforge/pull/119 (commit 08e2b06)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/core` tool builder by shrinking `packages/core/src/tools/builder.ts` from a `434` line mixed-responsibility file to a small facade below the `300` line cutoff, extracting focused metadata, invoke-wrapping, and finalization helpers while preserving the public `ToolBuilder` and `toolBuilder` API, fluent chaining semantics, metadata isolation, clone behavior, and invoke compatibility. The story also replaced the `697` line `packages/core/tests/tools/builder.test.ts` monolith with focused basic, metadata, validation, typing, safe-execution, and relations suites, then absorbed review follow-ups for explicit type-only imports, stale documentation line counts, and restored in-place append semantics for tags, limitations, and examples while keeping the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`.

### ST-09049: Modularize Core Tool Registry and Tests
- **Merged:** 2026-05-22
- **PR:** https://github.com/TVScoundrel/agentforge/pull/118 (commit a37b582)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/core` tool registry by shrinking `packages/core/src/tools/registry.ts` from a `446` line mixed-responsibility file to a `107` line public facade, extracting focused internal query, mutation, and public-type modules while preserving the stable `ToolRegistry` API, emitted events, mutation semantics, and exports. The story also replaced the `832` line `packages/core/tests/tools/registry.test.ts` monolith with focused CRUD, query, bulk mutation, event, LangChain, and prompt suites, kept the explicit-`any` baseline flat at `workspace 84/289` and `core 23/119`, and promoted `ST-09054` into `Ready` during post-merge queue grooming because its dependency `ST-09019` was already merged.

### ST-09046: Tighten Transformer Schema Value Contracts
- **Merged:** 2026-05-20
- **PR:** https://github.com/TVScoundrel/agentforge/pull/116 (commit 8e3b1e0)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened transformer schema value contracts in `@agentforge/tools` by replacing blanket `z.any()` seams in `packages/tools/src/data/transformer/types.ts` with shared unknown-first schemas, while preserving array filter/map/sort/group-by and object pick/omit behavior. The story added focused schema and helper regressions, hardened special-key handling for `array-map` and `array-group-by`, and absorbed review-driven follow-up fixes to preserve normal object prototype behavior while still preventing prototype-mutation hazards, keeping the explicit-`any` baseline flat at `workspace 90/289` and `tools 59/67`.

### ST-09048: Modularize Multi-Agent Routing Strategies and Tests
- **Merged:** 2026-05-19
- **PR:** https://github.com/TVScoundrel/agentforge/pull/115 (commit 4a48f66)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Modularized `@agentforge/patterns` multi-agent routing by shrinking `packages/patterns/src/multi-agent/routing.ts` from a `373` line mixed-responsibility file to a `51` line public facade, extracting focused internal strategy modules for LLM, round-robin, skill-based, load-balanced, and rule-based routing plus shared worker-selection helpers. The story also split the `538` line routing test monolith into focused strategy test files with a shared fixture, preserved the public routing exports and runtime behavior, and absorbed review-driven hardening for own-key strategy lookup, schema-aligned message fixtures, and checklist/tracker consistency while keeping the explicit-`any` baseline flat at `workspace 90/289` and `patterns 2/28`.

### ST-09045: Tighten Multi-Agent Routing Decision Contracts
- **Merged:** 2026-05-17
- **PR:** https://github.com/TVScoundrel/agentforge/pull/114 (commit b1c07f5)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened `@agentforge/patterns` multi-agent routing decision handling by replacing the broad LLM routing cast with schema-aligned structured-output parsing, while preserving LLM-based, round-robin, skill-based, load-balanced, and rule-based routing behavior. The story added focused routing regressions plus follow-up fixes for content-based fallback parsing, routing-specific invalid-decision diagnostics, setup-only structured-output fallback with warn-level observability, and explicit hard-failure behavior for invalid structured responses, and it lowered the `patterns` explicit-`any` baseline from `3/28` to `2/28` while lowering the workspace baseline from `91/289` to `90/289`.

### ST-09044: Tighten Testing Mock Tool Factory Contracts
- **Merged:** 2026-05-16
- **PR:** https://github.com/TVScoundrel/agentforge/pull/113 (commit 233b5f0)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 2 hours
- **Outcome:** Tightened schema-driven mock-tool factory input contracts in `@agentforge/testing`, removed the remaining explicit-`any` seams from `packages/testing/src/mocks/mock-tool.ts`, added a source-included typecheck regression plus focused runtime coverage, and preserved delayed/error helper semantics while fixing built-in default helper-name validity.

### ST-09041: Adopt Structured Logger in Conversation Simulator
- **Merged:** 2026-05-12
- **PR:** https://github.com/TVScoundrel/agentforge/pull/110 (commit 69d2617)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 2 hours
- **Outcome:** Replaced the verbose `console.log` path in `@agentforge/testing`'s `ConversationSimulator` with the shared structured logger from `@agentforge/core`, preserving opt-in verbose behavior and the existing `User: ...` and `AI: ...` turn text while adding optional logger injection for direct test verification. The story added focused regression coverage for verbose-enabled and verbose-disabled paths, documented the `CaptureStream` plus `console.log` spy verification approach, and absorbed a review follow-up to align the logger name with the repo's `agentforge:<package>:<module>:<component>` convention.

### ST-09040: Tighten Human-in-Loop Streaming Resume Contracts
- **Merged:** 2026-05-09
- **PR:** https://github.com/TVScoundrel/agentforge/pull/109 (commit 4a41a42)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 2 hours
- **Outcome:** Tightened the human-in-loop SSE resume event boundary in `@agentforge/core` by replacing broad resume payload `any` seams with the shared JSON-safe `InterruptPayload` contract already used by interrupt resume commands and options. The story preserved existing SSE event names, payload structure, and `resume-<interruptId>` IDs, added focused runtime coverage plus a standalone typecheck regression fixture, and reduced the `core` explicit-`any` baseline from `35/119` to `33/119` while lowering the workspace baseline from `106/289` to `104/289`.

### ST-09039: Tighten Core Mock Tool Testing Helper Contracts
- **Merged:** 2026-05-08
- **PR:** https://github.com/TVScoundrel/agentforge/pull/108 (commit b9f3625)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened `@agentforge/core` mock-tool and tool-simulator testing helper contracts by replacing broad response, invocation, and simulator payload `any` seams with generic and unknown-first boundaries while preserving exact-match and predicate response matching, default responses, latency/error simulation, invocation recording, and missing-tool behavior. The story added focused runtime coverage plus a standalone typecheck regression fixture and reduced the `core` explicit-`any` baseline from `44/119` to `35/119`, with the touched helper file itself improving from `8` explicit `any` uses to `0`.

### ST-09037: Tighten ReAct Builder and Prompt Boundary Contracts
- **Merged:** 2026-05-06
- **PR:** https://github.com/TVScoundrel/agentforge/pull/106 (commit 8199b52)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened the public ReAct builder and prompt boundary contracts in `@agentforge/patterns` by replacing broad tool, checkpointer, prompt schema, and compiled-graph typing seams with ReAct-scoped aliases and unknown-first contracts while preserving existing runtime behavior. The story added focused runtime coverage plus a standalone typecheck regression fixture, reduced explicit-`any` usage in the touched ReAct files to zero, and absorbed multiple review follow-ups to preserve array-tool assignability, runtime tool identity, and tracker consistency.

### ST-10006: Normalize Emoji Usage in Example Overview Docs
- **Merged:** 2026-05-05
- **PR:** https://github.com/TVScoundrel/agentforge/pull/105 (commit dd252d8)
- **Epic:** EP-10 (Documentation Only Changes)
- **Estimate:** 2 hours
- **Outcome:** Removed the remaining decorative emoji from the example overview/index markdown in `examples/README.md` and `examples/vertical-agents/README.md`, including overview headings and decorative navigation arrow glyphs, while preserving functional status checkmarks and literal sample output. The story kept scope tightly limited to example catalog pages, added explicit story documentation, and closed with tracker-consistency follow-up fixes from review.

### ST-10004: Normalize Emoji Usage in Examples and Template Docs
- **Merged:** 2026-05-05
- **PR:** https://github.com/TVScoundrel/agentforge/pull/102 (commit 1a0436a)
- **Epic:** EP-10 (Documentation Only Changes)
- **Estimate:** 3 hours
- **Outcome:** Removed remaining decorative emoji from project-owned example READMEs, template docs, and related supporting markdown while preserving functional status markers and literal runtime/demo output where the emoji carried meaning. The story also absorbed review follow-ups to finish the scoped cleanup and keep the EP-10 documentation normalization lane consistent across examples and templates.

### ST-10005: Add Documentation Style Guardrails for Emoji Usage
- **Merged:** 2026-05-05
- **PR:** https://github.com/TVScoundrel/agentforge/pull/104 (commit ba6e94b)
- **Epic:** EP-10 (Documentation Only Changes)
- **Estimate:** 2 hours
- **Outcome:** Added contributor-facing markdown style guardrails in `docs-site/contributing.md` that ban decorative emoji in project-owned markdown while preserving clear exceptions for literal sample output, demonstrated runtime behavior, and meaningful non-emoji symbols. The story documented EP-10 as the evergreen home for future markdown normalization follow-ups, kept the policy in an existing contributor/process file instead of creating a redundant fragment, and passed full-suite and lint verification with the documented docs-only test-first rationale.

### ST-09036: Tighten Conversation Simulator Agent Contracts
- **Merged:** 2026-05-05
- **PR:** https://github.com/TVScoundrel/agentforge/pull/103 (commit 318683e)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened `@agentforge/testing` conversation simulator contracts by replacing broad agent/invoke-result seams with the shared generic `AgentTestAgent` surface and unknown-first message extraction from the agent test runner, preserving static/dynamic turn flow, max-turn handling, stop conditions, verbose mode, and captured error behavior with focused tests and a source-included type regression. The story lowered the workspace explicit-`any` baseline from `135/289` to `133/289` and reduced the `testing` package from `5/51` to `3/51`, and its follow-up review concern about structured logging was intentionally captured as new backlog story `ST-09041`.

### ST-10002: Normalize Emoji Usage in Public-Facing Docs
- **Merged:** 2026-05-04
- **PR:** https://github.com/TVScoundrel/agentforge/pull/100 (commit 7d33a44)
- **Epic:** EP-10 (Documentation Only Changes)
- **Estimate:** 3 hours
- **Outcome:** Removed decorative emoji from public-facing documentation across docs-site pages, package READMEs, package docs, and related public markdown while preserving meaning and fenced examples where appropriate. Follow-up review fixes corrected markdown grouping, whitespace, status markers, tool counts, and Neo4j summary drift so the published docs remain readable and internally consistent.

### ST-09035: Tighten Agent Test Runner State Contracts
- **Merged:** 2026-05-04
- **PR:** https://github.com/TVScoundrel/agentforge/pull/99 (commit 89d97a9)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened `@agentforge/testing` agent test runner contracts by adding exported `AgentTestAgent` and `AgentTestRunnerStep` interfaces, making runner config/result/factory APIs generic over input, state, and step types, preserving timeout, validation, step-capture, and multi-input behavior with focused tests, folding in review fixes for timeout cleanup, malformed message guards, explicit zero-timeout handling, and documentation accuracy, and lowering the explicit-`any` baseline from `144/289` to `135/289` while reducing the `testing` package from `14/51` to `5/51`.

### ST-09033: Tighten Database Pool Adapter Contracts
- **Merged:** 2026-05-03
- **PR:** https://github.com/TVScoundrel/agentforge/pull/98 (commit 69bb59d)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened `@agentforge/core` database pool adapter contracts by adding exported `DatabaseQueryParams` and `DatabaseQueryResult` aliases, moving query/execute parameter and result defaults to unknown-first readonly boundaries, preserving pool acquire/release, query/execute, and health-check behavior with focused tests, and lowering the explicit-`any` baseline from `153/289` to `144/289` while reducing the `core` package from `53/119` to `44/119`.

### ST-10001: Audit Markdown Emoji Usage Across Project-Owned Docs
- **Merged:** 2026-05-03
- **PR:** https://github.com/TVScoundrel/agentforge/pull/97 (commit 38f280d)
- **Epic:** EP-10 (Documentation Only Changes)
- **Estimate:** 2 hours
- **Outcome:** Added a markdown emoji usage audit covering 246 project-owned Markdown files, identifying 120 files with emoji-range characters across public docs, package docs, planning/internal docs, and examples/templates. The audit distinguished cleanup candidates from fenced-code and literal sample output preservation cases, recommended the follow-on cleanup sequence, and recorded validation results for tests and lint.

### ST-09031: Extract Tool Registry Registration and Mutation Paths
- **Merged:** 2026-04-23
- **PR:** https://github.com/TVScoundrel/agentforge/pull/94 (commit 4d9ea4c)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Extracted tool registry register, remove, update, bulk-register, and clear mutation logic into a focused internal helper module while keeping `ToolRegistry` as the stable public facade, preserving duplicate/conflict handling and emitted mutation event semantics, adding a focused helper test suite, and folding in review follow-up fixes for cached mutation helpers, duplicate-message behavior preservation, and JSDoc/validation-note cleanup.

### ST-09030: Extract Connection Manager Query Execution and Session Adapters
- **Merged:** 2026-04-22
- **PR:** https://github.com/TVScoundrel/agentforge/pull/93 (commit dd2a8c4)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Extracted relational connection-manager query execution and dedicated-session adapter handling into focused internal helpers, preserved vendor-specific MySQL tuple normalization and SQLite non-query normalization, kept the public `ConnectionManager` execution façade stable, and added focused helper coverage plus review follow-up fixes to remove the remaining session-adapter type escape hatches.

### ST-09029: Modularize Plan-Execute Node Responsibilities
- **Merged:** 2026-04-21
- **PR:** https://github.com/TVScoundrel/agentforge/pull/92 (commit bc62b59)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Split the plan-execute node runtime into focused planner, executor, replanner, finisher, logger, and serialization modules behind the stable public facade, added focused regressions for invalid replanner JSON, structured and array-based model-content normalization, finisher response compatibility, prompt formatting, undefined serialization semantics, and GraphInterrupt propagation, and kept the `patterns` explicit-`any` baseline stable at `15/28`.

### ST-09028: Modularize Connection Manager Lifecycle and Reconnection Control
- **Merged:** 2026-04-17
- **PR:** https://github.com/TVScoundrel/agentforge/pull/90 (commit 91f0e2f)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Extracted the relational connection-manager lifecycle and reconnection orchestration into a focused internal helper module for state transitions, in-flight connect waiting, pending reconnection cancellation, shutdown, and scheduling, while preserving the public connection-manager lifecycle surface and adding focused cancellation/reconnection cleanup regressions. Review follow-ups restored public reconnection JSDoc, tightened helper logger and context contracts, fixed stale reconnection-attempt capture, and clarified the helper naming boundary to avoid accidental-recursion confusion.

### ST-09027: Extract Connection Manager Vendor Initialization Adapters
- **Merged:** 2026-04-16
- **PR:** https://github.com/TVScoundrel/agentforge/pull/89 (commit a995df3)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Extracted the relational connection-manager vendor-specific PostgreSQL, MySQL, and SQLite initialization paths into focused internal helpers, preserved the public lifecycle surface and existing lifecycle coverage, added focused vendor-initialization tests, and lowered the workspace explicit-`any` baseline from 182 to 180 while lowering the `tools` package from 67 to 65. Follow-up review fixes gave the helper its own logger namespace and tightened vendor/connection type pairing around the exported initialization adapters.

### ST-09023: Tighten Core Tool Builder Fluent Typing
- **Merged:** 2026-04-07
- **PR:** https://github.com/TVScoundrel/agentforge/pull/85 (commit cba76db)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Tightened the core tool builder around typed fluent stage transitions, added source-included type regressions and focused runtime chaining coverage, and landed review-driven follow-up fixes for branched metadata isolation, structured-clone error messaging, and `this`-binding compatibility. Improved the workspace explicit-`any` baseline from 201 to 195 and the `core` package from 82 to 76.

### ST-09022: Harden Shared Deduplication Utility Contracts
- **Merged:** 2026-04-03
- **PR:** https://github.com/TVScoundrel/agentforge/pull/84 (commit 82aad8e)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened the shared deduplication helpers around unknown-first normalization and cache-key generation, normalized sorted objects onto null-prototype maps so special keys are treated as data, added focused coverage for the `__proto__` special-key path, and improved the workspace explicit-`any` baseline from 205 to 201 while lowering the `patterns` package from 19 to 15.

### ST-09021: Harden Streaming WebSocket and Message Contracts
- **Merged:** 2026-04-03
- **PR:** https://github.com/TVScoundrel/agentforge/pull/83 (commit 87885d1)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Hardened the streaming WebSocket helper surface by replacing broad socket, message, and close-reason `any` seams with structural and generic contracts, preserving string JSON parsing while safely forwarding raw binary payloads, and adding focused coverage for non-string passthrough, normalized thrown errors, and heartbeat capability handling. Improved the workspace explicit-`any` baseline from 219 to 205 and the `core` package from 96 to 82.

### ST-09020: Tighten Prompt Loader Variable Contracts
- **Merged:** 2026-04-02
- **PR:** https://github.com/TVScoundrel/agentforge/pull/82 (commit e84c425)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened the prompt-loader variable boundary around unknown-first trusted and untrusted maps, preserved trusted-vs-untrusted rendering and plain-object fallback behavior, added focused prompt-loader regressions for malformed options and prompt-file rendering, and folded in review fixes for null-prototype map handling, own-property option detection, and documented own-enumerable compatibility boundaries.

### ST-09019: Harden Reflection Agent Routing Typing
- **Merged:** 2026-03-31
- **PR:** https://github.com/TVScoundrel/agentforge/pull/81 (commit fd8f0ef)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened the reflection factory around node-specific typed route maps and direct compile inference, removed the remaining route and compile `as any` casts from the reflection agent boundary, and added focused route-behavior coverage for direct completion and max-iteration finishing.

### ST-09018: Harden Testing Assertion and State Builder Helpers
- **Merged:** 2026-03-29
- **PR:** https://github.com/TVScoundrel/agentforge/pull/80 (commit 7d195eb)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened the shared testing assertion and state-builder helper contracts around `unknown`-first and generic builder boundaries, added source-included typecheck coverage plus focused helper regressions, and folded in review fixes for partial planning results, field-key narrowing, empty conversation initialization, honest asserted-message typing, and cross-package message support.

### ST-09017: Centralize CLI Command Error Handling
- **Merged:** 2026-03-27
- **PR:** https://github.com/TVScoundrel/agentforge/pull/79 (commit 94d4d99)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Centralized repeated CLI command error handling behind a shared helper, migrated the CLI command layer off repetitive `catch (error: any)` plus `process.exit(1)` blocks, added focused helper coverage, and folded in review fixes for preserved output ordering, publish-spinner sequencing, and a `never`-typed exit contract with deterministic test teardown.

### ST-09016: Harden Monitoring Audit and Health Payload Types
- **Merged:** 2026-03-26
- **PR:** https://github.com/TVScoundrel/agentforge/pull/78 (commit fe02e2b)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened the public monitoring audit and health payload contracts around shared JSON-safe observability types, added focused regression coverage for payload preservation and health-check error propagation, and folded in review fixes for falsy payload handling, structured health startup logging, explicit zero timestamps, and deterministic test cleanup.

### ST-09015: Modularize Multi-Agent Node Responsibilities
- **Merged:** 2026-03-25
- **PR:** https://github.com/TVScoundrel/agentforge/pull/77 (commit 3d5ac9a)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Split the multi-agent node runtime into focused supervisor, worker, aggregator, and shared helper modules behind the stable public entrypoint, preserved coordinator and handoff behavior, and folded in follow-up fixes for log redaction, public JSDoc contracts, worker workload invariants, GraphInterrupt propagation, and explicit failure on invalid model content.

### ST-09014: Tighten Plan-Execute Shared Type Boundaries
- **Merged:** 2026-03-24
- **PR:** https://github.com/TVScoundrel/agentforge/pull/76 (commit 5913b74)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Replaced broad `Tool<any, any>[]`-style plan-execute boundaries with the exported `PlanExecuteTool` contract plus generic executor/agent config typing, moved step argument/result contracts to `unknown`-based schema helpers, added source-included typecheck coverage, and recorded the follow-on modularization story `ST-09029` for the still-large `nodes.ts` module.

### ST-09013: Harden Sequential Workflow Builder Typing
- **Merged:** 2026-03-23
- **PR:** https://github.com/TVScoundrel/agentforge/pull/75 (commit cabf341)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Hardened the sequential workflow builder around schema-derived `Annotation.Root(...)` typing, removed the old explicit state-generic call pattern, added source-included typecheck coverage and runtime invalid-schema regressions, and updated the Phase 2.2 example to the tightened API.

### ST-09012: Remove Package Export-Map Build Warnings
- **Merged:** 2026-03-23
- **PR:** https://github.com/TVScoundrel/agentforge/pull/74 (commit 42447ab)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 2 hours
- **Outcome:** Reordered the root `exports` condition keys in `@agentforge/skills`, `@agentforge/tools`, and `@agentforge/testing` so `types` is evaluated before `import` and `require`, eliminating the repeated `exports.types` build warning while preserving the same published runtime and declaration entrypoints.

### ST-09011: Tighten Explicit-`any` Baseline Caps
- **Merged:** 2026-03-23
- **PR:** https://github.com/TVScoundrel/agentforge/pull/73 (commit 90c93df)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 2 hours
- **Outcome:** Tightened the committed `scripts/no-explicit-any-baseline.json` caps from the stale `496` total allowance down to the current measured `289`, aligned each package cap with the latest workspace floor, and validated the updated no-regression gate with baseline, lint, and full-suite checks.

### ST-09010: Strengthen Plan-Execute Agent Routing Typing
- **Merged:** 2026-03-23
- **PR:** https://github.com/TVScoundrel/agentforge/pull/72 (commit e19c63a)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Removed the avoidable `as any` route and compile bridges from the plan-execute agent factory, added focused route-flow coverage for both replanner outcomes, documented the warning delta, and reduced the workspace explicit-`any` baseline from `292` to `289` (`patterns 31` -> `28`).

### ST-01001: Setup Drizzle ORM Dependencies and Project Structure
- **Merged:** 2026-02-17
- **PR:** https://github.com/TVScoundrel/agentforge/pull/25 (commit 54c0e22)
- **Epic:** EP-01 (Core Database Connection Management)
- **Estimate:** 2 hours | **Actual:** ~2 hours
- **Outcome:** Successfully set up Drizzle ORM with PostgreSQL, MySQL, and SQLite support as optional peer dependencies. Created foundational directory structure, shared types, and peer dependency runtime checker with helpful error messages. All quality gates passed (build, tests, lint).

### ST-01002: Implement Connection Manager
- **Merged:** 2026-02-17
- **PR:** https://github.com/TVScoundrel/agentforge/pull/26 (commit c07f369)
- **Epic:** EP-01 (Core Database Connection Management)
- **Estimate:** 4 hours | **Actual:** ~5 hours (including 4 rounds of PR review feedback)
- **Outcome:** Successfully implemented ConnectionManager with vendor-specific initialization for PostgreSQL, MySQL, and SQLite using Drizzle ORM. Implemented discriminated union types for type-safe vendor selection, comprehensive error handling with error chaining, AgentForge logging standards compliance, and health check functionality. Created 16 passing unit tests with conditional SQLite tests. Addressed 19 Copilot review comments across 4 rounds, including type safety improvements, MySQL connection string handling corrections, and documentation consistency fixes. All quality gates passed (1092 tests, lint clean).

### ST-01003: Implement Connection Pooling
- **Merged:** 2026-02-17
- **PR:** https://github.com/TVScoundrel/agentforge/pull/27 (commit c62a471)
- **Epic:** EP-01 (Core Database Connection Management)
- **Estimate:** 3 hours | **Actual:** ~4 hours (including 4 rounds of PR review feedback)
- **Outcome:** Successfully implemented connection pooling configuration with vendor-agnostic PoolConfig interface (max, acquireTimeoutMillis, idleTimeoutMillis). Mapped pool options to vendor-specific drivers (pg.Pool, mysql2.createPool). Implemented pool validation, pool metrics (totalCount, activeCount, idleCount, waitingCount), and comprehensive error handling. Created 10 passing unit tests for validation and metrics. Addressed 17 Copilot review comments across 4 rounds, including: removing MySQL private field usage, fixing pool property leaks in both PostgreSQL and MySQL, converting test patterns to idiomatic Vitest async error assertions, removing unused PoolConfig fields, improving test validation coverage, and fixing documentation accuracy. All quality gates passed (1101 tests, lint clean).

### ST-02001: Implement Raw SQL Query Execution Tool
- **Merged:** 2026-02-17
- **PR:** https://github.com/TVScoundrel/agentforge/pull/28 (commit de50714)
- **Epic:** EP-02 (Query Execution Tools)
- **Estimate:** 4 hours | **Actual:** ~6 hours (including 6 rounds of PR review feedback)
- **Outcome:** Successfully implemented raw SQL query execution tool with parameter binding for PostgreSQL, MySQL, and SQLite. Created query executor with support for positional ($1, ?) and named (:name) parameters using Drizzle's sql template tag for SQL injection prevention. Implemented relational-query LangGraph tool with comprehensive schema validation, examples, and error handling. Created 32 passing unit tests (19 conditionally skipped for driver availability). Addressed 37 Copilot review comments across 6 rounds, including: removing unimplemented timeout/maxRows features, updating ConnectionManager.execute() to accept SQL objects, adding positional/named parameter validation, fixing error testing patterns, adding comprehensive test coverage, fixing PostgreSQL type cast regex, detecting mixed placeholder styles, improving error sanitization, making rowCount required, replacing console.log with logger in docs, detecting placeholders when params omitted, adding test for $n positional placeholders, and updating checklist for deferred timeout feature. All quality gates passed (30 tests, lint clean).

### ST-01004: Implement Connection Lifecycle Management
- **Merged:** 2026-02-18
- **PR:** https://github.com/TVScoundrel/agentforge/pull/29 (commit 51e9c76)
- **Epic:** EP-01 (Core Database Connection Management)
- **Estimate:** 2 hours | **Actual:** ~8 hours (including 15 rounds of PR review feedback)
- **Outcome:** Successfully implemented comprehensive connection lifecycle management with state tracking (DISCONNECTED, CONNECTING, CONNECTED, RECONNECTING, ERROR), automatic reconnection with exponential backoff, and event emissions for lifecycle changes. Implemented public API methods: connect(), disconnect(), isConnected(), getState(), dispose(). Added backward compatibility with initialize() and close() methods. Implemented robust concurrency handling via connectPromise tracking and connectionGeneration tokens. Created comprehensive cleanup mechanisms including cleanupCancelledConnection() for resource cleanup and dispose() for full cleanup including event listener removal. Implemented proper idempotency for connect() with re-initialization support. Created 21 passing unit tests (4 passed, 17 skipped when SQLite bindings unavailable). Addressed 15 rounds of Copilot review feedback covering: backward compatibility, reconnection timer cancellation, test patterns, concurrency handling, memory leaks, error normalization, documentation accuracy, connection leaks, exponential backoff formula, initialize() idempotency, comprehensive edge case tests, SQLite binding guards, planning documentation updates, version numbers, repository naming, PR description corruption, re-initialization event emission, and dispose() method documentation. All quality gates passed (1115 tests, lint clean).

### ST-02002: Implement Type-Safe SELECT Tool
- **Merged:** 2026-02-18
- **PR:** https://github.com/TVScoundrel/agentforge/pull/30 (commit 5bd8acc)
- **Epic:** EP-02 (Query Execution and CRUD Operations)
- **Estimate:** 5 hours
- **Outcome:** Successfully implemented `relational-select` with type-safe query construction and validation, including column selection, WHERE conditions, ORDER BY, LIMIT/OFFSET, and sanitized error handling. Added focused unit tests and documentation (`docs/st02002-type-safe-select-tool.md`), and completed quality gates before review.

### ST-02006: Implement SQL Sanitization and Security
- **Merged:** 2026-02-19
- **PR:** https://github.com/TVScoundrel/agentforge/pull/31 (commit d4a08f5)
- **Epic:** EP-02 (Query Execution and CRUD Operations)
- **Estimate:** 3 hours
- **Outcome:** Implemented vendor-aware SQL sanitization and security enforcement in the relational query execution path. Added dangerous DDL blocking, parameterization enforcement, comment/string normalization, PostgreSQL JSON operator-safe placeholder handling, MySQL backslash-escape handling, and focused security test coverage plus supporting documentation.

### ST-02003: Implement Type-Safe INSERT Tool
- **Merged:** 2026-02-19
- **PR:** https://github.com/TVScoundrel/agentforge/pull/34 (commit e49a607)
- **Epic:** EP-02 (Query Execution and CRUD Operations)
- **Estimate:** 4 hours
- **Outcome:** Implemented `relational-insert` with shared INSERT query-builder support, single and batch insert handling, configurable return modes (`none`, `id`, `row`), input validation, and sanitized constraint-violation errors. Added focused tests for schema validation, query builder behavior, and tool invocation plus story documentation.

### ST-02004: Implement Type-Safe UPDATE Tool
- **Merged:** 2026-02-19
- **PR:** https://github.com/TVScoundrel/agentforge/pull/35 (commit ff93221)
- **Epic:** EP-02 (Query Execution and CRUD Operations)
- **Estimate:** 4 hours
- **Outcome:** Implemented `relational-update` with shared UPDATE query-builder support, validated WHERE operators, full-table update safety guard, optional optimistic locking, affected-row count normalization, and constraint-aware error mapping. Added focused tests for schema validation, query builder logic, and tool invocation plus story documentation.

### ST-03001: Implement Schema Introspection Tool
- **Merged:** 2026-02-19
- **PR:** https://github.com/TVScoundrel/agentforge/pull/33 (commit d46a715)
- **Epic:** EP-03 (Schema Introspection and Metadata)
- **Estimate:** 5 hours
- **Outcome:** Implemented schema introspection for PostgreSQL, MySQL, and SQLite through a new `SchemaInspector` and `relational-get-schema` tool. Added extraction for tables, columns, primary keys, foreign keys, and indexes, plus configurable schema caching with invalidation and focused test/documentation coverage.

### ST-03002: Implement Schema Metadata Utilities
- **Merged:** 2026-02-19
- **PR:** https://github.com/TVScoundrel/agentforge/pull/37 (commit 17d51c0)
- **Epic:** EP-03 (Schema Introspection and Metadata)
- **Estimate:** 3 hours
- **Outcome:** Implemented schema metadata utilities: schema validator (table/column existence, column type validation with substring containment), type mapper (DB→TS type mapping for PostgreSQL, MySQL, SQLite with 90+ mappings), and schema diff (structured comparison, deterministic sorted JSON export/import). Created 72 unit tests across 3 test files. Addressed 13 Copilot review comments across 2 rounds. Epic EP-03 now fully complete.

### ST-04003: Implement Result Streaming
- **Merged:** 2026-02-19
- **PR:** https://github.com/TVScoundrel/agentforge/pull/36 (commit f8adbde)
- **Epic:** EP-04 (Advanced Features and Optimization)
- **Estimate:** 5 hours
- **Outcome:** Implemented chunked result streaming for the `relational-select` tool enabling memory-efficient processing of large SELECT query results. Added streaming infrastructure with chunk iteration, Node.js Readable stream integration, backpressure handling, and memory benchmarking. Refactored SELECT query building into shared utilities. Extended the tool with optional streaming configuration including chunk size, sample size, max rows, and benchmark options. All quality gates passed (1248 tests, lint clean).

### ST-02005: Implement Type-Safe DELETE Tool
- **Merged:** 2026-02-20
- **PR:** https://github.com/TVScoundrel/agentforge/pull/38 (commit 020eaa2)
- **Epic:** EP-02 (Query Execution and CRUD Operations)
- **Estimate:** 3 hours
- **Outcome:** Implemented `relational-delete` with shared DELETE query-builder support, required WHERE safety guard, optional soft-delete mode, affected-row count normalization, and refined error classification for safe validation feedback plus targeted foreign-key constraint messaging. Added focused tests for schema validation, query builder, tool invocation, and error utility behavior; completed full-suite and lint validation before merge.

### ST-04001: Implement Transaction Support
- **Merged:** 2026-02-20
- **PR:** https://github.com/TVScoundrel/agentforge/pull/39
- **Epic:** EP-04 (Advanced Features and Optimization)
- **Estimate:** 6 hours
- **Outcome:** Implemented transaction support for relational tooling with commit/rollback flow, nested savepoints, isolation-level and timeout controls, transaction context plumbing into tools, transaction logging, and focused transaction unit/integration coverage plus story documentation.

### ST-04002: Implement Batch Operations
- **Merged:** 2026-02-20
- **PR:** https://github.com/TVScoundrel/agentforge/pull/40 (commit 3e655c0)
- **Epic:** EP-04 (Advanced Features and Optimization)
- **Estimate:** 4 hours
- **Outcome:** Implemented batch operations for INSERT, UPDATE, and DELETE with configurable batch sizes, progress reporting callbacks, partial-success error handling, retry logic for failed batches, and performance benchmarks. Extended existing CRUD tools to support batch mode. Added batch executor unit tests, schema validation tests, and tool invocation scenarios. Epic EP-04 now fully complete (all 3 stories merged).

### ST-05001: Implement Comprehensive Unit Tests
- **Merged:** 2026-02-20
- **PR:** https://github.com/TVScoundrel/agentforge/pull/41 (commit 091f66a)
- **Epic:** EP-05 (Documentation, Examples, and Testing)
- **Estimate:** 8 hours
- **Outcome:** Created 23 new test files covering connection manager, query builder, query executor, transactions, all CRUD tool executors/schemas/error-utils, schema validation, identifier utils, and peer dependency checker. Achieved 90.36% statement coverage, 88.27% branch coverage, 90.76% function coverage. 1859 tests passed (159 skipped — integration tests needing real DB deferred to ST-05002).

### ST-05002: Implement Integration Tests
- **Merged:** 2026-02-21
- **PR:** https://github.com/TVScoundrel/agentforge/pull/42
- **Epic:** EP-05 (Documentation, Examples, and Testing)
- **Estimate:** 6 hours
- **Outcome:** Created 121 integration tests using testcontainers (PostgreSQL, MySQL) and in-memory SQLite. Added 15 test files covering connection lifecycle, CRUD operations, transactions, batch operations, schema introspection, streaming, error handling, concurrent access, and performance benchmarks. Created CI workflow (`.github/workflows/integration-tests.yml`) with Docker-based test execution. Discovered and fixed 4 production bugs: MySQL tuple normalization, SQLite `.run()` result normalization, SQLite non-query error detection, and connection pool validation.

### ST-05003: Create Usage Examples and Documentation
- **Merged:** 2026-02-21
- **PR:** https://github.com/TVScoundrel/agentforge/pull/43
- **Epic:** EP-05 (Documentation, Examples, and Testing)
- **Estimate:** 6 hours
- **Outcome:** Created comprehensive documentation suite for the relational database module: README with overview/quick-start/architecture, vendor-specific examples (PostgreSQL, MySQL, SQLite), ReAct agent integration example, error handling guide, 4 API reference docs (ConnectionManager, Tools, Query Builder, Schema Inspector), security best practices guide, and JSDoc comments for 42 previously undocumented exports across 18 source files. Addressed 34 Copilot review comments across 3 rounds covering error patterns, import paths, response shapes, relative links, and logging standards compliance.

### ST-05004: Create Advanced Integration Examples
- **Merged:** 2026-02-21
- **PR:** https://github.com/TVScoundrel/agentforge/pull/44
- **Epic:** EP-05 (Documentation, Examples, and Testing)
- **Estimate:** 4 hours
- **Outcome:** Created 9 advanced integration example guides plus README covering transactions, batch insert/update, result streaming, multi-agent shared database, error handling, connection pooling, schema introspection, and performance optimization. Addressed 30 Copilot review comments across 3 rounds covering API shapes (tool return patterns, batch fields, schema response), field naming (isNullable/isPrimaryKey, pool metric suffixes), caching parameters (cacheTtlMs/refreshCache), connection events, isolation level formatting, and SQLite connection format. Epic EP-05 now fully complete (all 4 stories merged).

### ST-05005: Document Relational Database Tools in Public Docs Site
- **Merged:** 2026-02-23
- **PR:** https://github.com/TVScoundrel/agentforge/pull/45
- **Epic:** EP-05 (Documentation, Examples, and Testing)
- **Estimate:** 5 hours
- **Outcome:** Created 3 public-facing VitePress documentation pages: concept guide (`guide/concepts/database.md`) covering ConnectionManager, CRUD tools, transactions, batch operations, streaming, security, and vendor differences; step-by-step tutorial (`tutorials/database-agent.md`) building a database-powered ReAct agent; and API reference section in `api/tools.md` with full parameter tables and response shapes for all 6 relational tools plus ConnectionManager and withTransaction. Updated VitePress sidebar config with new entries. Addressed 7 review comments covering misleading ConnectionManager usage, MissingPeerDependencyError throw behavior, missing `sql` import from drizzle-orm, and identifier validation regex accuracy. Epic EP-05 now fully complete — all 5 stories merged.

### ST-06001: Implement SkillRegistry with Folder-Config Auto-Discovery
- **Merged:** 2026-02-24
- **PR:** https://github.com/TVScoundrel/agentforge/pull/46
- **Epic:** EP-06 (Agent Skills Compatibility Layer)
- **Estimate:** 5 hours
- **Outcome:** Implemented `SkillRegistry` in `@agentforge/core` with folder-config auto-discovery following the Agent Skills Specification (agentskills.io). Created YAML frontmatter parser (via gray-matter), filesystem scanner, spec-compliant name/description validation, duplicate handling with deterministic precedence, query API (get, getAll, has, size, getNames, getScanErrors), event system (skill:discovered, skill:warning), and structured logging. Added 71 unit tests across 3 test files (parser: 34, scanner: 10, registry: 27). First story of EP-06.

### ST-06002: Implement SkillRegistry.generatePrompt() and System Prompt Integration
- **Merged:** 2026-02-24
- **PR:** https://github.com/TVScoundrel/agentforge/pull/47
- **Epic:** EP-06 (Agent Skills Compatibility Layer)
- **Estimate:** 5 hours
- **Outcome:** Implemented `SkillRegistry.generatePrompt()` producing `<available_skills>` XML for system prompt injection. Added `SkillPromptOptions` with `skills?: string[]` subset filter for focused agents, `enabled` feature flag (default off) ensuring unmodified prompts for non-skills agents, `maxDiscoveredSkills` cap for token budget control, XML escaping, and structured logging with token estimates. Added 23 unit tests covering feature flag gating, XML generation, subset filtering, max cap, prompt composition, and edge cases.

### ST-06003: Implement Skill Activation and Resource Tools
- **Merged:** 2026-02-24
- **PR:** https://github.com/TVScoundrel/agentforge/pull/48
- **Epic:** EP-06 (Agent Skills Compatibility Layer)
- **Estimate:** 7 hours
- **Outcome:** Implemented `activate-skill` and `read-skill-resource` tools using AgentForge tool builder API, bound to SkillRegistry for runtime skill loading. Added `ToolCategory.SKILLS`, `resolveResourcePath()` with segment-based traversal detection plus symlink guard (realpathSync), `extractBody()` via gray-matter, `toActivationTools()` convenience method with explicit return type, and structured event emission (SKILL_ACTIVATED, SKILL_RESOURCE_LOADED). Addressed 8 Copilot review comments across 2 rounds covering path security, cross-platform test assertions, symlink protection, and frontmatter consistency. Added 40 unit tests. Third story of EP-06.

---

### ST-06004: Implement Skill Trust Policies and Execution Guardrails
- **Merged:** 2026-02-24
- **PR:** https://github.com/TVScoundrel/agentforge/pull/49
- **Epic:** EP-06 (Agent Skills Compatibility Layer)
- **Estimate:** 6 hours
- **Outcome:** Implemented trust policy engine for skill resource access control. Added `TrustLevel` (`workspace`/`trusted`/`untrusted`) configurable per skill root, `evaluateTrustPolicy()` decision engine, and enforcement in `read-skill-resource` blocking scripts from untrusted roots by default. Added `allowUntrustedScripts` config override, `getAllowedTools()` API, `TRUST_POLICY_DENIED`/`TRUST_POLICY_ALLOWED` events, and `UNKNOWN_TRUST_LEVEL` reason code. Hardened `isScriptResource()` with path normalization (strip `./`, collapse separators, case-insensitive check). Addressed 6 Copilot review comments in one round covering security hardening, enum usage, and docs accuracy. Backward compatible — plain string roots default to untrusted. 41 dedicated trust tests, 180 total skills tests. Fourth story of EP-06.

---

### ST-06005: Publish Agent Skills Integration Documentation and Conformance Suite
- **Merged:** 2026-02-24
- **PR:** https://github.com/TVScoundrel/agentforge/pull/50
- **Epic:** EP-06 (Agent Skills Compatibility Layer)
- **Estimate:** 6 hours
- **Outcome:** Published developer setup guide (`agent-skills.md`) and skill authoring reference (`agent-skills-authoring.md`) to docs-site. Created 35-test conformance suite covering discovery, prompt generation, tool activation, resource loading, trust policy enforcement, allowed-tools, and full pipeline. Built committed fixture skill packs (valid/malformed/untrusted) and an end-to-end demo app (`skill-aware-agent`) demonstrating mixed-trust skill roots. Documented rollout validation, observability checks, and rollback procedure. Addressed 35+ Copilot review comments across 7 rounds covering: snake_case→kebab-case tool names, ESM `__dirname` fix, `.invoke()` API usage, run instruction accuracy, `workspace:*` vs `link:` deps, `skillRoots` required marking, brittle assertion fixes, activation tool clarification, trust-gating notes, event handler type safety, and runtime flow pseudocode. Final story of EP-06 — epic complete.

---

### ST-06006: Comprehensive Docs-Site Documentation for Agent Skills
- **Merged:** 2026-02-24
- **PR:** https://github.com/TVScoundrel/agentforge/pull/51
- **Epic:** EP-06 (Agent Skills Compatibility Layer)
- **Estimate:** 5 hours
- **Outcome:** Added comprehensive docs-site coverage for Agent Skills: step-by-step tutorial (`tutorials/skill-powered-agent.md`), examples page with 10 integration patterns (`examples/agent-skills.md`), SkillRegistry API reference section in `api/core.md`, VitePress sidebar updates, and cross-links between guide/tutorial/examples/API pages. Addressed 16 Copilot review comments across 3 rounds covering: correct API names (`toolBuilder()`, `model`, `tool.metadata.name`, `.implementSafe()`), accurate return types (`resolveResourcePath` discriminated union, `scanAllSkillRoots` string[] parameter), `@agentforge/tools` install step, file tools in agent configuration, and custom tool naming to avoid collisions. Documentation-only story — VitePress build validated, all quality gates passed. Final story of EP-06 — epic complete.

---

### ST-07001: Scaffold `@agentforge/skills` Package
- **Merged:** 2026-02-25
- **PR:** https://github.com/TVScoundrel/agentforge/pull/52
- **Epic:** EP-07 (Extract Skills into Dedicated Package)
- **Estimate:** 3 hours
- **Outcome:** Scaffolded `@agentforge/skills` workspace package with first-class npm identity (description, keywords for discoverability). Created package.json (v0.14.0, peer dep on core), tsconfig.json, tsup.config.ts (dual ESM/CJS), placeholder src/index.ts, README.md, eslint.config.js. Registered in vitest workspace. Added gray-matter dependency (removal from core deferred to ST-07003). Addressed 8 Copilot review comments across 2 rounds: added README.md and eslint.config.js, removed premature @langchain/core from externals, fixed docs URL, clarified gray-matter timeline; deferred Node16→NodeNext normalization to monorepo-wide chore. All quality gates passed (2336 tests, lint clean). First story of EP-07.

---

### ST-07002: Move Skills Source Files and Re-wire Imports
- **Merged:** 2026-02-25
- **PR:** https://github.com/TVScoundrel/agentforge/pull/53
- **Epic:** EP-07 (Extract Skills into Dedicated Package)
- **Estimate:** 5 hours
- **Outcome:** Migrated 6 skills source files (types, trust, parser, scanner, registry, activation) from `packages/core/src/skills/` to `packages/skills/src/` with imports re-wired from relative core internals to `@agentforge/core` package imports. Updated logger names from `agentforge:core:skills:*` to `agentforge:skills:*`. Updated barrel exports to match previous public API. Moved `zod` from devDependencies to dependencies (runtime usage in activation.ts). Also fixed 9 pre-existing TS2739 typecheck errors in core's logging middleware tests (mock Logger objects missing `isDebugEnabled`/`isLevelEnabled`). Addressed 1 Copilot review comment (zod dependency classification). All quality gates passed (2337 tests, lint clean). Second story of EP-07.

---

### ST-07003: Remove Skills from Core (Breaking Change)
- **Merged:** 2026-02-25
- **PR:** https://github.com/TVScoundrel/agentforge/pull/54
- **Epic:** EP-07 (Extract Skills into Dedicated Package)
- **Estimate:** 3 hours
- **Outcome:** Removed skills system entirely from `@agentforge/core` as a breaking change (clean break, no deprecation shim). Deleted `packages/core/src/skills/` directory (7 files), removed barrel re-export, removed `gray-matter` dependency. Bundle reduction: ESM −16.3% (171.62→143.67 KB), CJS −16.2% (181.15→151.82 KB). Removed 7 dead test files (215 tests) from core — migration to skills package tracked in ST-07004. Original plan called for deprecation re-exports, but circular dependency (core↔skills) made that infeasible, and the skills feature being brand new (EP-06, v0.14.0, no external consumers) justified a clean break. No Copilot review comments. All quality gates passed (2122 tests, lint clean). Third story of EP-07.

---

### ST-07004: Migrate Tests and Fixtures
- **Merged:** 2026-02-25
- **PR:** https://github.com/TVScoundrel/agentforge/pull/55
- **Epic:** EP-07 (Extract Skills into Dedicated Package)
- **Estimate:** 4 hours
- **Outcome:** Migrated all 215 skills tests (7 test files) and 11 fixture skill packs from `packages/core/tests/skills/` to `packages/skills/tests/`. Restored from git history (deleted in ST-07003), updated 15 import paths from `../../src/skills/*` to `../src/*` and 2 imports from `../../src/tools/types.js` to `@agentforge/core`. Fixed fixture layout comment path. Corrected per-file test counts (parser 32, scanner 12). Addressed 2 Copilot review comments. All quality gates passed (2337 tests, lint clean). Fourth story of EP-07.

---

### ST-08001: Establish Explicit `any` Baseline and No-Regression Gate for `src/**`
- **Merged:** 2026-03-09
- **PR:** https://github.com/TVScoundrel/agentforge/pull/59 (commit 27ede91)
- **Epic:** EP-08 (Type Safety Hardening and `no-explicit-any` Debt Burn-Down)
- **Estimate:** 2 hours
- **Outcome:** Added explicit-`any` baseline capture and a no-regression verification gate for `packages/**/src/**/*.ts`, wired the check into CI/lint workflows, and documented local verification behavior in `docs/st08001-explicit-any-baseline-and-gate.md`.

### ST-08002: Hardening Pass 1 for `@agentforge/core` Runtime Hotspots
- **Merged:** 2026-03-10
- **PR:** https://github.com/TVScoundrel/agentforge/pull/60 (commit 78ba4c6)
- **Epic:** EP-08 (Type Safety Hardening and `no-explicit-any` Debt Burn-Down)
- **Estimate:** 4 hours
- **Outcome:** Hardened `@agentforge/core` runtime typing in tool registry/executor and HTTP pool hotspots, added focused `http-pool` tests, and validated reductions in explicit-`any` warnings with story decisions captured in `docs/st08002-core-runtime-type-hardening.md`.

### ST-08003: Hardening Pass 1 for `@agentforge/tools` and `@agentforge/patterns`
- **Merged:** 2026-03-11
- **PR:** https://github.com/TVScoundrel/agentforge/pull/61
- **Epic:** EP-08 (Type Safety Hardening and `no-explicit-any` Debt Burn-Down)
- **Estimate:** 4 hours
- **Outcome:** Reduced explicit-`any` usage across targeted tools/patterns runtime hotspots, added/updated focused multi-agent and neo4j tests, and documented compatibility decisions and warning deltas in `docs/st08003-tools-patterns-type-hardening.md`.

### ST-08004: Test/Example Typing Policy and Targeted Cleanup
- **Merged:** 2026-03-12
- **PR:** https://github.com/TVScoundrel/agentforge/pull/62
- **Epic:** EP-08 (Type Safety Hardening and `no-explicit-any` Debt Burn-Down)
- **Estimate:** 2 hours
- **Outcome:** Added explicit test/example typing policy and ESLint scoping for `no-explicit-any`, reduced low-effort test/example warnings in targeted hotspots, and documented before/after deltas and rationale in `docs/st08004-test-example-typing-policy.md`.

### ST-09001: Harden Core Tool Composition Contracts
- **Merged:** 2026-03-12
- **PR:** https://github.com/TVScoundrel/agentforge/pull/63
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Reworked core tool composition utilities to replace broad `any` contracts with generic `ComposedTool<TInput, TOutput>` and `unknown` boundaries, added focused helpers for conditional-step detection/error normalization/retry-delay calculation, fixed timeout cleanup to clear scheduled handles after `Promise.race` settles, and added focused composition tests plus story documentation. Reduced explicit-`any` warnings in `packages/core/src/tools/composition.ts` from 13 to 0 and improved the workspace `src/**` baseline from 385 to 372.

### ST-09002: Tighten LangChain Converter Runtime Boundary
- **Merged:** 2026-03-13
- **PR:** https://github.com/TVScoundrel/agentforge/pull/64 (commit 3339bf4)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Hardened the LangChain converter boundary by replacing exported `any`-based signatures with generic/runtime-erased contracts, extracting focused helpers for tool-result serialization and JSON-schema extraction, and adding edge-case tests for array and `null` outputs. Reduced explicit-`any` warnings in `packages/core/src/langchain/converter.ts` from 15 to 0 and improved the workspace `src/**` baseline from 372 to 357.

### ST-09003: Strengthen LangGraph State Utility Typing
- **Merged:** 2026-03-13
- **PR:** https://github.com/TVScoundrel/agentforge/pull/65 (commit 91b9465)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Hardened the LangGraph state utility surface by removing explicit `any` from state-channel helpers, preserving config-derived `State` and `Update` inference, and enforcing reducer/update compatibility at the config boundary. Added focused inference and reducer-update regression coverage, recorded explicit-`any` warning deltas in story documentation, and completed full validation before merge.

### ST-09004: Refine Observability Payload Contracts
- **Merged:** 2026-03-17
- **PR:** https://github.com/TVScoundrel/agentforge/pull/66 (commit c20319f)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Introduced shared JSON-safe payload contracts for core observability paths, hardened alert-manager typing across channel/rule/callback boundaries, and added focused regressions for logger payloads, callback failures, metrics-provider failures, and compile-time channel wiring. Reduced explicit-`any` warnings in the touched core observability files from 20 to 0 and improved the `core` baseline from 148 to 128.

### ST-09005: Harden Patterns ReAct Node and Shared Agent Builder Types
- **Merged:** 2026-03-18
- **PR:** https://github.com/TVScoundrel/agentforge/pull/67 (commit 8d85e43)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Hardened the ReAct node and shared agent-builder typing surface by replacing broad `any`-driven boundaries with typed helpers and config-derived generics, restoring `verbose` debug gating, tightening conditional route mappings, and normalizing observation result serialization. Added focused regressions for tool-message fallback, builder routing, and undefined observation handling, and reduced the workspace explicit-`any` baseline from 324 to 305 while improving the `patterns` baseline from 50 to 31.

### ST-09006: Modularize ReAct Node Responsibilities
- **Merged:** 2026-03-18
- **PR:** https://github.com/TVScoundrel/agentforge/pull/68
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Split the ReAct runtime implementation into focused `shared`, `reasoning`, `action`, and `observation` modules while keeping the public `packages/patterns/src/react/nodes.ts` entry point stable. Added regressions for serialization edge cases, deduplication fallback behavior, and missing-iteration scratchpad handling without regressing the explicit-`any` baseline.

### ST-09007: Modularize ReAct Node Test Suite
- **Merged:** 2026-03-20
- **PR:** https://github.com/TVScoundrel/agentforge/pull/69
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Split the ReAct node test surface into focused reasoning, action, and observation suites behind a thin public entrypoint, extracted shared test helpers, and preserved regression coverage for serialization and missing-iteration edge cases without regressing the explicit-`any` baseline.

### ST-09008: Harden Parallel Workflow Builder Typing
- **Merged:** 2026-03-22
- **PR:** https://github.com/TVScoundrel/agentforge/pull/70
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Hardened the `createParallelWorkflow()` public typing surface around schema-derived state and update contracts, removed avoidable builder `any`/`@ts-expect-error` usage, preserved backward compatibility for the deprecated `name` option, and added focused edge-wiring regressions while improving the workspace explicit-`any` baseline from 304 to 295.

### ST-09009: Tighten Ask-Human Interrupt Boundary
- **Merged:** 2026-03-23
- **PR:** https://github.com/TVScoundrel/agentforge/pull/71
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Hardened the ask-human tool’s LangGraph interrupt boundary by replacing broad interrupt import/response casts with typed `unknown` guards, preserving clear compatibility errors, and adding focused regressions for missing dependencies, timeout/default handling, non-string resumes, and nullish resumes. Improved the workspace explicit-`any` baseline from 295 to 292 and the `tools` baseline from 70 to 67.

### ST-09024: Tighten LangGraph Interrupt Type Contracts
- **Merged:** 2026-04-07
- **PR:** https://github.com/TVScoundrel/agentforge/pull/86
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened the shared LangGraph interrupt contracts around generic interrupt typing, JSON-safe custom payloads, JSON-object metadata, and safer resume values while preserving current human-request and approval flows. Improved the workspace explicit-`any` baseline from 195 to 182 and the `core` package from 76 to 63.

### ST-09025: Extract Tool Registry Collection and Search Operations
- **Merged:** 2026-04-08
- **PR:** https://github.com/TVScoundrel/agentforge/pull/87
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Extracted tool registry collection and search behavior into a focused internal helper module while keeping `ToolRegistry` as the stable public entrypoint, preserving lookup behavior for listing, category and tag filtering, and case-insensitive text search. Maintained the explicit-`any` baseline at 182 workspace-wide and 63 in `core` while adding direct coverage for the extracted helper paths.

### ST-09026: Modularize Tool Registry Prompt Rendering and Event Paths
- **Merged:** 2026-04-09
- **PR:** https://github.com/TVScoundrel/agentforge/pull/88
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 4 hours
- **Outcome:** Extracted tool registry prompt rendering, LangChain conversion, and event-emission responsibilities into focused internal helper modules while keeping `ToolRegistry` as the stable public facade. Preserved grouped and minimal prompt generation, safe registry event dispatch, and LangChain conversion behavior while keeping the explicit-`any` baseline flat at 182 workspace-wide and 63 in `core`.

### ST-09032: Tighten Managed Tool Lifecycle Contracts
- **Merged:** 2026-04-24
- **PR:** https://github.com/TVScoundrel/agentforge/pull/95 (commit 74e737c)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened the managed-tool lifecycle surface around unknown-first generic defaults, JSON-safe health metadata, optional context typing, and typed LangChain interop while preserving runtime compatibility. Added focused lifecycle runtime and type coverage, hardened initialization/cleanup concurrency, prevented stale health-check writes across reuse boundaries, and improved the explicit-`any` baseline from 180 to 170 workspace-wide and from 63 to 53 in `core`.

### ST-09038: Extract Data Transformer Object Path Helpers
- **Merged:** 2026-05-07
- **PR:** https://github.com/TVScoundrel/agentforge/pull/107 (commit 8de6392)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Extracted shared transformer helpers for nested value lookup plus object projection/omission, preserved filter and sort behavior across nested objects, functions, and primitive boxing, and intentionally hardened special-key projection against prototype mutation. Added focused regression coverage and reduced touched transformer helper/tool explicit-`any` usage from 6 to 0.

### ST-09042: Tighten SSE Formatter Generic Event Contracts
- **Merged:** 2026-05-13
- **PR:** https://github.com/TVScoundrel/agentforge/pull/111 (commit b7eedcc)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 2 hours
- **Outcome:** Tightened the shared SSE formatter contracts around unknown-first generic defaults, preserved JSON fallback, retry prelude, heartbeat timing, and event ID sequencing, and added a dedicated typecheck regression plus typed runtime mapper coverage while reducing touched SSE explicit-`any` usage from 3 to 0.

### ST-09043: Tighten Error Reporter Context Contracts
- **Merged:** 2026-05-15
- **PR:** https://github.com/TVScoundrel/agentforge/pull/112 (commit da3b408)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened shared error reporter state, metadata, and serialized payload contracts around unknown-first and JSON-safe boundaries, added a source-included typecheck regression for the public error surface, preserved existing runtime error-reporting behavior, and reduced `packages/core/src/langgraph/observability/errors.ts` explicit-`any` usage from 5 to 0.

### ST-09047: Tighten JSON and HTTP Payload Schema Contracts
- **Merged:** 2026-05-21
- **PR:** https://github.com/TVScoundrel/agentforge/pull/117 (commit 6322719)
- **Epic:** EP-09 (SOLID Micro-Refactors and Type Boundary Hardening)
- **Estimate:** 3 hours
- **Outcome:** Tightened JSON and HTTP payload schema boundaries around unknown-first contracts, preserved JSON query/merge and HTTP helper behavior, and incorporated review-driven hardening for array traversal and prototype-pollution-sensitive merge keys. Improved the workspace explicit-`any` baseline from 90 to 84 and the `tools` package from 59 to 53.

---

## Archive Format

When a story is completed and merged, it will be recorded here with:
- Story ID and title
- Merge date
- PR link
- Brief outcome summary

Example:
```
### ST-01001: Setup Drizzle ORM Dependencies and Project Structure
- **Merged:** 2026-02-20
- **PR:** https://github.com/TVScoundrel/agentforge/pull/123
- **Outcome:** Successfully set up Drizzle ORM with PostgreSQL, MySQL, and SQLite support
```
