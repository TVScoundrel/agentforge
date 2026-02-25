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

### EP-05: Documentation, Examples, and Testing ✅ Complete
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
**Capability:** Move the Agent Skills subsystem from `@agentforge/core` into a standalone `@agentforge/skills` package to keep core lean and make skills an explicit opt-in dependency.

**Outcomes:**
- `@agentforge/core` remains focused on primitives (tool builder, state, middleware, streaming, observability)
- Skills-specific dependency (`gray-matter`) no longer ships with core
- Consumers install `@agentforge/skills` only when they need skill features
- `@agentforge/skills` depends on `@agentforge/core` (same pattern as `@agentforge/patterns`)
- Public API and import paths migrate from `@agentforge/core` to `@agentforge/skills` with deprecation re-exports in core for one minor version

**Stories:** ST-07001 through ST-07005

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
**User story:** As a maintainer, I want a new `packages/skills` workspace package with the standard monorepo scaffolding so that the skills code has a proper home.

**Priority:** P0 (Critical)
**Estimate:** 3 hours
**Dependencies:** None (EP-06 complete)

**Acceptance criteria:**
- [ ] `packages/skills/` created with `package.json`, `tsconfig.json`, `tsup.config.ts` matching monorepo conventions
- [ ] `@agentforge/core` listed as a peer dependency (and dev dependency)
- [ ] `gray-matter` dependency moved from core's `package.json` to skills' `package.json`
- [ ] Dual ESM/CJS build outputs configured (`dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`)
- [ ] Package registered in `pnpm-workspace.yaml`
- [ ] `pnpm install` and `pnpm -r build` succeed with the new package present
- [ ] Vitest workspace config updated to include `packages/skills`

---

#### ST-07002: Move Skills Source Files and Re-wire Imports
**User story:** As a developer, I want the skills source code to live in `packages/skills/src/` with correct imports so that the module is self-contained.

**Priority:** P0 (Critical)
**Estimate:** 5 hours
**Dependencies:** ST-07001

**Acceptance criteria:**
- [ ] All files from `packages/core/src/skills/` moved to `packages/skills/src/`
- [ ] Internal relative imports (`../tools/builder.js`, `../tools/types.js`, `../langgraph/observability/logger.js`) replaced with `@agentforge/core` package imports
- [ ] `packages/skills/src/index.ts` barrel export matches the previous public surface from `packages/core/src/skills/index.ts`
- [ ] `ToolCategory.SKILLS` enum value remains in `@agentforge/core` (it's a core primitive)
- [ ] `pnpm -r build` succeeds; `@agentforge/skills` produces valid ESM/CJS output
- [ ] TypeScript strict mode passes with no new errors

---

#### ST-07003: Add Deprecation Re-exports in Core
**User story:** As a consumer who imports skills from `@agentforge/core`, I want my existing imports to keep working (with a deprecation warning) for one minor version so that I have time to migrate.

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
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results

---

## Story Summary

**Total Stories:** 30
**By Priority:**
- P0 (Critical): 15 stories
- P1 (High): 12 stories
- P2 (Medium): 3 stories

**Total Estimated Effort:** ~135 hours (16.9 working days)

**Dependency Chain:**
1. Phase 1 (Foundation): ST-01001 → ST-01002 → ST-01003 → ST-01004
2. Phase 2 (Core CRUD): ST-02001 → ST-02002 → ST-02003 → ST-02004 → ST-02005 (parallel with ST-02006)
3. Phase 3 (Schema): ST-03001 → ST-03002
4. Phase 4 (Advanced): ST-04001, ST-04002, ST-04003 (can be parallel)
5. Phase 5 (Quality): ST-05001 → ST-05002 → ST-05003 → ST-05004
6. Phase 6 (Agent Skills): ST-06001 → ST-06002 → ST-06003 → ST-06004 → ST-06005 → ST-06006
7. Phase 7 (Skills Extraction): ST-07001 → ST-07002 → [ST-07003, ST-07004 parallel] → ST-07005
