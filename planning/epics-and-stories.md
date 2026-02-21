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

### EP-05: Documentation, Examples, and Testing
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

**Stories:** ST-06001 through ST-06005

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

- Goal: add first-class Agent Skills support so AgentForge agents can discover and use reusable `SKILL.md` capabilities.
- Scope:
  - In: local skill discovery, metadata-based selection, progressive loading, trust policies, and conformance documentation/tests.
  - Out: remote skill marketplaces, automatic download/install from third-party registries, and non-markdown skill formats.
- Critical edge cases:
  - malformed or missing skill metadata,
  - conflicting skill names across roots,
  - path traversal or unsafe script execution attempts.
- Delivery controls:
  - feature flag for rollout (`agentSkills.enabled`),
  - structured selection/load telemetry,
  - explicit rollback path to disable skill loading while preserving baseline agent behavior.

#### ST-06001: Implement Skill Discovery and Metadata Registry
**User story:** As a framework developer, I want AgentForge to discover skills from standard directories so that agents can be configured with reusable capabilities.

**Priority:** P0 (Critical)
**Estimate:** 5 hours
**Dependencies:** None

**Acceptance criteria:**
- [ ] Skill discovery scans configurable roots (`.agents/skills`, `$HOME/.agents/skills`, plus runtime-configured paths)
- [ ] A skill is recognized only when a directory contains a valid `SKILL.md`
- [ ] Metadata parser extracts `name` and `description` (and optional fields) from frontmatter/content
- [ ] Invalid skills are skipped with actionable structured warnings (without aborting runtime startup)
- [ ] Registry API returns discovered skills with canonical ID, source path, and metadata summary
- [ ] Unit tests cover root scanning, metadata parsing, duplicate IDs, and invalid skill handling

---

#### ST-06002: Implement Skill Matching and Activation Planning
**User story:** As an agent runtime, I want to select relevant skills for a task so that only useful capabilities are activated.

**Priority:** P0 (Critical)
**Estimate:** 6 hours
**Dependencies:** ST-06001

**Acceptance criteria:**
- [ ] Matching logic ranks skills from user task/context using metadata descriptions and optional tags
- [ ] Deterministic tie-break behavior and configurable `maxSelectedSkills` are implemented
- [ ] Planner output includes selected skill IDs and selection rationale before activation
- [ ] No-match path is explicit and continues baseline execution safely
- [ ] Selection decisions emit structured observability events for debugging/auditing
- [ ] Unit tests cover ranking quality, deterministic selection, and no-skill scenarios

---

#### ST-06003: Implement Progressive Skill Loading and Resource Resolution
**User story:** As an agent runtime, I want full skill instructions loaded only when needed so that context stays efficient and safe.

**Priority:** P1 (High)
**Estimate:** 7 hours
**Dependencies:** ST-06002

**Acceptance criteria:**
- [ ] Runtime loads full `SKILL.md` content only for selected skills at activation time
- [ ] Relative references (`scripts/`, `references/`, `assets/`) are resolved from the skill root
- [ ] Progressive disclosure policy is enforced (load only referenced resources needed for the active task)
- [ ] Missing referenced files return actionable errors without crashing unrelated agent flow
- [ ] Token/context budget controls cap loaded skill content per run
- [ ] Integration tests validate end-to-end loading against fixture skill packs

---

#### ST-06004: Implement Skill Trust Policies and Execution Guardrails
**User story:** As a platform owner, I want explicit trust controls for skills so that agents cannot execute unsafe skill resources.

**Priority:** P1 (High)
**Estimate:** 6 hours
**Dependencies:** ST-06003

**Acceptance criteria:**
- [ ] Trust policy levels (`workspace`, `trusted`, `untrusted`) are configurable per skill root
- [ ] Script execution from untrusted roots is denied by default unless explicitly allowed
- [ ] Path traversal and out-of-root file access are blocked for all skill resource resolution
- [ ] Guardrail decisions are logged with policy reason codes
- [ ] Security tests validate traversal blocking and script execution policy enforcement
- [ ] Operational docs define secure defaults and escalation workflow for trusted skills

---

#### ST-06005: Publish Agent Skills Integration Documentation and Conformance Suite
**User story:** As a developer, I want clear docs and conformance checks so that I can enable Agent Skills confidently in production.

**Priority:** P1 (High)
**Estimate:** 6 hours
**Dependencies:** ST-06003, ST-06004

**Acceptance criteria:**
- [ ] Developer guide documents how to enable and configure Agent Skills in AgentForge
- [ ] Authoring guide maps Agent Skills specification expectations to AgentForge behavior
- [ ] End-to-end demo shows an agent using at least two skills from different roots
- [ ] Conformance test suite covers discovery, selection, progressive loading, and trust policies
- [ ] CI job runs conformance suite and fails on regressions
- [ ] Rollout checklist includes feature-flag enablement, observability checks, and rollback procedure

---

## Story Summary

**Total Stories:** 24
**By Priority:**
- P0 (Critical): 12 stories
- P1 (High): 9 stories
- P2 (Medium): 3 stories

**Total Estimated Effort:** ~110 hours (14 working days)

**Dependency Chain:**
1. Phase 1 (Foundation): ST-01001 → ST-01002 → ST-01003 → ST-01004
2. Phase 2 (Core CRUD): ST-02001 → ST-02002 → ST-02003 → ST-02004 → ST-02005 (parallel with ST-02006)
3. Phase 3 (Schema): ST-03001 → ST-03002
4. Phase 4 (Advanced): ST-04001, ST-04002, ST-04003 (can be parallel)
5. Phase 5 (Quality): ST-05001 → ST-05002 → ST-05003 → ST-05004
6. Phase 6 (Agent Skills): ST-06001 → ST-06002 → ST-06003 → ST-06004 → ST-06005
