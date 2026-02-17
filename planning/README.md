# Relational Database Access Tool - Planning Overview

## Project Summary

This project adds vendor-agnostic relational database access capabilities to the AgentForge framework using Drizzle ORM. The tool will support PostgreSQL, MySQL, and SQLite with a consistent, type-safe API.

## Quick Start

### For Developers

1. **Review the Project Plan:** Start with `planning/project-plan.md` to understand the architecture, scope, and technical decisions.

2. **Understand the Epics:** Read `planning/epics-and-stories.md` to see all 5 epics and 19 stories.

3. **Check the Kanban Queue:** View `planning/kanban-queue.md` to see what's ready to work on.

4. **Start with ST-01001:** The first story is "Setup Drizzle ORM Dependencies and Project Structure" - this establishes the foundation.

### For Story Execution

Use the `@story-executor` skill to execute stories:

```
@story-executor Execute story ST-01001
```

Or to execute the next ready story:

```
@story-executor Execute the next ready story
```

## Planning Artifacts

### Core Planning Files

- **`project-plan.md`** - Comprehensive project overview, architecture, scope, and success criteria
- **`epics-and-stories.md`** - All epics and stories with acceptance criteria
- **`kanban-queue.md`** - Active delivery queue with Ready/In Progress/In Review/Blocked/Backlog lanes

### Checklists (Execution Detail)

- **`checklists/epic-01-story-tasks.md`** - Connection Management tasks
- **`checklists/epic-02-story-tasks.md`** - CRUD Operations tasks
- **`checklists/epic-03-story-tasks.md`** - Schema Introspection tasks
- **`checklists/epic-04-story-tasks.md`** - Advanced Features tasks
- **`checklists/epic-05-story-tasks.md`** - Testing & Documentation tasks

### Archives

- **`archives/kanban-done-stories.md`** - Completed and merged stories

## Epic Overview

### EP-01: Core Database Connection Management (4 stories)
Establish vendor-agnostic connections with pooling and lifecycle management.

**Key Stories:**
- ST-01001: Setup dependencies and structure
- ST-01002: Connection manager
- ST-01003: Connection pooling
- ST-01004: Lifecycle management

### EP-02: Query Execution and CRUD Operations (6 stories)
Type-safe CRUD operations and raw SQL execution.

**Key Stories:**
- ST-02001: Raw SQL query tool
- ST-02002: Type-safe SELECT
- ST-02003: Type-safe INSERT
- ST-02004: Type-safe UPDATE
- ST-02005: Type-safe DELETE
- ST-02006: SQL sanitization and security

### EP-03: Schema Introspection and Metadata (2 stories)
Discover database schemas and validate queries.

**Key Stories:**
- ST-03001: Schema introspection tool
- ST-03002: Schema metadata utilities

### EP-04: Advanced Features and Optimization (3 stories)
Transactions, batch operations, and streaming.

**Key Stories:**
- ST-04001: Transaction support
- ST-04002: Batch operations
- ST-04003: Result streaming

### EP-05: Documentation, Examples, and Testing (4 stories)
Production-ready quality with comprehensive tests and docs.

**Key Stories:**
- ST-05001: Comprehensive unit tests
- ST-05002: Integration tests
- ST-05003: Usage examples and documentation
- ST-05004: Advanced integration examples

## Technology Stack

- **ORM:** Drizzle ORM (vendor-agnostic, type-safe, lightweight)
- **Databases:** PostgreSQL, MySQL, SQLite
- **Language:** TypeScript
- **Testing:** Vitest
- **Package Manager:** pnpm

## Key Architectural Decisions

### Peer Dependencies Pattern

Database drivers (pg, mysql2, better-sqlite3) are configured as **peer dependencies** rather than regular dependencies. This means:

- ✅ Users only install the database drivers they actually need
- ✅ Smaller installation footprint (no bloat from unused drivers)
- ✅ Faster installation times
- ✅ Clear dependency management

**Example:** If you only use PostgreSQL, you only install `pg` - you don't need MySQL or SQLite drivers.

See `planning/PEER_DEPENDENCIES.md` for detailed implementation strategy.

## Estimated Timeline

- **Phase 1 (Core Foundation):** 2-3 weeks (EP-01, EP-02)
- **Phase 2 (Advanced Features):** 1-2 weeks (EP-03, EP-04)
- **Phase 3 (Documentation & Polish):** 1 week (EP-05)
- **Total:** 4-6 weeks (~80 hours)

## Success Criteria

- [ ] All CRUD operations work across PostgreSQL, MySQL, and SQLite
- [ ] 100% test coverage for core functionality
- [ ] Zero SQL injection vulnerabilities
- [ ] Documentation covers all tools and examples
- [ ] Performance benchmarks meet or exceed Neo4j tools
- [ ] Successfully integrates with at least one AgentForge pattern example
- [ ] Passes all linting and type-checking

## Next Steps

1. Review `planning/project-plan.md` for detailed architecture
2. Review `planning/epics-and-stories.md` for all stories
3. Execute ST-01001 using `@story-executor`
4. Follow the Kanban workflow through completion

## Questions?

Refer to the project plan or ask for clarification on any story or epic.

