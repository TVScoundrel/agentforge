# Done Stories Archive

**Purpose:** Track completed and merged stories for the Relational Database Access Tool project.

**Last Updated:** 2026-03-23

---

## Completed Stories

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
