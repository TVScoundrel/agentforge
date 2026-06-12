# Epics and Stories: Relational Database Access Tool

## Epic Overview

### EP-01: Core Database Connection Management
**Capability:** Establish and manage vendor-agnostic database connections with pooling and lifecycle management.

**Outcomes:**
- Developers can connect to PostgreSQL, MySQL, and SQLite databases
- Connection pooling prevents resource exhaustion
- Graceful connection lifecycle management (open, close, health checks)

**Stories:** ST-01001 through ST-01004

---

### EP-02: Query Execution and CRUD Operations
**Capability:** Execute type-safe CRUD operations and raw SQL queries across all supported databases.

**Outcomes:**
- Agents can perform SELECT, INSERT, UPDATE, DELETE operations
- Type-safe query building prevents runtime errors
- Raw SQL execution available for complex queries
- Parameterized queries prevent SQL injection

**Stories:** ST-02001 through ST-02006

---

### EP-03: Schema Introspection and Metadata
**Capability:** Inspect database schemas and provide metadata to agents for informed query building.

**Outcomes:**
- Agents can discover available tables and columns
- Schema information aids in dynamic query generation
- Type information helps with data validation

**Stories:** ST-03001 through ST-03002

---

### EP-04: Advanced Features and Optimization
**Capability:** Support transactions, batch operations, and performance optimizations.

**Outcomes:**
- Multi-step operations can be wrapped in transactions
- Batch operations improve performance for bulk data
- Large result sets can be streamed efficiently

**Stories:** ST-04001 through ST-04003

---

### EP-05: Documentation, Examples, and Testing - Complete
**Capability:** Comprehensive documentation, examples, and test coverage for production readiness.

**Outcomes:**
- Developers have clear examples for each database vendor
- All tools are thoroughly tested
- Integration examples demonstrate real-world usage

**Stories:** ST-05001 through ST-05005

---

### EP-06: Agent Skills Compatibility Layer
**Capability:** Enable AgentForge agents to discover, select, and activate reusable skills compatible with the Agent Skills specification.

**Outcomes:**
- Developers can enable SKILL.md-driven capabilities without bespoke glue code per agent
- Skill selection is deterministic, observable, and configurable
- Skill loading follows progressive disclosure (metadata first, full instructions on activation)
- Runtime guardrails enforce trust boundaries for skill resources and scripts

**Stories:** ST-06001 through ST-06006

---

### EP-07: Extract Skills into Dedicated Package
**Capability:** Establish `@agentforge/skills` as a first-class, independently adoptable composable skill system — not a code move, but a positioning move.

**Outcomes:**
- `@agentforge/core` remains focused on orchestration/runtime primitives (tool builder, state, middleware, streaming, observability)
- `@agentforge/skills` stands alone with its own identity: "Composable skill system for building modular AI agents in TypeScript" (part of the AgentForge ecosystem, depends on `@agentforge/core`)
- Skills-specific dependency (`gray-matter`) no longer ships with core
- Skills-related keywords (`agent-skills`, `llm-skills`, `composable-agents`, `modular-agents`, `skill-authoring`) concentrated in the skills package, removed from core to prevent keyword dilution
- Public API migrates from `@agentforge/core` to `@agentforge/skills` with deprecation re-exports in core for one minor version

**Strategic Principles:**
1. **First-class identity** — The package description should convey what skills *does* without requiring prior AgentForge knowledge — making it discoverable to developers searching for agent skill systems.
2. **Clean keyword separation** — Remove skills vocabulary from core's package.json, README, and description. Core owns orchestration/runtime; skills owns agent-skills/modular-agents.
3. **Discoverability** — Keywords and description should attract developers searching for agent capabilities to the AgentForge ecosystem.

**Stories:** ST-07001 through ST-07006

---

### EP-08: Type Safety Hardening and `no-explicit-any` Debt Burn-Down
**Capability:** Improve runtime type safety and reduce lint warning debt by removing high-risk explicit `any` usage and enforcing a no-regression gate.

**Outcomes:**
- Runtime-facing code paths in `core`, `tools`, and `patterns` use stronger typing (`unknown` + narrowing, explicit generics) instead of broad `any`
- Lint noise is reduced and warning regressions are prevented for `src/**` code
- Tests/examples have a clear, documented policy for intentional `any` usage to avoid ambiguous warning debt

**Fix-mode New Epic Exception Rationale:**
- This remediation is cross-cutting and does not fit existing feature epics (EP-01 through EP-07 are domain-specific and complete).
- It establishes a durable capability boundary for ongoing engineering quality controls (type-safety governance + warning regression controls).

**Stories:** ST-08001 through ST-08004

---

### EP-09: SOLID Micro-Refactors and Type Boundary Hardening
**Capability:** Deliver small, daily, behavior-preserving refactors that improve SRP/ISP boundaries and remove high-value explicit `any` usage in runtime code.

**Outcomes:**
- Core extension points expose narrower, generic-first contracts instead of broad `any` payloads
- Cross-package utility modules become easier to test and reason about through extracted helpers and clearer responsibilities
- Explicit-`any` warnings continue trending down from the current `153` `src/**` baseline without regressions
- Story slices are intentionally small (1 day each) so quality improvements can ship continuously
- Lightweight quality-gate follow-ups keep release/build feedback tight by reducing stale warning caps and easy package metadata warnings

**Stories:** ST-09001 through ST-09074

---

### EP-10: Documentation Only Changes
**Capability:** Maintain a standing, docs-only improvement lane for markdown cleanup, style normalization, accuracy updates, and lightweight documentation governance across the repository.

**Outcomes:**
- Project-owned markdown stays readable and stylistically consistent without decorative noise
- Public docs, planning docs, internal docs, and example/template READMEs can be improved through low-risk, reviewable stories
- Documentation-only cleanup work has a durable home instead of being forced into runtime epics
- The epic remains open as an evergreen intake lane even when there are temporarily no active stories, so future docs-only work can be added without reopening or redefining the capability boundary

**Stories:** ST-10001 through ST-10006

#### Feature Context: Documentation Only Changes (from `planning/features/10-documentation-only-changes-feature-plan.md`)

- Goal:
  - Establish a standing docs-only cleanup track for markdown style normalization, with the current initial slice focused on emoji overuse in project-owned `.md` files.
- Scope:
  - In:
    - Markdown audits, README/docs cleanup, planning/internal docs cleanup, example/template docs cleanup, and documentation style guardrails.
  - Out:
    - Runtime code changes, behavior changes, API redesigns, and broad content rewrites unrelated to documentation consistency.
- Critical edge cases:
  - Preserve meaningful non-emoji Unicode such as arrows, legal symbols, and literal sample output where those characters are part of the documented behavior.
  - Keep changes reviewable by splitting public docs, internal docs, and examples/templates into separate stories after the initial audit.
- Delivery controls:
  - Treat EP-10 as evergreen and leave it open even when no stories are currently queued.

---

## Stories

### Epic 01: Core Database Connection Management

#### ST-01001: Setup Drizzle ORM Dependencies and Project Structure
**User story:** As a developer, I want the relational database package structure set up so that I can start implementing database tools.

**Priority:** P0 (Critical)
**Estimate:** 2 hours
**Dependencies:** None

**Acceptance criteria:**
- [ ] Drizzle ORM packages installed as dependencies (drizzle-orm, drizzle-kit)
- [ ] Database drivers configured as peer dependencies (pg, mysql2, better-sqlite3)
- [ ] Database drivers installed as dev dependencies for testing (@types/pg, @types/better-sqlite3)
- [ ] Package.json includes peer dependency warnings and installation instructions
- [ ] Directory structure created under `packages/tools/src/data/relational/`
- [ ] TypeScript configuration supports Drizzle types
- [ ] Package exports configured in `packages/tools/package.json`
- [ ] Runtime checks for missing peer dependencies with helpful error messages

---

#### ST-01002: Implement Connection Manager
**User story:** As a developer, I want a connection manager that handles database connections so that I can connect to different database vendors.

**Priority:** P0 (Critical)
**Estimate:** 4 hours
**Dependencies:** ST-01001

**Acceptance criteria:**
- [ ] ConnectionManager class supports PostgreSQL, MySQL, SQLite
- [ ] Connection configuration accepts vendor-specific options
- [ ] Environment variable support for connection strings
- [ ] Connection validation on initialization
- [ ] Graceful error handling for connection failures
- [ ] TypeScript types for all connection configurations

---

#### ST-01003: Implement Connection Pooling
**User story:** As a developer, I want connection pooling so that my application efficiently manages database connections.

**Priority:** P0 (Critical)
**Estimate:** 3 hours
**Dependencies:** ST-01002

**Acceptance criteria:**
- [ ] Connection pool configuration (min, max connections)
- [ ] Automatic connection reuse
- [ ] Connection timeout handling
- [ ] Pool exhaustion error handling
- [ ] Connection health checks
- [ ] Resource cleanup on pool shutdown

---

#### ST-01004: Implement Connection Lifecycle Management
**User story:** As a developer, I want proper connection lifecycle management so that resources are properly cleaned up.

**Priority:** P1 (High)
**Estimate:** 2 hours
**Dependencies:** ST-01003

**Acceptance criteria:**
- [ ] `connect()` method initializes connection/pool
- [ ] `disconnect()` method closes all connections gracefully
- [ ] `isConnected()` method checks connection status
- [ ] Automatic reconnection on connection loss (configurable)
- [ ] Event emitters for connection state changes
- [ ] Proper cleanup in error scenarios

---

### Epic 02: Query Execution and CRUD Operations

#### ST-02001: Implement Raw SQL Query Execution Tool
**User story:** As an agent, I want to execute raw SQL queries so that I can perform complex database operations.

**Priority:** P0 (Critical)
**Estimate:** 4 hours
**Dependencies:** ST-01003

**Acceptance criteria:**
- [ ] `relational-query` tool executes parameterized SQL
- [ ] Support for SELECT, INSERT, UPDATE, DELETE, and other SQL statements
- [ ] Parameter binding prevents SQL injection
- [ ] Result formatting to JSON
- [ ] Error handling with sanitized messages
- [ ] Tool schema with clear input/output descriptions

---

#### ST-02002: Implement Type-Safe SELECT Tool
**User story:** As an agent, I want a type-safe SELECT tool so that I can query data without writing raw SQL.

**Priority:** P0 (Critical)
**Estimate:** 5 hours
**Dependencies:** ST-02001

**Acceptance criteria:**
- [ ] `relational-select` tool with Drizzle query builder
- [ ] Support for WHERE conditions
- [ ] Support for ORDER BY and LIMIT
- [ ] Support for basic column selection
- [ ] Type-safe result mapping
- [ ] Clear error messages for invalid queries

---

#### ST-02003: Implement Type-Safe INSERT Tool
**User story:** As an agent, I want a type-safe INSERT tool so that I can add data to the database safely.

**Priority:** P0 (Critical)
**Estimate:** 4 hours
**Dependencies:** ST-02002

**Acceptance criteria:**
- [ ] `relational-insert` tool with Drizzle query builder
- [ ] Support for single and multiple row inserts
- [ ] Return inserted row IDs or full rows (configurable)
- [ ] Type validation for input data
- [ ] Constraint violation error handling
- [ ] Support for default values and auto-increment fields

---

#### ST-02004: Implement Type-Safe UPDATE Tool
**User story:** As an agent, I want a type-safe UPDATE tool so that I can modify existing data safely.

**Priority:** P0 (Critical)
**Estimate:** 4 hours
**Dependencies:** ST-02003

**Acceptance criteria:**
- [ ] `relational-update` tool with Drizzle query builder
- [ ] Support for WHERE conditions (required for safety)
- [ ] Return count of affected rows
- [ ] Type validation for update data
- [ ] Prevent accidental full-table updates (require explicit flag)
- [ ] Optimistic locking support (optional)

---

#### ST-02005: Implement Type-Safe DELETE Tool
**User story:** As an agent, I want a type-safe DELETE tool so that I can remove data safely.

**Priority:** P0 (Critical)
**Estimate:** 3 hours
**Dependencies:** ST-02004

**Acceptance criteria:**
- [ ] `relational-delete` tool with Drizzle query builder
- [ ] Support for WHERE conditions (required for safety)
- [ ] Return count of deleted rows
- [ ] Prevent accidental full-table deletes (require explicit flag)
- [ ] Cascade delete handling
- [ ] Soft delete support (optional)

---

#### ST-02006: Implement SQL Sanitization and Security
**User story:** As a developer, I want SQL input sanitization so that the tools are secure against injection attacks.

**Priority:** P0 (Critical)
**Estimate:** 3 hours
**Dependencies:** ST-02001

**Acceptance criteria:**
- [ ] SQL sanitizer utility validates and escapes inputs
- [ ] Parameterized query enforcement
- [ ] Dangerous SQL pattern detection (DROP, TRUNCATE in user input)
- [ ] Input validation for table and column names
- [ ] Security documentation and best practices
- [ ] Unit tests for common injection patterns

---

### Epic 03: Schema Introspection and Metadata

#### ST-03001: Implement Schema Introspection Tool
**User story:** As an agent, I want to inspect database schemas so that I can understand the available tables and columns.

**Priority:** P1 (High)
**Estimate:** 5 hours
**Dependencies:** ST-01003

**Acceptance criteria:**
- [ ] `relational-get-schema` tool returns database schema
- [ ] Lists all tables in the database
- [ ] Lists columns for each table with types
- [ ] Includes primary key and foreign key information
- [ ] Includes index information
- [ ] Works across PostgreSQL, MySQL, and SQLite
- [ ] Cached schema with TTL (configurable)

---

#### ST-03002: Implement Schema Metadata Utilities
**User story:** As a developer, I want schema metadata utilities so that tools can validate queries against the schema.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-03001

**Acceptance criteria:**
- [ ] Schema validator checks table existence
- [ ] Column validator checks column existence and types
- [ ] Type mapper converts DB types to TypeScript types
- [ ] Schema diff utility (for testing)
- [ ] Schema export to JSON format

---

### Epic 04: Advanced Features and Optimization

#### ST-04001: Implement Transaction Support
**User story:** As an agent, I want to execute multiple operations in a transaction so that I can ensure data consistency.

**Priority:** P1 (High)
**Estimate:** 6 hours
**Dependencies:** ST-02005

**Acceptance criteria:**
- [ ] Transaction wrapper for multiple operations
- [ ] Automatic rollback on error
- [ ] Commit on success
- [ ] Nested transaction support (savepoints)
- [ ] Transaction isolation level configuration
- [ ] Timeout handling for long transactions

---

#### ST-04002: Implement Batch Operations
**User story:** As an agent, I want to execute batch operations so that I can efficiently process large datasets.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-02003

**Acceptance criteria:**
- [ ] Batch insert with configurable batch size
- [ ] Batch update with configurable batch size
- [ ] Batch delete with configurable batch size
- [ ] Progress reporting for large batches
- [ ] Error handling with partial success reporting
- [ ] Performance benchmarks vs individual operations

---

#### ST-04003: Implement Result Streaming
**User story:** As a developer, I want result streaming for large queries so that memory usage remains bounded.

**Priority:** P2 (Medium)
**Estimate:** 5 hours
**Dependencies:** ST-02002

**Acceptance criteria:**
- [ ] Streaming SELECT results for large datasets
- [ ] Configurable chunk size
- [ ] Backpressure handling
- [ ] Memory usage benchmarks
- [ ] Integration with Node.js streams
- [ ] Example usage in documentation

---

### Epic 05: Documentation, Examples, and Testing

#### ST-05001: Implement Comprehensive Unit Tests
**User story:** As a developer, I want comprehensive unit tests so that I can trust the reliability of the database tools.

**Priority:** P0 (Critical)
**Estimate:** 8 hours
**Dependencies:** ST-02006, ST-03002

**Acceptance criteria:**
- [ ] Unit tests for all connection management functions
- [ ] Unit tests for all CRUD operations
- [ ] Unit tests for schema introspection
- [ ] Unit tests for SQL sanitization
- [ ] Mock database tests (no real DB required)
- [ ] Test coverage > 90%
- [ ] All tests pass with `pnpm test`

---

#### ST-05002: Implement Integration Tests
**User story:** As a developer, I want integration tests with real databases so that I can verify cross-vendor compatibility.

**Priority:** P1 (High)
**Estimate:** 6 hours
**Dependencies:** ST-05001

**Acceptance criteria:**
- [ ] Integration tests for PostgreSQL (using testcontainers or similar)
- [ ] Integration tests for MySQL (using testcontainers or similar)
- [ ] Integration tests for SQLite (in-memory)
- [ ] Test data fixtures for consistent testing
- [ ] CI/CD integration for automated testing
- [ ] Performance benchmarks

---

#### ST-05003: Create Usage Examples and Documentation
**User story:** As a developer, I want clear examples and documentation so that I can quickly integrate the database tools.

**Priority:** P1 (High)
**Estimate:** 6 hours
**Dependencies:** ST-02006, ST-03001

**Acceptance criteria:**
- [ ] README.md with overview and quick start
- [ ] Example for PostgreSQL connection and queries
- [ ] Example for MySQL connection and queries
- [ ] Example for SQLite connection and queries
- [ ] Example integrating with AgentForge ReAct pattern
- [ ] API documentation for all exported functions
- [ ] Security best practices documentation

---

#### ST-05004: Create Advanced Integration Examples
**User story:** As a developer, I want advanced examples so that I can understand complex use cases.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-04001, ST-05003

**Acceptance criteria:**
- [ ] Example using transactions
- [ ] Example using batch operations
- [ ] Example using result streaming
- [ ] Example building a multi-agent system with shared database
- [ ] Example with error handling and retry logic
- [ ] Performance optimization guide

---

#### ST-05005: Document Relational Database Tools in Public Docs Site
**User story:** As a developer visiting the AgentForge documentation site, I want comprehensive documentation for the relational database tools so that I can learn how to connect to databases, run queries, and build data-powered agents.

**Priority:** P1 (High)
**Estimate:** 5 hours
**Dependencies:** ST-05003 (merged), ST-05004 (merged)

**Acceptance criteria:**
- [ ] Guide page at `guide/concepts/database.md` covering ConnectionManager, CRUD tools, schema introspection, transactions, batch operations, streaming, and security
- [ ] Tutorial page at `tutorials/database-agent.md` with step-by-step walkthrough of building a database-powered agent
- [ ] API reference section added to `api/tools.md` documenting all relational tools (relationalQuery, relationalSelect, relationalInsert, relationalUpdate, relationalDelete, relationalGetSchema) and ConnectionManager
- [ ] VitePress sidebar updated with new page entries in `config.ts`
- [ ] All code examples are syntactically correct and consistent with actual tool APIs
- [ ] Cross-references link to internal examples (from ST-05003/ST-05004) and related guides
- [ ] Documentation site builds without errors

---

### Epic 06: Agent Skills Compatibility Layer

#### Feature Context: Agent Skills Compatibility (from `planning/features/06-agent-skills-compatibility-feature-plan.md`)

- Goal: add first-class Agent Skills support (https://agentskills.io) so AgentForge agents can discover and use reusable `SKILL.md` capabilities via tool calls.
- Central construct: **`SkillRegistry`** — mirrors `ToolRegistry` but uses folder-based auto-discovery instead of programmatic registration. Configured with `skillRoots: string[]`, it scans folders at init, parses `SKILL.md` frontmatter, and exposes `generatePrompt()` → `<available_skills>` XML.
- Integration approach: **tool-based** — agents activate skills on demand via `activate-skill` and `read-skill-resource` tools backed by the SkillRegistry. The LLM decides when to activate; no framework-level AI matching.
- Scope:
  - In: `SkillRegistry` with folder-config auto-discovery, frontmatter parsing per spec, `skillRegistry.generatePrompt()` for system prompt injection, activation/resource tools, trust policies, conformance tests.
  - Out: remote skill marketplaces, automatic download/install from third-party registries, programmatic skill registration, non-markdown skill formats, framework-level AI matching/ranking.
- Progressive disclosure (per spec): metadata at startup (~100 tokens/skill) → full SKILL.md on activation (< 5000 tokens) → referenced resources on demand.
- Critical edge cases:
  - malformed or missing frontmatter fields,
  - conflicting skill names across roots,
  - path traversal or unsafe script execution attempts,
  - skill name not matching parent directory name.
- Delivery controls:
  - feature flag for rollout (`agentSkills.enabled`),
  - structured activation/load telemetry,
  - explicit rollback path to disable skill loading while preserving baseline agent behavior.

#### ST-06001: Implement SkillRegistry with Folder-Config Auto-Discovery
**User story:** As a framework developer, I want a `SkillRegistry` class that auto-discovers skills from configured folder paths so that skill metadata is available at startup without programmatic registration.

**Priority:** P0 (Critical)
**Estimate:** 5 hours
**Dependencies:** None

**Acceptance criteria:**
- [ ] `SkillRegistry` class accepts `skillRoots: string[]` configuration (`.agentskills/`, `$HOME/.agentskills/`, plus runtime-configured paths)
- [ ] Registry auto-scans configured roots at init — a skill is recognized when a directory contains a valid `SKILL.md`
- [ ] Frontmatter parser extracts all spec fields: `name` (required), `description` (required), `license`, `compatibility`, `metadata`, `allowed-tools`
- [ ] Parser validates `name` field constraints per spec (1-64 chars, lowercase alphanumeric + hyphens, must match parent directory name)
- [ ] Parser validates `description` field (1-1024 chars, non-empty)
- [ ] Invalid skills are skipped with actionable structured warnings (without aborting runtime startup)
- [ ] Duplicate skill names across roots are handled with deterministic precedence and warnings
- [ ] Query API: `.get(name)`, `.getAll()`, `.has(name)`, `.size()` — parallel to ToolRegistry
- [ ] Events: `skill:discovered`, `skill:warning` emitted during scan for observability
- [ ] Unit tests cover root scanning, frontmatter parsing, name validation, duplicate handling, and malformed skill recovery

---

#### ST-06002: Implement SkillRegistry.generatePrompt() and System Prompt Integration
**User story:** As an agent developer, I want `skillRegistry.generatePrompt()` to produce `<available_skills>` XML so I can include it in system prompts the same way I use `toolRegistry.generatePrompt()` for tools.

**Priority:** P0 (Critical)
**Estimate:** 5 hours
**Dependencies:** ST-06001

**Acceptance criteria:**
- [ ] `SkillRegistry.generatePrompt()` returns `<available_skills>` XML block (name + description per skill)
- [ ] `generatePrompt({ skills?: string[] })` accepts optional subset filter — only named skills appear in XML, enabling focused agents with different skill sets
- [ ] XML generation follows the format recommended by the Agent Skills integration guide
- [ ] Prompt output integrates naturally with AgentForge's existing prompt construction (composable with `toolRegistry.generatePrompt()`)
- [ ] `agentSkills.enabled` feature flag (default: off) gates prompt generation (returns empty string when disabled)
- [ ] Configurable `maxDiscoveredSkills` cap limits prompt token usage
- [ ] Agents without skills enabled continue to operate with unmodified system prompts
- [ ] Unit tests validate XML generation, subset filtering, feature flag gating, prompt composition, and token budget limits

---

#### ST-06003: Implement Skill Activation and Resource Tools
**User story:** As an agent at runtime, I want to activate a skill by name and optionally load its referenced resources so that I can follow skill instructions to complete user tasks.

**Priority:** P0 (Critical)
**Estimate:** 7 hours
**Dependencies:** ST-06002

**Acceptance criteria:**
- [ ] `activate-skill` tool built with AgentForge tool builder API: takes skill name, resolves via SkillRegistry, returns full SKILL.md body content
- [ ] `read-skill-resource` tool built with AgentForge tool builder API: takes skill name + relative path, resolves via SkillRegistry, returns file content
- [ ] `SkillRegistry.toActivationTools()` convenience method returns both tools pre-wired to the registry instance
- [ ] Resource paths are resolved relative to the skill root directory (per spec: `scripts/`, `references/`, `assets/`)
- [ ] Path traversal is blocked — resource resolution must stay within the skill root
- [ ] Activating a non-existent or invalid skill returns a clear error message
- [ ] Reading a missing resource file returns an actionable error without crashing the agent
- [ ] Both tools emit structured logs for activation events and resource loads (events: `skill:activated`, `skill:resource-loaded`)
- [ ] Tools are registered in a `SKILLS` tool category and can be added to any agent pattern
- [ ] Integration tests validate end-to-end activation against fixture skill packs (valid + missing + traversal attempts)

---

#### ST-06004: Implement Skill Trust Policies and Execution Guardrails
**User story:** As a platform owner, I want explicit trust controls for skills so that agents cannot execute unsafe skill resources.

**Priority:** P1 (High)
**Estimate:** 6 hours
**Dependencies:** ST-06003

**Acceptance criteria:**
- [ ] Trust policy levels (`workspace`, `trusted`, `untrusted`) are configurable per skill root
- [ ] `read-skill-resource` enforces trust policy before returning script content from `scripts/` directories
- [ ] Script content from untrusted roots is denied by default unless explicitly allowed
- [ ] `allowed-tools` frontmatter field is parsed and made available for agent tool filtering
- [ ] Guardrail decisions are logged with policy reason codes for auditing
- [ ] Security tests validate path traversal blocking, untrusted script denial, and policy escalation
- [ ] Operational docs define secure defaults and trust escalation workflow

---

#### ST-06005: Publish Agent Skills Integration Documentation and Conformance Suite
**User story:** As a developer, I want clear docs and conformance checks so that I can enable Agent Skills confidently and author spec-compliant skills.

**Priority:** P1 (High)
**Estimate:** 6 hours
**Dependencies:** ST-06003, ST-06004

**Acceptance criteria:**
- [x] Developer guide documents how to enable and configure Agent Skills in AgentForge
- [x] Skill authoring guide maps Agent Skills spec fields to AgentForge behavior
- [x] End-to-end demo shows an agent activating and using two skills from different roots via tool calls
- [x] Conformance test suite covers discovery, prompt injection, tool activation, resource loading, and trust policies
- [x] Fixture skill packs include valid, malformed, and untrusted examples
- [x] CI job runs conformance suite and fails on regressions
- [x] Rollout checklist includes feature-flag enablement, observability checks, and rollback procedure

---

#### ST-06006: Comprehensive Docs-Site Documentation for Agent Skills
**User story:** As a developer visiting the docs site, I want tutorials, examples, and API reference pages for Agent Skills so that I can learn the feature end-to-end without reading source code.

**Priority:** P1 (High)
**Estimate:** 5 hours
**Dependencies:** ST-06005

**Acceptance criteria:**
- [x] VitePress sidebar updated: new "Agent Skills" section in the Guide sidebar linking to `agent-skills.md` and `agent-skills-authoring.md`
- [x] Tutorial page (`tutorials/skill-powered-agent.md`) walks through building a skill-powered agent step-by-step (comparable to `tutorials/database-agent.md`)
- [x] Examples page (`examples/agent-skills.md`) demonstrates common skill usage patterns with runnable code snippets (registry setup, prompt generation, activation tools, trust policies, events)
- [x] API reference section in `api/core.md` documents `SkillRegistry` public API (`constructor`, `get`, `getAll`, `has`, `size`, `generatePrompt`, `toActivationTools`, `getAllowedTools`, events)
- [x] VitePress sidebar updated: tutorial and examples pages linked in their respective nav sections
- [x] All new pages follow existing docs-site conventions (frontmatter, code highlighting, tip/warning callouts)
- [x] Cross-links between guide, tutorial, examples, and API reference pages for discoverability
- [x] `pnpm --filter docs-site dev` builds without dead-link warnings for new pages

---

### Epic 07: Extract Skills into Dedicated Package

#### ST-07001: Scaffold `@agentforge/skills` Package
**User story:** As a maintainer, I want a new `packages/skills` workspace package with first-class identity and standard monorepo scaffolding so that the skills system is independently positionable.

**Priority:** P0 (Critical)
**Estimate:** 3 hours
**Dependencies:** None (EP-06 complete)

**Acceptance criteria:**
- [ ] `packages/skills/` created with `package.json`, `tsconfig.json`, `tsup.config.ts` matching monorepo conventions
- [ ] Package description is clear and discoverable while acknowledging AgentForge: e.g. "Composable skill system for building modular AI agents in TypeScript, part of the AgentForge framework"
- [ ] Keywords optimized for independent discoverability: `agent-skills`, `llm-skills`, `composable-agents`, `modular-agents`, `skill-authoring`, `agent-capabilities`, `typescript`
- [ ] `@agentforge/core` listed as a peer dependency (and dev dependency)
- [ ] `gray-matter` dependency moved from core's `package.json` to skills' `package.json`
- [ ] Dual ESM/CJS build outputs configured (`dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`)
- [ ] Package registered in `pnpm-workspace.yaml`
- [ ] `pnpm install` and `pnpm -r build` succeed with the new package present
- [ ] Vitest workspace config updated to include `packages/skills`
- [ ] Update `docs-site/changelog.md` `[Unreleased]` section with changes from this story (or document why not applicable)

---

#### ST-07002: Move Skills Source Files and Re-wire Imports Merged
**User story:** As a developer, I want the skills source code to live in `packages/skills/src/` with correct imports so that the module is self-contained.

**Priority:** P0 (Critical)
**Estimate:** 5 hours
**Dependencies:** ST-07001
**Status:** Merged (PR #53, 2026-02-25)

**Acceptance criteria:**
- [x] All files from `packages/core/src/skills/` moved to `packages/skills/src/`
- [x] Internal relative imports (`../tools/builder.js`, `../tools/types.js`, `../langgraph/observability/logger.js`) replaced with `@agentforge/core` package imports
- [x] `packages/skills/src/index.ts` barrel export matches the previous public surface from `packages/core/src/skills/index.ts`
- [x] `ToolCategory.SKILLS` enum value remains in `@agentforge/core` (it's a core primitive)
- [x] `pnpm -r build` succeeds; `@agentforge/skills` produces valid ESM/CJS output
- [x] TypeScript strict mode passes with no new errors
- [x] Update `docs-site/changelog.md` `[Unreleased]` section with changes from this story (or document why not applicable)

---

#### ST-07003: Add Deprecation Re-exports in Core and Clean Keywords
**User story:** As a consumer who imports skills from `@agentforge/core`, I want my existing imports to keep working (with a deprecation warning) for one minor version, and I want core's public identity to reflect its orchestration focus.

**Priority:** P1 (High)
**Estimate:** 3 hours
**Dependencies:** ST-07002

**Acceptance criteria:**
- [ ] `packages/core/src/skills/index.ts` replaced with thin re-exports from `@agentforge/skills`
- [ ] Each re-export annotated with `@deprecated` JSDoc pointing to `@agentforge/skills`
- [ ] `@agentforge/skills` added as an optional peer dependency of core (for the shim)
- [ ] Console deprecation warning emitted once per process when the shim is loaded
- [ ] TypeScript `@deprecated` tag causes IDE strikethrough on old imports
- [ ] `gray-matter` removed from core's `dependencies`
- [ ] Core build and bundle size verified (smaller without skills code)
- [ ] Skills-related keywords removed from core's `package.json` (no `agent-skills`, `skill-*` terms)
- [ ] Core's description and README focused on orchestration/runtime primitives only
- [ ] Update `docs-site/changelog.md` `[Unreleased]` section with changes from this story (or document why not applicable)

---

#### ST-07004: Migrate Tests and Fixtures
**User story:** As a maintainer, I want the 215+ skills tests and fixture packs to live alongside the skills package so that test ownership is clear.

**Priority:** P0 (Critical)
**Estimate:** 4 hours
**Dependencies:** ST-07002

**Acceptance criteria:**
- [ ] All skills tests moved from `packages/core/tests/` (or `src/__tests__/`) to `packages/skills/tests/`
- [ ] Fixture skill packs moved to `packages/skills/tests/fixtures/`
- [ ] Test imports updated from `@agentforge/core` skills paths to `@agentforge/skills` or relative paths
- [ ] `pnpm test --run` passes with 0 regressions (same test count, same coverage)
- [ ] Conformance suite runs as part of skills package test suite
- [ ] Update `docs-site/changelog.md` `[Unreleased]` section with changes from this story (or document why not applicable)

---

#### ST-07005: Update Documentation and Examples
**User story:** As a developer, I want the docs-site, README, and examples to reference `@agentforge/skills` so that new users install the right package.

**Priority:** P1 (High)
**Estimate:** 4 hours
**Dependencies:** ST-07003, ST-07004

**Acceptance criteria:**
- [ ] Docs-site guide, tutorial, examples, and API reference pages updated: install instructions reference `@agentforge/skills`
- [ ] Import paths in code samples changed from `@agentforge/core` to `@agentforge/skills`
- [ ] Migration note added to `docs-site/guide/migration.md` documenting the move
- [ ] `examples/applications/skill-aware-agent` updated to depend on `@agentforge/skills`
- [ ] Root `README.md` package table updated to include `@agentforge/skills`
- [ ] `docs-site/changelog.md` entry drafted for next release
- [ ] Add or update story documentation at `docs/st07005-skills-package-docs-migration.md`
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Update `docs-site/changelog.md` `[Unreleased]` section with changes from this story (or document why not applicable)
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results

---

#### ST-07006: Update Release Scripts and Checklist for Skills Package
**User story:** As a release engineer, I want the release scripts and checklists to include `@agentforge/skills` so that the package is not overlooked during version bumps, publishing, and verification.

**Priority:** P1 (High)
**Estimate:** 2 hours
**Dependencies:** ST-07001

**Acceptance criteria:**
- [ ] `scripts/release.sh` — `PACKAGE_FILES` array includes `packages/skills/package.json`
- [ ] `scripts/publish.sh` — `PACKAGES` array includes `packages/skills` in correct dependency order (after core, before cli)
- [ ] `scripts/convert-workspace-deps.mjs` — workspace package list includes `'skills'`
- [ ] `RELEASE_CHECKLIST.md` — skills added to version bump, publish, and verify sections
- [ ] `.ai/RELEASE_PROCESS.md` — skills added to step 1 (version bump), step 8 (publish), step 9 (verify), quick checklist, and task template
- [ ] CLI templates that reference `@agentforge/skills` (if any exist) are covered by `release.sh`
- [ ] Add or update story documentation (or document why not required)
- [ ] Update `docs-site/changelog.md` `[Unreleased]` section with changes from this story (or document why not applicable)
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results

---

### Epic 08: Type Safety Hardening and `no-explicit-any` Debt Burn-Down

#### Fix Context: Explicit `any` Warning Debt and Runtime Type Weakness
- Symptom: Large workspace baseline of `@typescript-eslint/no-explicit-any` warnings, including runtime-facing `src/**` code.
- Impact: Reduced static guarantees in critical paths and noisy lint output that obscures meaningful regressions.
- Root-cause hypothesis: Historical velocity favored permissive typings (`any`, `as any`, broad records) and there is no no-regression gate for `src/**`.
- Owning epic(s): EP-08
- Rollback/safety control: Keep changes behavior-preserving, scoped per story, and require full test + lint verification before PR readiness.

#### ST-08001: Establish Explicit `any` Baseline and No-Regression Gate for `src/**`
**User story:** As a maintainer, I want an explicit-any baseline and a no-regression guard in CI so that warning debt cannot grow while remediation proceeds incrementally.

**Priority:** P0 (Critical)
**Estimate:** 2 hours
**Dependencies:** None
**Status:** Merged (PR #59, 2026-03-09)

**Acceptance criteria:**
- [ ] Baseline counts for `@typescript-eslint/no-explicit-any` are captured for `packages/**/src/**/*.ts` and documented in the story documentation
- [ ] A CI/verification command fails if explicit-`any` warnings in `src/**` increase above the committed baseline
- [ ] Verification command is documented and runnable locally
- [ ] Existing lint workflow remains compatible (no regressions to current lint/test scripts)
- [ ] Add or update story documentation at `docs/st08001-explicit-any-baseline-and-gate.md`

---

#### ST-08002: Hardening Pass 1 for `@agentforge/core` Runtime Hotspots
**User story:** As a maintainer, I want to replace high-risk explicit `any` usage in core runtime paths so that core APIs and execution flows have stronger compile-time guarantees.

**Priority:** P1 (High)
**Estimate:** 4 hours
**Dependencies:** ST-08001
**Status:** Merged (PR #60, 2026-03-10)

**Acceptance criteria:**
- [ ] High-volume `@typescript-eslint/no-explicit-any` warnings are reduced in `packages/core/src/tools/registry.ts`, `packages/core/src/tools/executor.ts`, and `packages/core/src/resources/http-pool.ts`
- [ ] Replacements use `unknown` + narrowing, concrete generics, or stronger domain types instead of reintroducing `any`
- [ ] No behavior regressions in existing unit/integration tests for touched areas
- [ ] Story docs summarize key type-design decisions and narrowing patterns used
- [ ] Add or update story documentation at `docs/st08002-core-runtime-type-hardening.md`

---

#### ST-08003: Hardening Pass 1 for `@agentforge/tools` and `@agentforge/patterns`
**User story:** As a maintainer, I want to reduce explicit `any` usage in tools/patterns runtime surfaces so that downstream consumers get safer type inference and fewer runtime type ambiguities.

**Priority:** P1 (High)
**Estimate:** 4 hours
**Dependencies:** ST-08001
**Status:** Merged (PR #61, 2026-03-11)

**Acceptance criteria:**
- [ ] `@typescript-eslint/no-explicit-any` warnings are reduced in high-warning runtime files within `packages/tools/src/**` and `packages/patterns/src/**`
- [ ] Shared helper/type aliases are introduced where useful to avoid repeated broad casts
- [ ] Public function signatures remain backward compatible unless explicitly documented
- [ ] Tests covering touched packages pass with no functional regressions
- [ ] Add or update story documentation at `docs/st08003-tools-patterns-type-hardening.md`

---

#### ST-08004: Test/Example Typing Policy and Targeted Cleanup
**User story:** As a maintainer, I want a clear policy for intentional `any` usage in tests/examples so that lint output remains useful without blocking practical test authoring patterns.

**Priority:** P2 (Medium)
**Estimate:** 2 hours
**Dependencies:** ST-08001
**Status:** Merged (PR #62, 2026-03-12)

**Acceptance criteria:**
- [ ] Policy documented for when `any` is acceptable in tests/examples vs when `unknown`/specific types are required
- [ ] ESLint configuration is updated if needed so policy is enforceable and predictable per file scope
- [ ] A targeted cleanup removes low-effort explicit-`any` warnings in tests/examples without reducing test clarity
- [ ] Lint output after cleanup is recorded in story docs for reviewer visibility
- [ ] Add or update story documentation at `docs/st08004-test-example-typing-policy.md`

---

### Epic 09: SOLID Micro-Refactors and Type Boundary Hardening

#### ST-09001: Harden Core Tool Composition Contracts
**User story:** As a framework developer, I want typed composition contracts in core so that chained tool workflows are easier to extend safely.

**Priority:** P1 (High)
**Estimate:** 3 hours
**Dependencies:** ST-08004
**Status:** Merged (PR #63, 2026-03-12)

**Acceptance criteria:**
- [ ] `packages/core/src/tools/composition.ts` replaces broad `any`-based public contracts with generic input/output types (`unknown` where runtime-erased)
- [ ] Composition helpers (`sequential`, `parallel`, `conditional`, `composeTool`, `retry`, `timeout`, `cache`) are split into clearer typed boundaries where needed (SRP-focused extraction allowed)
- [ ] Behavior remains backward compatible for existing call sites in `core` tests
- [ ] Focused tests are added/updated for composition behavior and type-sensitive edge cases
- [ ] Explicit-`any` warnings in touched files are reduced and recorded in story documentation
- [ ] Add or update story documentation at `docs/st09001-core-tool-composition-contracts.md`

---

#### ST-09002: Tighten LangChain Converter Runtime Boundary
**User story:** As a maintainer, I want the LangChain converter layer to use explicit runtime-erased boundaries so integrations remain flexible without leaking unsafe `any` contracts.

**Priority:** P1 (High)
**Estimate:** 3 hours
**Dependencies:** ST-08004
**Status:** Merged (PR #64, 2026-03-13)

**Acceptance criteria:**
- [ ] `packages/core/src/langchain/converter.ts` removes avoidable explicit `any` from exported signatures in favor of generics/`unknown` + narrowing
- [ ] Schema conversion and tool-result stringification responsibilities are separated for readability and maintainability (SRP)
- [ ] Public API behavior remains unchanged (`toLangChainTool`, `toLangChainTools`, `getToolJsonSchema`, `getToolDescription`)
- [ ] Focused tests cover object/primitive/string output serialization and schema extraction behavior
- [ ] Explicit-`any` warnings in touched files are reduced and recorded in story documentation
- [ ] Add or update story documentation at `docs/st09002-langchain-converter-boundary-hardening.md`

---

#### ST-09003: Strengthen LangGraph State Utility Typing
**User story:** As a pattern author, I want typed state utility contracts so reducers, defaults, and validation helpers are easier to compose safely.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-08004
**Status:** Merged (PR #65, 2026-03-13)

**Acceptance criteria:**
- [ ] `packages/core/src/langgraph/state.ts` removes avoidable explicit `any` from `StateChannelConfig`, `createStateAnnotation`, `validateState`, and `mergeState`
- [ ] Generic inference preserves current developer ergonomics while improving compile-time checks for channel reducer/default compatibility
- [ ] Runtime behavior for state creation/merge/validation remains unchanged for existing tests
- [ ] Focused tests are added/updated for reducer application, default factories, and schema validation edge cases
- [ ] Explicit-`any` warnings in touched files are reduced and recorded in story documentation
- [ ] Add or update story documentation at `docs/st09003-langgraph-state-utility-typing.md`

---

#### ST-09004: Refine Observability Payload Contracts
**User story:** As an operator, I want observability payloads to use stable JSON-compatible contracts so logs and alerts are predictable across integrations.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09003
**Status:** Merged (PR #66, 2026-03-17)

**Acceptance criteria:**
- [ ] `packages/core/src/langgraph/observability/logger.ts` and `packages/core/src/monitoring/alerts.ts` use shared JSON-safe payload types instead of broad `Record<string, any>`
- [ ] Optional extraction introduces a reusable observability payload type module to avoid repeated ad-hoc contracts (DRY + SRP)
- [ ] Logging and alert behavior remain backward compatible for current runtime usage
- [ ] Focused tests are added/updated for log formatting and alert rule execution with typed payloads
- [ ] Explicit-`any` warnings in touched files are reduced and recorded in story documentation
- [ ] Add or update story documentation at `docs/st09004-observability-payload-contracts.md`

---

#### ST-09005: Harden Patterns ReAct Node and Shared Agent Builder Types
**User story:** As a pattern consumer, I want safer ReAct/agent-builder state boundaries so custom workflows are easier to implement without unsafe casts.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-08004
**Status:** Merged (PR #67, 2026-03-18)

**Acceptance criteria:**
- [ ] `packages/patterns/src/react/nodes.ts` and `packages/patterns/src/shared/agent-builder.ts` reduce explicit `any` in state/message/condition handling
- [ ] Message normalization and state access helpers are extracted where useful to reduce node-function complexity (SRP)
- [ ] Public API and runtime behavior for ReAct and shared builder flows remain backward compatible
- [ ] Focused tests are added/updated for conditional routing and message construction behavior
- [ ] Explicit-`any` warnings in touched files are reduced and recorded in story documentation
- [ ] Add or update story documentation at `docs/st09005-patterns-react-builder-typing.md`

---

#### ST-09006: Modularize ReAct Node Responsibilities
**User story:** As a patterns maintainer, I want the ReAct node implementation split into smaller modules so reasoning, action, and observation flows are easier to review and extend safely.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09005
**Status:** Merged (PR #68, 2026-03-18)

**Acceptance criteria:**
- [ ] `packages/patterns/src/react/nodes.ts` is decomposed into smaller internal modules or helpers with clearer responsibility boundaries, reducing the size and complexity of the entry module
- [ ] Public exports and runtime behavior remain backward compatible for `createReasoningNode`, `createActionNode`, and `createObservationNode`
- [ ] Extracted modules make message normalization, action execution support, and observation formatting easier to test independently or through focused node coverage
- [ ] Focused tests are added or updated for the modularized reasoning/action/observation paths
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09006-react-node-modularization.md`

---

#### ST-09007: Modularize ReAct Node Test Suite
**User story:** As a patterns maintainer, I want the ReAct node test suite organized around the modular node structure so reasoning, action, and observation behavior stay easy to extend and review.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09006
**Status:** Merged (PR #69, 2026-03-20)

**Acceptance criteria:**
- [ ] `packages/patterns/tests/react/nodes.test.ts` is reorganized into smaller test modules or helper layers that mirror the modularized ReAct node responsibilities
- [ ] The public test entry point remains easy to run and preserves current coverage for `createReasoningNode`, `createActionNode`, and `createObservationNode`
- [ ] Shared test fixtures/helpers are extracted where they reduce duplication without obscuring intent
- [ ] Focused tests continue covering tool-message construction, action execution behavior, and observation formatting after the test split
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09007-react-node-test-modularization.md`

---

#### ST-09008: Harden Parallel Workflow Builder Typing
**User story:** As a LangGraph workflow author, I want the parallel workflow builder to use stronger schema and edge typing so fan-out/fan-in workflows are easier to compose without unsafe casts.

**Priority:** P1 (High)
**Estimate:** 3 hours
**Dependencies:** ST-09007
**Status:** Merged (PR #70, 2026-03-22)

**Acceptance criteria:**
- [ ] `packages/core/src/langgraph/builders/parallel.ts` removes avoidable `any` and `@ts-expect-error` usage around state schema, node registration, and edge wiring
- [ ] Builder contracts preserve current runtime behavior for parallel nodes and optional aggregation nodes
- [ ] Focused tests are added or updated for duplicate-node validation, auto start/end wiring, and aggregate fan-in behavior
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09008-parallel-workflow-builder-typing.md`

---

#### ST-09009: Tighten Ask-Human Interrupt Boundary
**User story:** As an agent developer, I want the ask-human tool to use a safer LangGraph interrupt boundary so human-in-the-loop pauses do not rely on broad dynamic casts.

**Priority:** P1 (High)
**Estimate:** 3 hours
**Dependencies:** ST-09008
**Status:** Merged (PR #71, 2026-03-23)

**Acceptance criteria:**
- [ ] `packages/tools/src/agent/ask-human/tool.ts` removes avoidable `any` usage around dynamic LangGraph import and interrupt handling
- [ ] Interrupt availability and compatibility checks produce clear errors without weakening the public `AskHumanOutput` contract
- [ ] Focused tests are added or updated for missing LangGraph dependency handling, interrupt response handling, and timeout/default-response behavior
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09009-ask-human-interrupt-boundary-hardening.md`

---

#### ST-09010: Strengthen Plan-Execute Agent Routing Typing
**User story:** As a patterns maintainer, I want plan-execute routing and compile boundaries to be strongly typed so the agent factory no longer depends on broad route and compile casts.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09009
**Status:** Merged (PR #72, 2026-03-23)

**Acceptance criteria:**
- [ ] `packages/patterns/src/plan-execute/agent.ts` removes avoidable `as any` usage in conditional routing and compile return handling
- [ ] Route typing continues to support planner, executor, replanner, finisher, and terminal error flows without runtime behavior changes
- [ ] Focused tests are added or updated for executor/replanner route decisions and compiled agent invocation behavior
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09010-plan-execute-routing-typing.md`

---

#### ST-09011: Tighten Explicit-`any` Baseline Caps
**User story:** As a maintainer, I want the explicit-`any` baseline caps tightened to the current improved counts so the no-regression guard reflects the actual warning floor instead of stale historical limits.

**Priority:** P1 (High)
**Estimate:** 2 hours
**Dependencies:** ST-09010
**Status:** Merged (PR #73, 2026-03-23)

**Acceptance criteria:**
- [ ] `scripts/no-explicit-any-baseline.json` is updated to the current post-EP-09 warning totals and per-package caps
- [ ] Baseline verification continues to pass locally and in CI with the tightened numbers
- [ ] Story docs record the before/after cap values and the command output used to derive them
- [ ] No source files regress warning counts as part of the baseline-tightening story
- [ ] Add or update story documentation at `docs/st09011-explicit-any-baseline-tightening.md`

---

#### ST-09012: Remove Package Export-Map Build Warnings
**User story:** As a release maintainer, I want package export-map metadata cleaned up so routine builds stop emitting avoidable package.json condition-order warnings.

**Priority:** P2 (Medium)
**Estimate:** 2 hours
**Dependencies:** ST-09011
**Status:** Merged (PR #74, 2026-03-23)

**Acceptance criteria:**
- [ ] `packages/skills/package.json`, `packages/tools/package.json`, and `packages/testing/package.json` no longer emit the current `"types" condition will never be used` build warnings
- [ ] Export-map cleanup preserves published import/require/types resolution for consumers
- [ ] Focused validation covers package builds and a smoke-level resolution check for the touched packages
- [ ] Story docs capture the exact warnings removed and any package-metadata rationale
- [ ] Add or update story documentation at `docs/st09012-package-export-map-warning-cleanup.md`

---

#### ST-09013: Harden Sequential Workflow Builder Typing
**User story:** As a LangGraph workflow author, I want the sequential workflow builder to use schema-derived state and safer edge typing so linear workflows no longer depend on broad casts.

**Priority:** P1 (High)
**Estimate:** 3 hours
**Dependencies:** ST-09012
**Status:** Merged (PR #75, 2026-03-23)

**Acceptance criteria:**
- [ ] `packages/core/src/langgraph/builders/sequential.ts` removes avoidable `any` usage around `stateSchema`, `START`/`END`, and node-edge wiring
- [ ] State and update typing derive from the supplied schema instead of a free broad state boundary
- [ ] Current sequential runtime behavior is preserved for start, intermediate, and terminal edges
- [ ] Focused tests are added or updated for edge wiring and schema-derived workflow typing behavior
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09013-sequential-workflow-builder-typing.md`

---

#### ST-09014: Tighten Plan-Execute Shared Type Boundaries
**User story:** As a patterns maintainer, I want the shared plan-execute type contracts to stop leaking broad tool and schema boundaries so downstream agents inherit tighter inference by default.

**Priority:** P1 (High)
**Estimate:** 3 hours
**Dependencies:** ST-09013
**Status:** Merged (PR #76, 2026-03-24)

**Acceptance criteria:**
- [ ] `packages/patterns/src/plan-execute/types.ts` removes the current `Tool<any, any>[]` style boundaries and replaces them with safer generic or erased runtime contracts
- [ ] Shared plan, execution, and step result types remain compatible with current planner, executor, and replanner flows
- [ ] Any touched schema helpers preserve current runtime validation behavior while reducing broad `any` usage
- [ ] Focused tests are added or updated for type-driven plan-execute configuration and execution flows
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09014-plan-execute-shared-type-boundaries.md`

---

#### ST-09015: Modularize Multi-Agent Node Responsibilities
**User story:** As a patterns maintainer, I want the multi-agent node module split into smaller responsibility-focused units so routing, handoff, and coordinator behavior are easier to review and extend.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09014
**Status:** Merged (PR #77, 2026-03-25)

**Acceptance criteria:**
- [ ] `packages/patterns/src/multi-agent/nodes.ts` is split into smaller modules or helper layers that mirror the major node responsibilities
- [ ] The public multi-agent node entrypoint remains stable and preserves current runtime behavior
- [ ] Shared helpers are extracted where they reduce duplication without obscuring control flow
- [ ] Focused tests are added or updated for coordinator routing, handoff behavior, and node-level error handling after the split
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09015-multi-agent-node-modularization.md`

---

#### ST-09016: Harden Monitoring Audit and Health Payload Types
**User story:** As a maintainer, I want monitoring audit and health payload contracts tightened so observability helpers stop relying on broad payload `any` values.

**Priority:** P1 (High)
**Estimate:** 3 hours
**Dependencies:** ST-09012
**Status:** Merged (PR #78, 2026-03-26)

**Acceptance criteria:**
- [ ] `packages/core/src/monitoring/audit.ts` and `packages/core/src/monitoring/health.ts` replace broad `any` payload fields with safer JSON-safe or domain-specific contracts
- [ ] Monitoring APIs preserve current runtime behavior and public compatibility where possible
- [ ] Focused tests are added or updated for audit event serialization and health-check metadata handling
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09016-monitoring-payload-type-hardening.md`

---

#### ST-09017: Centralize CLI Command Error Handling
**User story:** As a CLI maintainer, I want repeated command-level error handling consolidated so command modules stay DRY and stop relying on repetitive `catch (error: any)` blocks.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09012
**Status:** Merged (PR #79, 2026-03-27)

**Acceptance criteria:**
- [ ] Repeated command-level error formatting/exit handling in `packages/cli/src/commands/**` is consolidated behind a shared helper or wrapper
- [ ] Touched CLI commands preserve current user-visible behavior and exit codes
- [ ] The refactor reduces avoidable `catch (error: any)` usage in touched command files
- [ ] Focused tests are added or updated for shared error handling where the current test surface supports it
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09017-cli-error-handling-centralization.md`

---

#### ST-09018: Harden Testing Assertion and State Builder Helpers
**User story:** As a framework contributor, I want the shared testing helpers to expose tighter generic contracts so test utilities stop teaching consumers to lean on broad `any`-based state builders.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09016
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/testing/src/helpers/assertions.ts` and `packages/testing/src/helpers/state-builder.ts` replace broad `any`-based helper signatures with safer generic or unknown-first contracts
- [ ] Shared test helper ergonomics remain practical for common agent/message/state test setup flows
- [ ] Focused tests are added or updated for touched helper behavior and contract expectations
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09018-testing-helper-type-hardening.md`

---

#### ST-09019: Harden Reflection Agent Routing Typing
**User story:** As a patterns maintainer, I want the reflection agent routing and compile boundaries strongly typed so the workflow no longer depends on broad route and compile casts.

**Priority:** P1 (High)
**Estimate:** 3 hours
**Dependencies:** ST-09012
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/patterns/src/reflection/agent.ts` removes avoidable `as any` usage around conditional routing and compile return handling
- [ ] Reflection generator, reflector, reviser, and completion flows preserve current runtime behavior
- [ ] Focused tests are added or updated for route decisions and compiled agent invocation behavior
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09019-reflection-agent-routing-typing.md`

---

#### ST-09020: Tighten Prompt Loader Variable Contracts
**User story:** As a framework consumer, I want the prompt loader to distinguish trusted and untrusted variable contracts more safely so template rendering no longer relies on broad `any` variable maps.

**Priority:** P1 (High)
**Estimate:** 3 hours
**Dependencies:** ST-09012
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/core/src/prompt-loader/index.ts` replaces broad variable-map `any` usage with safer unknown-first or JSON-safe contracts
- [ ] `sanitizeValue`, `renderTemplate`, and `loadPrompt` preserve current rendering behavior and escaping guarantees
- [ ] Focused tests are added or updated for trusted/untrusted variable rendering and fallback behavior
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09020-prompt-loader-variable-contracts.md`

---

#### ST-09021: Harden Streaming WebSocket and Message Contracts
**User story:** As a streaming integrator, I want the WebSocket helpers to expose typed message and socket boundaries so realtime handlers do not rely on broad `any` payloads.

**Priority:** P1 (High)
**Estimate:** 3 hours
**Dependencies:** ST-09012
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/core/src/streaming/websocket.ts` and adjacent streaming types replace broad `ws`, `message`, and `data` `any` boundaries with safer contracts
- [ ] Current WebSocket handler, send, and broadcast behavior is preserved
- [ ] Focused tests are added or updated for message parsing, error handling, and broadcast behavior
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09021-streaming-websocket-contracts.md`

---

#### ST-09022: Harden Shared Deduplication Utility Contracts
**User story:** As a patterns maintainer, I want the shared deduplication utilities to use safer normalization and cache-key contracts so shared action-dedup behavior stops depending on broad `any` arguments.

**Priority:** P1 (High)
**Estimate:** 3 hours
**Dependencies:** ST-09012
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/patterns/src/shared/deduplication.ts` replaces broad `any` normalization and cache-key boundaries with safer unknown-first contracts
- [ ] Deduplication metrics, cache-key generation, and logging helpers preserve current runtime behavior
- [ ] Focused tests are added or updated for normalization, cache-key generation, and metrics helpers
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09022-shared-deduplication-contracts.md`

---

#### ST-09023: Tighten Core Tool Builder Fluent Typing
**User story:** As a tool author, I want the fluent tool builder to preserve stronger generic contracts through chaining so builder internals stop depending on `(this as any)` seams.

**Priority:** P1 (High)
**Estimate:** 4 hours
**Dependencies:** ST-09012
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/core/src/tools/builder.ts` removes avoidable `(this as any)` usage in schema and invoke builder stages
- [ ] Fluent builder chaining preserves current ergonomics and output behavior for built tools
- [ ] Focused tests are added or updated for schema/invoke chaining and built tool execution behavior
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09023-tool-builder-fluent-typing.md`

---

#### ST-09024: Tighten LangGraph Interrupt Type Contracts
**User story:** As a human-in-the-loop workflow author, I want the shared interrupt contracts to be more precise so interrupt payloads and resume commands carry clearer type guarantees.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09009
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/core/src/langgraph/interrupts/types.ts` replaces avoidable broad payload boundaries with safer domain-specific contracts
- [ ] Human-request, approval, custom interrupt, and resume command flows preserve current compatibility
- [ ] Focused tests are added or updated for touched interrupt type helpers or adjacent runtime consumers as needed
- [ ] Explicit-`any` warning changes for touched files are recorded in story documentation
- [ ] Add or update story documentation at `docs/st09024-langgraph-interrupt-type-contracts.md`

---

#### ST-09025: Extract Tool Registry Collection and Search Operations
**User story:** As a core maintainer, I want the tool registry collection and search concerns extracted from the large registry class so lookup behavior is easier to maintain and test.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09012
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/core/src/tools/registry.ts` extracts collection/search responsibilities such as list, category/tag filtering, and text search into clearer helpers or modules
- [ ] Public registry lookup behavior remains unchanged for `getAll`, `getByCategory`, `getByTag`, and `search`
- [ ] Focused tests are added or updated for extracted collection and search behavior
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09025-tool-registry-collection-search-extraction.md`

---

#### ST-09026: Modularize Tool Registry Prompt Rendering and Event Paths
**User story:** As a core maintainer, I want the tool registry prompt-generation and event-emission paths separated from basic storage operations so the registry class stops carrying too many responsibilities.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09025
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/core/src/tools/registry.ts` extracts prompt-rendering and event-emission responsibilities into clearer helpers or modules
- [ ] `generatePrompt`, LangChain conversion, and registry event behavior preserve current runtime output
- [ ] Focused tests are added or updated for prompt rendering and registry event behavior after the split
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09026-tool-registry-prompt-event-modularization.md`

---

#### ST-09027: Extract Connection Manager Vendor Initialization Adapters
**User story:** As a tools maintainer, I want the relational connection manager's vendor-specific initialization paths separated from lifecycle orchestration so the module becomes easier to review and extend.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09012
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/tools/src/data/relational/connection/connection-manager.ts` extracts PostgreSQL, MySQL, and SQLite initialization/pool-configuration logic into clearer helpers or modules
- [ ] Vendor-specific connection setup preserves current runtime behavior and validation
- [ ] Focused tests are added or updated for vendor initialization and pool configuration behavior
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09027-connection-manager-vendor-initialization-extraction.md`

---

#### ST-09028: Modularize Connection Manager Lifecycle and Reconnection Control
**User story:** As a tools maintainer, I want the relational connection manager lifecycle and reconnection control flow split into clearer responsibility boundaries so connection orchestration is easier to reason about.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09027
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/tools/src/data/relational/connection/connection-manager.ts` extracts lifecycle/reconnection concerns such as state transitions, cancellation, reconnection scheduling, and close/dispose orchestration into clearer helpers or modules
- [ ] Public connection lifecycle behavior remains unchanged for connect, initialize, disconnect, close, and reconnection flows
- [ ] Focused tests are added or updated for cancellation, reconnection scheduling, and lifecycle cleanup behavior
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09028-connection-manager-lifecycle-modularization.md`

---

#### ST-09029: Modularize Plan-Execute Node Responsibilities
**User story:** As a patterns maintainer, I want the plan-execute node layer split into clearer responsibility boundaries so planning, execution, replanning, and finishing logic are easier to reason about and evolve independently.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09014
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/patterns/src/plan-execute/nodes.ts` is split into smaller modules or helper layers that separate planner, executor, replanner, and finisher responsibilities
- [ ] The public plan-execute node entrypoint remains stable and preserves current runtime behavior
- [ ] Shared helpers are extracted where they reduce duplication without obscuring the control flow
- [ ] Focused tests are added or updated for planning, execution, replanning, and node-level error handling after the split
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09029-plan-execute-node-modularization.md`

---

#### ST-09030: Extract Connection Manager Query Execution and Session Adapters
**User story:** As a tools maintainer, I want the relational connection manager query execution and session-specific adapter logic split into focused helpers so vendor-specific execution paths are easier to maintain after the lifecycle split.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09028
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/tools/src/data/relational/connection/connection-manager.ts` extracts query execution and `executeInConnection(...)` vendor branches into focused helpers or modules
- [ ] Public SQL execution behavior remains unchanged for PostgreSQL, MySQL, and SQLite across `execute(...)` and `executeInConnection(...)`
- [ ] Focused tests are added or updated for vendor-specific result normalization and dedicated-session execution flows
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09030-connection-manager-query-session-extraction.md`

---

#### ST-09031: Extract Tool Registry Registration and Mutation Paths
**User story:** As a core maintainer, I want the tool registry registration and mutation logic split out of the public façade so duplicate checking, updates, and bulk registration are easier to review and evolve independently.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09026
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/core/src/tools/registry.ts` extracts registration, update, removal, and bulk-registration logic into focused helpers while keeping the public registry entrypoint stable
- [ ] Public registry behavior remains unchanged for duplicate detection, name consistency checks, and emitted events
- [ ] Focused tests are added or updated for registration conflicts, updates, removals, and bulk-registration edge cases after the split
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09031-tool-registry-registration-mutation-extraction.md`

---

#### ST-09032: Tighten Managed Tool Lifecycle Contracts
**User story:** As a core maintainer, I want the managed-tool lifecycle surface typed more precisely so initialization, execution, cleanup, and health-check contracts no longer rely on broad `any` defaults.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09023
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/core/src/tools/lifecycle.ts` replaces broad lifecycle `any` defaults with safer generic defaults or unknown-first contracts
- [ ] Managed tool health-check metadata, stats, and LangChain interop remain backward compatible at runtime
- [ ] Focused tests are added or updated for initialization, execution, cleanup, health checks, and process-exit cleanup behavior as needed
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09032-managed-tool-lifecycle-contracts.md`

---

#### ST-09033: Tighten Database Pool Adapter Contracts
**User story:** As a core maintainer, I want the database pool adapter surface typed more precisely so query, execute, and connection hook contracts are safer for downstream integration work.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09032
**Status:** Merged (PR #98, 2026-05-03)

**Acceptance criteria:**
- [ ] `packages/core/src/resources/database-pool.ts` replaces broad connection/query parameter contracts with safer generic or unknown-first adapter types
- [ ] Mock connection behavior and pool lifecycle semantics remain unchanged at runtime
- [ ] Focused tests are added or updated for acquire/release, query/execute delegation, and health-check validation behavior as needed
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09033-database-pool-adapter-contracts.md`

---

#### ST-09034: Tighten Snapshot Testing Runner Contracts
**User story:** As a testing maintainer, I want the snapshot-testing helpers typed more precisely so state normalization and diffing no longer rely on broad `any` surfaces.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09018
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/testing/src/runners/snapshot-testing.ts` replaces broad snapshot state and normalizer `any` contracts with unknown-first or constrained generic helpers
- [ ] Snapshot normalization behavior remains unchanged for included/excluded fields, timestamp and ID normalization, message snapshots, and state diffing
- [ ] Focused tests are added or updated for snapshot creation, comparisons, diffs, and message snapshot helpers
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09034-snapshot-testing-runner-contracts.md`

---

#### ST-09035: Tighten Agent Test Runner State Contracts
**User story:** As a testing maintainer, I want the agent test runner typed more precisely so agent input, final state, captured steps, and validation hooks are safer to extend.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09034
**Status:** Merged (PR #99, 2026-05-04)

**Acceptance criteria:**
- [ ] `packages/testing/src/runners/agent-test-runner.ts` replaces broad agent, input, state, and step `any` contracts with safer interfaces or unknown-first generics
- [ ] Runtime behavior remains unchanged for timeout handling, optional step capture, validation hooks, and multi-input execution
- [ ] Focused tests are added or updated for successful runs, timeout handling, validation failures, and `runMany(...)`
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09035-agent-test-runner-state-contracts.md`

---

#### ST-09036: Tighten Conversation Simulator Agent Contracts
**User story:** As a testing maintainer, I want the conversation simulator to share safer agent and message-result contracts with the agent test runner so multi-turn test helpers are easier to extend without broad `any` seams.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09035
**Status:** Merged (PR #103, 2026-05-05)

**Acceptance criteria:**
- [ ] `packages/testing/src/runners/conversation-simulator.ts` replaces broad agent and invoke-result `any` contracts with reusable unknown-first or generic runner interfaces
- [ ] Multi-turn simulation, dynamic input generation, stop-condition handling, verbose logging, and error capture behavior remain unchanged
- [ ] Focused tests are added or updated for static input simulation, dynamic simulation, stop conditions, max-turn behavior, and malformed invoke results as needed
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09036-conversation-simulator-agent-contracts.md`

---

#### ST-09037: Tighten ReAct Builder and Prompt Boundary Contracts
**User story:** As a patterns maintainer, I want the ReAct builder, agent factory, and prompt helpers to use narrower tool, checkpointer, and schema contracts so the public ReAct setup API stays ergonomic without broad casts leaking through the module.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09023, ST-09029
**Status:** Merged (PR #106, 2026-05-06)

**Acceptance criteria:**
- [ ] `packages/patterns/src/react/types.ts`, `builder.ts`, `agent.ts`, and `prompts.ts` replace broad tool/schema/checkpointer/compiled-graph `any` surfaces with exported aliases or unknown-first contracts where practical
- [ ] Existing ReAct builder usage, deprecated `withLLM(...)`, stop-condition routing, checkpointer handling, and tool prompt formatting behavior remain unchanged
- [ ] Focused tests are added or updated for builder validation, tool-array input, registry input, checkpointer input, custom stop conditions, and prompt formatting as needed
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09037-react-builder-prompt-boundary-contracts.md`

---

#### ST-09038: Extract Data Transformer Object Path Helpers
**User story:** As a tools maintainer, I want shared transformer helpers for nested path access and object projection so array/object transformer tools avoid duplicated ad hoc implementations while preserving their current runtime behavior.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** None
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/tools/src/data/transformer/tools/array-filter.ts`, `array-sort.ts`, `object-pick.ts`, and `object-omit.ts` share focused helper functions for nested value lookup and object projection/omission
- [ ] Helper contracts use unknown-first JSON/object boundaries instead of local broad `any` helper types
- [ ] Existing equality, comparison, contains, starts-with, ends-with, sort-order, pick, and omit behavior remains unchanged
- [ ] Focused transformer tests are added or updated for nested paths, missing paths, primitive values, object projection, and object omission as needed
- [ ] Add or update story documentation at `docs/st09038-transformer-object-path-helpers.md`

---

#### ST-09039: Tighten Core Mock Tool Testing Helper Contracts
**User story:** As a core maintainer, I want mock-tool and tool-simulator testing helpers to expose generic input/output contracts so tests can stay expressive without relying on broad `any` payloads.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09023
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/core/src/tools/testing.ts` replaces broad mock response, default response, invocation, and simulator input/output contracts with generic or unknown-first helper types
- [ ] Mock response matching, default responses, random errors, latency simulation, invocation recording, and simulator execution behavior remain unchanged
- [ ] Focused tests are added or updated for typed mock responses, predicate matching, error recording, simulator missing-tool errors, and invocation clearing as needed
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09039-core-mock-tool-testing-contracts.md`

---

#### ST-09040: Tighten Human-in-Loop Streaming Resume Contracts
**User story:** As a core maintainer, I want human-in-loop SSE resume payloads to use safer value contracts so interrupt/resume streaming remains flexible without exposing broad `any` in public event helpers.

**Priority:** P2 (Medium)
**Estimate:** 2 hours
**Dependencies:** ST-09024
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/core/src/streaming/human-in-loop.ts` replaces resume payload `any` contracts with an unknown-first or JSON-safe value type aligned with interrupt/resume boundaries
- [ ] Human request, response, interrupt, resume, waiting, and resumed SSE event formatting remains unchanged at runtime
- [ ] Focused tests are added or updated for resume payload serialization, primitive/object resume values, and event ID stability as needed
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09040-human-in-loop-streaming-resume-contracts.md`

---

#### ST-09041: Adopt Structured Logger in Conversation Simulator
**User story:** As a testing maintainer, I want `ConversationSimulator` verbose output to use the structured logger instead of `console.log` so diagnostic output can be filtered and aligned with repo observability conventions.

**Priority:** P2 (Medium)
**Estimate:** 2 hours
**Dependencies:** ST-09036
**Status:** Merged (PR #110, 2026-05-12)

**Acceptance criteria:**
- [ ] `packages/testing/src/runners/conversation-simulator.ts` replaces direct verbose `console.log` calls with a testing-package structured logger or shared logger helper
- [ ] Verbose simulator output remains opt-in and continues to emit the same user/AI turn information without changing non-verbose behavior
- [ ] Focused tests are added or updated for verbose logging enablement, disabled logging behavior, and emitted message content as needed
- [ ] Story documentation records any observability or test-double approach used for logger verification
- [ ] Add or update story documentation at `docs/st09041-conversation-simulator-structured-logger.md`

---

#### ST-09042: Tighten SSE Formatter Generic Event Contracts
**User story:** As a core maintainer, I want the shared SSE formatter contracts to use unknown-first generics instead of broad `any` so streaming integrations can keep type safety without changing SSE behavior.

**Priority:** P2 (Medium)
**Estimate:** 2 hours
**Dependencies:** ST-09040
**Status:** Merged (PR #111, 2026-05-13)

**Acceptance criteria:**
- [ ] `packages/core/src/streaming/types.ts` and `packages/core/src/streaming/sse.ts` replace broad SSE formatter generic `any` defaults with unknown-first event/value contracts
- [ ] Default JSON serialization, mapper-driven event formatting, retry prelude behavior, heartbeat timing, and event ID sequencing remain unchanged at runtime
- [ ] Focused tests are added or updated for typed event mappers, default JSON serialization, and retry/heartbeat behavior as needed
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09042-sse-formatter-generic-contracts.md`

---

#### ST-09043: Tighten Error Reporter Context Contracts
**User story:** As a core maintainer, I want error reporter context and JSON serialization to use safer payload contracts so diagnostic reporting stays structured without broad `any` escape hatches.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09020
**Status:** Merged (PR #112, 2026-05-15)

**Acceptance criteria:**
- [ ] `packages/core/src/langgraph/observability/errors.ts` replaces broad error-context `state`, `metadata`, and `toJSON()` value `any` contracts with unknown-first or JSON-safe payload aliases
- [ ] `AgentError`, `createErrorReporter(...)`, wrapped-node reporting, and fallback reporting behavior remain unchanged at runtime
- [ ] Focused tests are added or updated for serialized error payloads, optional state inclusion, and wrapped-node error propagation as needed
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09043-error-reporter-context-contracts.md`

---

#### ST-09044: Tighten Testing Mock Tool Factory Contracts
**User story:** As a testing maintainer, I want mock tool factory helpers to infer schema input types safely so test doubles stay ergonomic without relying on broad `any`.

**Priority:** P2 (Medium)
**Estimate:** 2 hours
**Dependencies:** ST-09018
**Status:** Merged (PR #113, 2026-05-16)

**Acceptance criteria:**
- [ ] `packages/testing/src/mocks/mock-tool.ts` replaces broad schema/default implementation `any` seams with schema-driven generic input contracts
- [ ] Mock tool defaults, delayed execution, forced errors, echo behavior, and calculator behavior remain unchanged at runtime
- [ ] Focused tests are added or updated for inferred input typing, default behavior, delayed execution, and forced error behavior as needed
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09044-mock-tool-factory-contracts.md`

---

#### ST-09045: Tighten Multi-Agent Routing Decision Contracts
**User story:** As a patterns maintainer, I want multi-agent routing to consume structured routing decisions without broad casts so supervisor routing stays extensible and type-safe.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09015
**Status:** Merged (PR #114, 2026-05-17)

**Acceptance criteria:**
- [ ] `packages/patterns/src/multi-agent/routing.ts` and any directly coupled factory wiring replace broad routing-decision casts with schema-aligned or unknown-first contracts
- [ ] LLM-based, round-robin, skill-based, load-balanced, and rule-based routing behavior remain unchanged at runtime
- [ ] Focused tests are added or updated for structured routing decisions, fallback behavior, and parallel-target handling as needed
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09045-multi-agent-routing-decision-contracts.md`

---

#### ST-09046: Tighten Transformer Schema Value Contracts
**User story:** As a tools maintainer, I want transformer tool schemas to use narrower unknown-first value contracts so array/object transformer inputs stay expressive without blanket `z.any()` boundaries.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09038
**Status:** Merged (PR #116, 2026-05-20)

**Acceptance criteria:**
- [ ] `packages/tools/src/data/transformer/types.ts` replaces broad `z.any()` schema boundaries with shared unknown-first or JSON-like value contracts where behavior allows
- [ ] Array filter/map/sort/group-by and object pick/omit tool behavior remain unchanged at runtime
- [ ] Focused tests are added or updated for primitive values, object values, and schema acceptance/rejection boundaries as needed
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09046-transformer-schema-value-contracts.md`

---

#### ST-09047: Tighten JSON and HTTP Payload Schema Contracts
**User story:** As a tools maintainer, I want JSON and HTTP helper schemas to expose safer payload contracts so generic data tools remain flexible without broad `any` outputs and request bodies.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09042
**Status:** Merged (PR #117, 2026-05-21)

**Acceptance criteria:**
- [ ] `packages/tools/src/data/json/types.ts` and `packages/tools/src/web/http/types.ts` replace broad schema or response payload `any` seams with unknown-first or JSON-safe contracts
- [ ] JSON parse/stringify/query/merge behavior and HTTP request/response helper behavior remain unchanged at runtime
- [ ] Focused tests are added or updated for payload typing, request body serialization, and response data handling as needed
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation
- [ ] Add or update story documentation at `docs/st09047-json-http-payload-schema-contracts.md`

---

#### ST-09048: Modularize Multi-Agent Routing Strategies and Tests
**User story:** As a patterns maintainer, I want `packages/patterns/src/multi-agent/routing.ts` and its coupled routing tests split into focused modules so routing behavior stays easier to review, extend, and verify without one file and one test file accumulating too many responsibilities.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09045
**Status:** Merged (PR #115, 2026-05-19)

**Acceptance criteria:**
- [ ] `packages/patterns/src/multi-agent/routing.ts` is reduced to a thin public facade or registry, with the LLM, round-robin, skill-based, load-balanced, and rule-based strategies extracted into focused internal modules.
- [ ] The routing test coverage is modularized alongside the production split so strategy-specific behavior no longer depends on a single growing `packages/patterns/tests/multi-agent/routing.test.ts` file.
- [ ] Existing `RoutingStrategyImpl` exports, runtime behavior, and public imports remain backward compatible.
- [ ] Shared helpers for routing decision parsing or worker selection are colocated behind clear boundaries instead of mixing all strategy logic in one file.
- [ ] Focused tests confirm extracted modules preserve current routing behavior and fallback semantics, and `pnpm --filter @agentforge/patterns typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09048-modularize-multi-agent-routing-strategies-and-tests.md`

---

#### ST-09049: Modularize Core Tool Registry and Tests
**User story:** As a core maintainer, I want `packages/core/src/tools/registry.ts` and its coupled registry tests split into focused modules so the registry can keep evolving without a single 400+ line runtime file and 800+ line test file carrying too many responsibilities.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09031
**Status:** Merged (PR #118, 2026-05-22)

**Acceptance criteria:**
- [ ] `packages/core/src/tools/registry.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for registration flow, mutation flow, lookup/query flow, and shared registry normalization/helpers behind a stable public facade.
- [ ] Registry coverage is modularized alongside the production split so strategy-specific and mutation-specific behavior no longer depends on a single oversized `packages/core/tests/tools/registry.test.ts` file.
- [ ] Existing `ToolRegistry` public behavior, emitted events, mutation error semantics, and imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current registration, lookup, update, remove, and bulk-registration behavior, and `pnpm --filter @agentforge/core typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09049-tool-registry-modularization.md`

---

#### ST-09050: Modularize Core Tool Builder and Tests
**User story:** As a core maintainer, I want `packages/core/src/tools/builder.ts` and its coupled builder tests split into focused modules so fluent tool construction stays reviewable and SOLID as the builder surface grows.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09023
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/core/src/tools/builder.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for metadata configuration, schema/input handling, middleware/execution wiring, and clone/finalization helpers behind the stable public builder facade.
- [ ] Builder coverage is modularized alongside the production split so fluent configuration, clone semantics, and invocation behavior no longer depend on a single oversized `packages/core/tests/tools/builder.test.ts` file.
- [ ] Existing `ToolBuilder` public behavior, fluent chaining semantics, metadata isolation, and invoke compatibility remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve builder behavior and type/runtime contracts, and `pnpm --filter @agentforge/core typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09050-tool-builder-modularization.md`

---

#### ST-09051: Modularize Multi-Agent Orchestration Agent and Tests
**User story:** As a patterns maintainer, I want `packages/patterns/src/multi-agent/agent.ts` and its coupled agent tests split into focused modules so orchestration setup stays composable after the routing layer has already been modularized.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09048
**Status:** Merged (PR #120, 2026-05-26)

**Acceptance criteria:**
- [ ] `packages/patterns/src/multi-agent/agent.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for config normalization, worker registration, graph assembly, and orchestration defaults behind the stable public multi-agent facade.
- [ ] Multi-agent agent coverage is modularized alongside the production split so configuration, orchestration, and integration-path assertions no longer depend on a single oversized `packages/patterns/tests/multi-agent/agent.test.ts` file.
- [ ] Existing public multi-agent builder/agent behavior, exports, and runtime orchestration semantics remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current orchestration behavior and surrounding routing/node integration assumptions, and `pnpm --filter @agentforge/patterns typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09051-multi-agent-agent-modularization.md`

---

#### ST-09052: Modularize Relational Query Builder and Tests
**User story:** As a tools maintainer, I want `packages/tools/src/data/relational/query/query-builder.ts` and its coupled query-builder tests split into focused modules so relational SQL construction remains DRY and reviewable instead of accumulating all builder rules in one 700+ line file.

**Priority:** P2 (Medium)
**Estimate:** 5 hours
**Dependencies:** ST-09038
**Status:** Merged

**Acceptance criteria:**
- [x] `packages/tools/src/data/relational/query/query-builder.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for SELECT/INSERT/UPDATE/DELETE assembly, condition building, identifier/value helpers, and shared SQL fragments behind the stable public builder facade.
- [x] Query-builder coverage is modularized alongside the production split so SQL-construction behavior no longer depends on a single oversized `packages/tools/tests/data/relational/query/query-builder.test.ts` file.
- [x] Existing SQL output, parameter ordering, identifier quoting, and public query-builder behavior remain backward compatible.
- [x] Focused tests confirm extracted modules preserve current query-building behavior, and `pnpm --filter @agentforge/tools typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [x] Add or update story documentation at `docs/st09052-relational-query-builder-modularization.md`

---

#### ST-09053: Modularize Relational Connection Manager and Tests
**User story:** As a tools maintainer, I want `packages/tools/src/data/relational/connection/connection-manager.ts` and its coupled connection-manager tests split into focused modules so connection lifecycle logic stays SOLID and easier to verify as vendor behavior keeps growing.

**Priority:** P2 (Medium)
**Estimate:** 5 hours
**Dependencies:** ST-09027
**Status:** Merged (PR #122, 2026-05-28)

**Acceptance criteria:**
- [ ] `packages/tools/src/data/relational/connection/connection-manager.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for initialization, lifecycle transitions, health/cleanup, and vendor/session-specific coordination behind the stable public manager facade.
- [ ] Connection-manager coverage is modularized alongside the production split so lifecycle, vendor, and failure-path assertions no longer depend on the current oversized connection-manager test cluster.
- [ ] Existing connection-manager behavior, session handling, lifecycle semantics, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current relational connection behavior, and `pnpm --filter @agentforge/tools typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09053-connection-manager-modularization.md`

---

#### ST-09054: Modularize Reflection Nodes and Tests
**User story:** As a patterns maintainer, I want `packages/patterns/src/reflection/nodes.ts` and its coupled node tests split into focused modules so the reflection workflow stays modular instead of concentrating generator, reflector, reviser, and finisher behavior in one large file.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09019
**Status:** Merged

**Acceptance criteria:**
- [x] `packages/patterns/src/reflection/nodes.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for generator, reflector, reviser, and shared node helpers behind the stable public reflection-node facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [x] Reflection node coverage is modularized alongside the production split so node-specific assertions no longer depend on a single oversized `packages/patterns/tests/reflection/nodes.test.ts` file.
- [x] Existing reflection-node behavior, logging/iteration semantics, and public imports remain backward compatible.
- [x] Focused tests confirm extracted modules preserve current reflection workflow behavior, and `pnpm --filter @agentforge/patterns typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [x] Add or update story documentation at `docs/st09054-reflection-node-modularization.md`

---

#### ST-09055: Modularize Relational Schema Inspector and Tests
**User story:** As a tools maintainer, I want `packages/tools/src/data/relational/schema/schema-inspector.ts` and its coupled schema-inspector tests split into focused modules so schema discovery logic stays reviewable instead of concentrating vendor inspection, normalization, and caching flow in one oversized file.

**Priority:** P2 (Medium)
**Estimate:** 5 hours
**Dependencies:** ST-03002
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/tools/src/data/relational/schema/schema-inspector.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for vendor-specific inspection, schema normalization, cache/refresh orchestration, and shared metadata helpers behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Schema-inspector coverage is modularized alongside the production split so vendor-specific and normalization-path assertions no longer depend on a single oversized test file or tightly coupled helper cluster.
- [ ] Existing schema inspection behavior, metadata shape, caching semantics, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current schema discovery behavior, and `pnpm --filter @agentforge/tools typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09055-schema-inspector-modularization.md`

---

#### ST-09056: Modularize Skills Registry and Tests
**User story:** As a skills maintainer, I want `packages/skills/src/registry.ts` and its coupled registry tests split into focused modules so skill discovery, prompt generation, and event/reporting flow do not keep accreting in one large runtime file.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-06005
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/skills/src/registry.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for registry hydration, duplicate-resolution policy, prompt rendering, and event/warning flow behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Skills-registry coverage is modularized alongside the production split so prompt generation, warning flow, and discovery-path assertions no longer depend on a single oversized test surface.
- [ ] Existing `SkillRegistry` public behavior, prompt output, precedence rules, event semantics, and imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current skill registry behavior, and `pnpm --filter @agentforge/skills typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09056-skills-registry-modularization.md`

---

#### ST-09057: Modularize Relational Transaction Flow and Tests
**User story:** As a tools maintainer, I want `packages/tools/src/data/relational/query/transaction.ts` and its coupled transaction tests split into focused modules so transaction orchestration, savepoint handling, timeout flow, and vendor coordination are easier to review and extend.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-04001
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/tools/src/data/relational/query/transaction.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for transaction lifecycle, savepoint flow, timeout/rollback handling, and vendor/session helpers behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Transaction coverage is modularized alongside the production split so lifecycle, timeout, and savepoint assertions no longer depend on a single oversized test surface.
- [ ] Existing transaction behavior, rollback semantics, timeout handling, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current transaction behavior, and `pnpm --filter @agentforge/tools typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09057-transaction-flow-modularization.md`

---

#### ST-09058: Modularize Core Tool Lifecycle and Tests
**User story:** As a core maintainer, I want `packages/core/src/tools/lifecycle.ts` and its coupled lifecycle tests split into focused modules so initialization, cleanup, and state-transition responsibilities stay SOLID instead of accumulating in one large runtime file.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09032
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/core/src/tools/lifecycle.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for startup, shutdown, health/liveness coordination, and lifecycle state helpers behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Lifecycle coverage is modularized alongside the production split so startup, cleanup, and failure-path assertions no longer depend on a single oversized test surface.
- [ ] Existing tool lifecycle behavior, state-transition semantics, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current lifecycle behavior, and `pnpm --filter @agentforge/core typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09058-tool-lifecycle-modularization.md`

---

#### ST-09059: Tighten ReAct Schema Payload Contracts
**User story:** As a patterns maintainer, I want ReAct runtime schemas to use safer unknown-first payload contracts so tool arguments, metadata, and results stay flexible without relying on broad `z.any()` seams.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09037
**Status:** Merged (PR #128, 2026-06-08)

**Acceptance criteria:**
- [ ] `packages/patterns/src/react/schemas.ts` replaces broad `z.any()` metadata, arguments, and result payload seams with unknown-first or JSON-safe contracts where behavior allows.
- [ ] ReAct reasoning, action, observation, and prompt behavior remain unchanged at runtime.
- [ ] Focused tests are added or updated for schema acceptance/rejection boundaries, tool-call payload handling, and result serialization compatibility as needed.
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation.
- [ ] Add or update story documentation at `docs/st09059-react-schema-payload-contracts.md`

---

#### ST-09060: Tighten Multi-Agent Schema Payload Contracts
**User story:** As a patterns maintainer, I want multi-agent message and handoff schemas to use safer unknown-first payload contracts so metadata and context stay extensible without broad `z.any()` seams.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-09045
**Status:** Merged (PR #129, 2026-06-08)

**Acceptance criteria:**
- [ ] `packages/patterns/src/multi-agent/schemas.ts` replaces broad metadata/context `z.any()` seams with unknown-first or JSON-safe contracts where behavior allows.
- [ ] Multi-agent routing, worker handoff, execution metadata, and context-passing behavior remain unchanged at runtime.
- [ ] Focused tests are added or updated for schema acceptance/rejection boundaries, context payload handling, and metadata compatibility as needed.
- [ ] Touched files do not regress on explicit-`any` warning counts and the outcome is recorded in story documentation.
- [ ] Add or update story documentation at `docs/st09060-multi-agent-schema-payload-contracts.md`

---

#### ST-09061: Modularize Core Tool Types and Tests
**User story:** As a core maintainer, I want `packages/core/src/tools/types.ts` and its coupled tests split into focused modules so tool type contracts, execution payloads, and shared utility types stop growing as a single multi-responsibility file.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09050
**Status:** Merged (PR #130, 2026-06-10)

**Acceptance criteria:**
- [ ] `packages/core/src/tools/types.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for tool result types, execution/input contracts, schema-facing shared helpers, and public utility types behind a stable facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Tool-type coverage is modularized alongside the production split so schema, invocation, and result-shape assertions no longer depend on a single oversized test surface.
- [ ] Existing tool typing behavior, public imports, and downstream package compatibility remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current type/runtime expectations, and `pnpm --filter @agentforge/core typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09061-tool-types-modularization.md`

---

#### ST-09062: Modularize Core Tool Executor and Tests
**User story:** As a core maintainer, I want `packages/core/src/tools/executor.ts` and its coupled executor tests split into focused modules so execution flow, error handling, and result normalization stay SOLID instead of accreting in one runtime file.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09050
**Status:** Merged (PR #131, 2026-06-11)

**Acceptance criteria:**
- [ ] `packages/core/src/tools/executor.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for execution orchestration, timeout/error handling, result normalization, and callback/reporting helpers behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Executor coverage is modularized alongside the production split so success, failure, timeout, and callback assertions no longer depend on a single oversized test surface.
- [ ] Existing executor behavior, error semantics, callback behavior, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current executor behavior, and `pnpm --filter @agentforge/core typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09062-tool-executor-modularization.md`

---

#### ST-09063: Modularize Multi-Agent Worker Node and Tests
**User story:** As a patterns maintainer, I want `packages/patterns/src/multi-agent/nodes/worker.ts` and its coupled worker-node tests split into focused modules so worker execution, handoff coordination, and shared response shaping stay easier to reason about.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09051
**Status:** Merged

**Acceptance criteria:**
- [ ] `packages/patterns/src/multi-agent/nodes/worker.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for worker execution flow, handoff/result shaping, callback/event helpers, and shared node types behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Worker-node coverage is modularized alongside the production split so execution, handoff, and failure-path assertions no longer depend on a single oversized test surface.
- [ ] Existing worker-node behavior, event semantics, routing handoff integration, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current worker-node behavior, and `pnpm --filter @agentforge/patterns typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09063-multi-agent-worker-node-modularization.md`

---

#### ST-09064: Modularize LangGraph Middleware Presets and Tests
**User story:** As a core maintainer, I want `packages/core/src/langgraph/middleware/presets.ts` and its coupled preset tests split into focused modules so logging, retry, timing, and composition helpers do not keep growing in one file.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09043
**Status:** In Progress

**Acceptance criteria:**
- [ ] `packages/core/src/langgraph/middleware/presets.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for logging presets, retry/timing presets, composition helpers, and shared preset types behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Middleware preset coverage is modularized alongside the production split so logging, retry, timing, and composition assertions no longer depend on a single oversized test surface.
- [ ] Existing preset behavior, middleware ordering, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current preset behavior, and `pnpm --filter @agentforge/core typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09064-middleware-presets-modularization.md`

---

#### ST-09065: Modularize LangGraph State Helpers and Tests
**User story:** As a core maintainer, I want `packages/core/src/langgraph/state.ts` and its coupled state-helper tests split into focused modules so annotation, schema, and reducer helpers stay easier to evolve without one oversized utility file.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09043
**Status:** Ready

**Acceptance criteria:**
- [ ] `packages/core/src/langgraph/state.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for annotation helpers, reducer helpers, schema/state utilities, and shared public types behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] State-helper coverage is modularized alongside the production split so annotation, reducer, and schema assertions no longer depend on a single oversized test surface.
- [ ] Existing state-helper behavior, reducer semantics, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current state-helper behavior, and `pnpm --filter @agentforge/core typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09065-langgraph-state-modularization.md`

---

#### ST-09066: Modularize Core Resource Pool and Tests
**User story:** As a core maintainer, I want `packages/core/src/resources/pool.ts` and its coupled pooling tests split into focused modules so acquisition, eviction, metrics, and lifecycle responsibilities are no longer concentrated in one large resource helper.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** None
**Status:** Ready

**Acceptance criteria:**
- [ ] `packages/core/src/resources/pool.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for acquisition/release flow, eviction/reaping behavior, metrics/introspection helpers, and shared pool types behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Resource-pool coverage is modularized alongside the production split so acquisition, eviction, and lifecycle assertions no longer depend on a single oversized test surface.
- [ ] Existing pool behavior, lifecycle semantics, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current pool behavior, and `pnpm --filter @agentforge/core typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09066-resource-pool-modularization.md`

---

#### ST-09067: Modularize Relational Batch Executor and Tests
**User story:** As a tools maintainer, I want `packages/tools/src/data/relational/query/batch-executor.ts` and its coupled batch execution tests split into focused modules so chunking, retry, benchmarking, and progress-reporting responsibilities do not keep growing in one shared helper.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** None
**Status:** Backlog

**Acceptance criteria:**
- [ ] `packages/tools/src/data/relational/query/batch-executor.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for option resolution/chunking, retry/progress flow, benchmark helpers, and shared batch types behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Batch-executor coverage is modularized alongside the production split so chunking, retry, failure, and benchmark assertions no longer depend on a single oversized test surface.
- [ ] Existing batch execution behavior, failure semantics, progress callbacks, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current batch-executor behavior, and `pnpm --filter @agentforge/tools typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09067-batch-executor-modularization.md`

---

#### ST-09068: Modularize LangGraph Caching Middleware and Tests
**User story:** As a core maintainer, I want `packages/core/src/langgraph/middleware/caching.ts` and its coupled caching tests split into focused modules so cache-store internals, node wrappers, and shared-cache helpers are easier to evolve without duplicating logic.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** None
**Status:** Backlog

**Acceptance criteria:**
- [ ] `packages/core/src/langgraph/middleware/caching.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for cache-store internals, cache-entry lifecycle helpers, node-wrapper execution flow, and shared-cache facade helpers behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Caching middleware coverage is modularized alongside the production split so cache hit/miss, TTL, eviction, and shared-cache assertions no longer depend on a single oversized test surface.
- [ ] Existing caching behavior, shared-cache semantics, callback hooks, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current caching middleware behavior, and `pnpm --filter @agentforge/core typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09068-middleware-caching-modularization.md`

---

#### ST-09069: Modularize Neo4j Embedding Manager and Tests
**User story:** As a tools maintainer, I want `packages/tools/src/data/neo4j/embeddings/embedding-manager.ts` and its embedding-manager coverage split into focused modules so provider selection, environment initialization, and batch generation logic are easier to reason about.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** None
**Status:** Backlog

**Acceptance criteria:**
- [ ] `packages/tools/src/data/neo4j/embeddings/embedding-manager.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for provider creation/default-model resolution, environment-based initialization, and single/batch generation flow behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Embedding-manager coverage is modularized alongside the production split so initialization, provider-selection, and batch-generation assertions no longer depend on a single oversized test surface.
- [ ] Existing embedding-manager behavior, provider defaults, environment variable semantics, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current embedding-manager behavior, and `pnpm --filter @agentforge/tools typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09069-neo4j-embedding-manager-modularization.md`

---

#### ST-09070: Modularize Multi-Agent Utilities and Tests
**User story:** As a patterns maintainer, I want `packages/patterns/src/multi-agent/utils.ts` and its coupled utility tests split into focused modules so ReAct detection, assignment extraction, serialization, and wrapped worker execution do not stay concentrated in one file.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09063
**Status:** Backlog

**Acceptance criteria:**
- [ ] `packages/patterns/src/multi-agent/utils.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for ReAct agent detection, result-shape extraction/serialization, and wrapped worker execution helpers behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Multi-agent utility coverage is modularized alongside the production split so detection, assignment, serialization, and wrapped-agent assertions no longer depend on a single oversized test surface.
- [ ] Existing multi-agent utility behavior, wrapped ReAct execution semantics, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current multi-agent utility behavior, and `pnpm --filter @agentforge/patterns typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09070-multi-agent-utils-modularization.md`

---

#### ST-09071: Modularize Skill Activation Runtime and Tests
**User story:** As a skills maintainer, I want `packages/skills/src/activation.ts` and its coupled activation tests split into focused modules so activation, trust-policy, and resource-loading paths are easier to review and extend independently.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09056
**Status:** Backlog

**Acceptance criteria:**
- [ ] `packages/skills/src/activation.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for activation-tool creation, resource path/trust-policy evaluation, and resource loading/event emission behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Skill-activation coverage is modularized alongside the production split so activation, trust-policy, and resource-loading assertions no longer depend on a single oversized test surface.
- [ ] Existing skill activation behavior, trust-policy decisions, emitted events, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current skill-activation behavior, and `pnpm --filter @agentforge/skills typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09071-skill-activation-modularization.md`

---

#### ST-09072: Modularize Relational Insert Executor and Tests
**User story:** As a tools maintainer, I want `packages/tools/src/data/relational/tools/relational-insert/executor.ts` and its coupled insert-executor tests split into focused modules so row normalization, batch execution, and result/error shaping stay easier to change safely.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09067
**Status:** Backlog

**Acceptance criteria:**
- [ ] `packages/tools/src/data/relational/tools/relational-insert/executor.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for row normalization, batch orchestration, benchmark/result shaping, and insert error helpers behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Insert-executor coverage is modularized alongside the production split so normalization, batch, and error-path assertions no longer depend on a single oversized test surface.
- [ ] Existing relational insert behavior, batch semantics, benchmark output, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current insert-executor behavior, and `pnpm --filter @agentforge/tools typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09072-relational-insert-executor-modularization.md`

---

#### ST-09073: Modularize Relational Update Executor and Tests
**User story:** As a tools maintainer, I want `packages/tools/src/data/relational/tools/relational-update/executor.ts` and its coupled update-executor tests split into focused modules so condition handling, batch orchestration, and result/error shaping are no longer concentrated in one executor file.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09067
**Status:** Backlog

**Acceptance criteria:**
- [ ] `packages/tools/src/data/relational/tools/relational-update/executor.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for condition normalization, batch orchestration, benchmark/result shaping, and update error helpers behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Update-executor coverage is modularized alongside the production split so normalization, batch, and error-path assertions no longer depend on a single oversized test surface.
- [ ] Existing relational update behavior, batch semantics, benchmark output, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current update-executor behavior, and `pnpm --filter @agentforge/tools typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09073-relational-update-executor-modularization.md`

---

#### ST-09074: Modularize Relational Delete Executor and Tests
**User story:** As a tools maintainer, I want `packages/tools/src/data/relational/tools/relational-delete/executor.ts` and its coupled delete-executor tests split into focused modules so condition handling, batch orchestration, and result/error shaping are no longer concentrated in one executor file.

**Priority:** P2 (Medium)
**Estimate:** 4 hours
**Dependencies:** ST-09067
**Status:** Backlog

**Acceptance criteria:**
- [ ] `packages/tools/src/data/relational/tools/relational-delete/executor.ts` is reduced below the 300 line planning cutoff by extracting focused internal modules for condition normalization, batch orchestration, benchmark/result shaping, and delete error helpers behind a stable public facade, and the extracted production modules must also stay below `300` lines unless the story documents and justifies an explicit exception.
- [ ] Delete-executor coverage is modularized alongside the production split so normalization, batch, and error-path assertions no longer depend on a single oversized test surface.
- [ ] Existing relational delete behavior, batch semantics, benchmark output, and public imports remain backward compatible.
- [ ] Focused tests confirm extracted modules preserve current delete-executor behavior, and `pnpm --filter @agentforge/tools typecheck`, `pnpm test --run`, and `pnpm lint:explicit-any:baseline` pass with no baseline regression.
- [ ] Add or update story documentation at `docs/st09074-relational-delete-executor-modularization.md`

---

#### ST-10001: Audit Markdown Emoji Usage Across Project-Owned Docs
**User story:** As a maintainer, I want a clear inventory of markdown emoji usage so docs-only cleanup work can be prioritized and executed without noisy, repo-wide guesswork.

**Priority:** P2 (Medium)
**Estimate:** 2 hours
**Dependencies:** None
**Status:** Merged (PR #97, 2026-05-03)

**Acceptance criteria:**
- [ ] Project-owned `.md` files with decorative emoji usage are inventoried and grouped by scope such as public docs, package READMEs, planning/internal docs, and examples/templates
- [ ] The audit distinguishes decorative emoji from meaningful non-emoji symbols or literal sample output that should be preserved
- [ ] The outcome produces a documented cleanup recommendation sequence for follow-on stories
- [ ] No runtime code is changed as part of the audit story
- [ ] Add or update story documentation at `docs/st10001-markdown-emoji-audit.md`

---

#### ST-10002: Normalize Emoji Usage in Public-Facing Docs
**User story:** As a consumer reading AgentForge documentation, I want public-facing docs to avoid decorative emoji so the material feels consistent and professional.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-10001 (merged)
**Status:** Merged (PR #100, 2026-05-04)

**Acceptance criteria:**
- [ ] Public-facing docs such as the root README, package READMEs, and selected docs-site pages have decorative emoji removed from headings, bullets, banners, and link callouts
- [ ] Wording remains materially unchanged aside from readability cleanup required by emoji removal
- [ ] Meaningful non-emoji Unicode and literal sample output are preserved unless explicitly documented otherwise
- [ ] The cleanup is limited to project-owned markdown and does not change runtime behavior
- [ ] Add or update story documentation at `docs/st10002-public-docs-emoji-normalization.md`

---

#### ST-10003: Normalize Emoji Usage in Planning and Internal Docs
**User story:** As a maintainer, I want planning and internal markdown to avoid decorative emoji so project tracking and internal documentation stay easier to scan and maintain.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-10001 (merged)
**Status:** Merged (PR #101, 2026-05-04)

**Acceptance criteria:**
- [ ] Planning docs, checklists, feature plans, and internal docs targeted by the audit have decorative emoji removed or replaced with plain-text status wording
- [ ] Existing planning semantics and status meaning remain intact after cleanup
- [ ] Internal documentation remains reviewable by keeping changes scoped to markdown presentation rather than content redesign
- [ ] The cleanup does not alter story IDs, acceptance criteria, or execution workflow conventions
- [ ] Add or update story documentation at `docs/st10003-internal-docs-emoji-normalization.md`

---

#### ST-10004: Normalize Emoji Usage in Examples and Template Docs
**User story:** As a developer using examples and templates, I want accompanying documentation to be clean and consistent without decorative emoji clutter.

**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Dependencies:** ST-10001 (merged)
**Status:** Merged (PR #102, 2026-05-05)

**Acceptance criteria:**
- [ ] Example READMEs, template docs, and similar supporting markdown targeted by the audit have decorative emoji removed
- [ ] Literal demo output keeps emoji only where the emoji is part of the demonstrated runtime behavior and is explicitly intended to stay
- [ ] The cleanup does not change example code, commands, or documented setup flow beyond markdown presentation
- [ ] Scope remains limited to project-owned markdown identified by the audit
- [ ] Add or update story documentation at `docs/st10004-example-template-docs-emoji-normalization.md`

---

#### ST-10005: Add Documentation Style Guardrails for Emoji Usage
**User story:** As a maintainer, I want a documented markdown style rule for emoji usage so future docs-only changes do not reintroduce inconsistent decoration across the repo.

**Priority:** P2 (Medium)
**Estimate:** 2 hours
**Dependencies:** ST-10001 (merged)
**Status:** Merged (PR #104, 2026-05-05)

**Acceptance criteria:**
- [ ] A contributor-facing or internal documentation style rule defines the expected policy for decorative emoji usage in project-owned markdown
- [ ] The rule distinguishes disallowed decorative emoji from acceptable literal sample output or meaningful symbols
- [ ] The style guidance references the evergreen EP-10 docs-only lane as the home for future markdown normalization stories
- [ ] The guidance is added to an appropriate existing docs/process file instead of creating redundant policy fragments
- [ ] Add or update story documentation at `docs/st10005-docs-style-guardrails.md`

---

#### ST-10006: Normalize Emoji Usage in Example Overview Docs
**User story:** As a developer browsing example catalogs, I want overview docs to avoid decorative emoji so navigation pages stay consistent and easy to scan.

**Priority:** P2 (Medium)
**Estimate:** 2 hours
**Dependencies:** ST-10001 (merged), ST-10005 (merged)
**Status:** Merged (PR #105, 2026-05-05)

**Acceptance criteria:**
- [ ] Example overview and index markdown targeted by the follow-up audit have decorative emoji removed from headings and similar navigation copy
- [ ] Functional pass/fail markers and literal sample output remain intact where they convey real documented meaning
- [ ] The cleanup does not change linked destinations, commands, example behavior, or code snippets beyond markdown presentation cleanup
- [ ] Scope remains limited to overview/index markdown rather than per-example deep-dive READMEs or runtime code
- [ ] Add or update story documentation at `docs/st10006-example-overview-docs-emoji-normalization.md`

---

## Story Summary

**Total Stories:** 88
**By Priority:**
- P0 (Critical): 17 stories
- P1 (High): 27 stories
- P2 (Medium): 44 stories

**Total Estimated Effort:** ~316 hours (39.5 working days)

**Dependency Chain:**
1. Phase 1 (Foundation): ST-01001 → ST-01002 → ST-01003 → ST-01004
2. Phase 2 (Core CRUD): ST-02001 → ST-02002 → ST-02003 → ST-02004 → ST-02005 (parallel with ST-02006)
3. Phase 3 (Schema): ST-03001 → ST-03002
4. Phase 4 (Advanced): ST-04001, ST-04002, ST-04003 (can be parallel)
5. Phase 5 (Quality): ST-05001 → ST-05002 → ST-05003 → ST-05004
6. Phase 6 (Agent Skills): ST-06001 → ST-06002 → ST-06003 → ST-06004 → ST-06005 → ST-06006
7. Phase 7 (Skills Extraction): ST-07001 → ST-07002 → [ST-07003, ST-07004 parallel] → ST-07005; ST-07001 → ST-07006 (independent)
8. Phase 8 (Type Safety Hardening): ST-08001 → [ST-08002, ST-08003, ST-08004 parallel]
9. Phase 9 (SOLID Micro-Refactors): ST-09001 (Merged) → ST-09002 (Merged) → ST-09003 (Merged) → ST-09004 (Merged) → ST-09005 (Merged) → ST-09006 (Merged) → ST-09007 (Merged) → ST-09008 (Merged) → ST-09009 (Merged) → ST-09010 (Merged) → ST-09011 (Merged) → ST-09012 (Merged) → ST-09013 (Merged) → ST-09014 (Merged) → ST-09015 (Merged) → ST-09016 (Merged) → ST-09017 (Merged) → ST-09018 (Merged) → ST-09019 (Merged) → ST-09020 (Merged) → ST-09021 (Merged) → ST-09022 (Merged) → ST-09023 (Merged); ST-09025 (Merged) → ST-09026 (Merged) → ST-09031 (Merged); ST-09027 (Merged) → ST-09028 (Merged) → ST-09030 (Merged); ST-09032 → ST-09033; ST-09034 (Merged) → ST-09035 (Merged) → ST-09036 (Merged) → ST-09041; ST-09023 (Merged) and ST-09029 (Merged) → ST-09037; ST-09038 independent; ST-09023 (Merged) → ST-09039; ST-09024 (Merged) → ST-09040 → ST-09042 → ST-09047; ST-09020 (Merged) → ST-09043; ST-09018 (Merged) → ST-09044; ST-09015 (Merged) → ST-09045 → ST-09048; ST-09038 (Merged) → ST-09046; ST-03002 (Merged) → ST-09055; ST-06005 (Merged) → ST-09056; ST-04001 (Merged) → ST-09057; ST-09032 (Merged) → ST-09058; ST-09037 (Merged) → ST-09059; ST-09045 (Merged) → ST-09060; ST-09050 (Merged) → ST-09061 (Merged) → ST-09062; ST-09051 (Merged) → ST-09063; ST-09043 (Merged) → ST-09064 → ST-09065; ST-09010 (Merged) → ST-09066
10. Phase 10 (Documentation Only Changes): ST-10001 → [ST-10002, ST-10003, ST-10004, ST-10005 parallel] → ST-10006; EP-10 remains evergreen and intentionally open for future docs-only stories even when no current stories are queued
