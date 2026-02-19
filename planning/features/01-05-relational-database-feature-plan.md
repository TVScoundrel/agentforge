# Feature Plan: Vendor-Agnostic Relational Database Access Tool

**Epic Range:** EP-01 through EP-05  
**Status:** In Progress  
**Last Updated:** 2026-02-19
**Active Story:** ST-03002 (In Review)

---

## Feature Overview

**Objective:** Create a vendor-agnostic relational database access tool for the AgentForge framework that abstracts away vendor-specific details while providing type-safe, agent-friendly database operations.

**Target Users:** 
- AgentForge developers building agents that need to interact with relational databases
- AI agents requiring structured data access capabilities
- Developers who want database flexibility without vendor lock-in

**Desired Outcomes:**
- Seamless database access across PostgreSQL, MySQL, SQLite, and other SQL databases
- Type-safe query building and execution
- Agent-friendly tools with clear schemas and error handling
- Consistent API regardless of underlying database vendor
- Easy integration with existing AgentForge patterns

**Business Value:**
- Reduces development time by providing ready-to-use database tools
- Enables database portability and flexibility
- Maintains AgentForge's production-ready quality standards
- Expands the framework's data access capabilities beyond Neo4j

---

## Technical Context

**Technology Stack:**
- **Primary Framework:** Drizzle ORM (vendor-agnostic, type-safe, lightweight)
- **Fallback/Query Builder:** Knex.js (for advanced query building if needed)
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Testing:** Vitest
- **Supported Databases:** PostgreSQL, MySQL, SQLite (initial), with extensibility for others

**Dependency Strategy:**
- **Core Dependencies:** `drizzle-orm`, `drizzle-kit` (required)
- **Peer Dependencies:** Database drivers (`pg`, `mysql2`, `better-sqlite3`) - users install only what they need
- **Dev Dependencies:** All database drivers for testing purposes only
- **Rationale:** Prevents bloating user installations - if you only use PostgreSQL, you don't need MySQL and SQLite drivers

**Rationale for Drizzle ORM:**
- Fully type-safe with TypeScript
- Vendor-agnostic (supports PostgreSQL, MySQL, SQLite, and more)
- Lightweight with minimal overhead
- SQL-like syntax that's easy to understand
- No magic - explicit and predictable
- Active development and modern architecture (2025-2026)
- Better performance than traditional ORMs like TypeORM
- Supports peer dependencies pattern for database drivers

**Integration Points:**
- Fits into existing `packages/tools/src/data/` structure
- Follows patterns established by Neo4j tools
- Exports through `@agentforge/tools` package
- Compatible with all AgentForge patterns (ReAct, Plan-Execute, etc.)

---

## Architecture

### Component Structure

```
packages/tools/src/data/relational/
├── connection/
│   ├── connection-manager.ts    # Manages DB connections
│   ├── connection-pool.ts       # Connection pooling
│   └── types.ts                 # Connection config types
├── query/
│   ├── query-builder.ts         # Drizzle query builder wrapper
│   ├── query-executor.ts        # Execute queries safely
│   └── types.ts                 # Query types
├── schema/
│   ├── schema-inspector.ts      # Introspect DB schema
│   └── types.ts                 # Schema types
├── tools/
│   ├── relational-query.ts      # Execute SQL queries
│   ├── relational-select.ts     # Type-safe SELECT operations
│   ├── relational-insert.ts     # Type-safe INSERT operations
│   ├── relational-update.ts     # Type-safe UPDATE operations
│   ├── relational-delete.ts     # Type-safe DELETE operations
│   └── relational-get-schema.ts # Get database schema
├── utils/
│   ├── sql-sanitizer.ts         # Sanitize SQL inputs
│   ├── result-formatter.ts      # Format query results
│   ├── error-handler.ts         # Database error handling
│   └── peer-dependency-checker.ts # Check for required peer deps
├── index.ts                     # Main exports
└── types.ts                     # Shared types
```

### Peer Dependency Pattern

Database drivers are configured as **peer dependencies** to prevent bloat:

- **User installs only what they need:**
  ```bash
  # PostgreSQL only
  pnpm add pg @types/pg

  # MySQL only
  pnpm add mysql2

  # SQLite only
  pnpm add better-sqlite3 @types/better-sqlite3
  ```

- **Runtime validation:** Connection manager checks for required driver and provides helpful error if missing
- **Development:** All drivers installed as dev dependencies for testing
- **Documentation:** Clear installation instructions in README

### Data Flow

1. **Connection Initialization:** Application creates connection manager with config
2. **Tool Registration:** Agent registers relational database tools
3. **Query Execution:** Agent invokes tool → Query builder → Drizzle → Database
4. **Result Formatting:** Raw results → Formatted output → Agent-friendly JSON
5. **Error Handling:** Database errors → Sanitized messages → Agent context

---

## Scope

### In Scope

**Phase 1: Core Foundation**
- Connection management for PostgreSQL, MySQL, SQLite
- Basic CRUD operations (SELECT, INSERT, UPDATE, DELETE)
- Schema introspection
- SQL query execution with parameterization
- Error handling and sanitization
- Basic connection pooling

**Phase 2: Advanced Features**
- Transaction support
- Batch operations
- Query result streaming for large datasets
- Advanced query building (joins, aggregations)
- Connection health checks and retry logic

**Phase 3: Documentation & Polish**
- Comprehensive API documentation
- Usage examples for each database vendor
- Integration examples with AgentForge patterns
- Performance optimization
- Security best practices documentation

### Out of Scope

- Schema migrations (use dedicated migration tools)
- ORM model definitions (focus on query execution)
- Database administration tools
- NoSQL database support (separate project)
- GraphQL integration
- Real-time subscriptions

---

## Constraints and Assumptions

**Constraints:**
- Must maintain consistency with existing AgentForge tool patterns
- Must provide comprehensive error handling for agent use
- Must support connection pooling and resource management
- Must be well-documented with examples
- Must include comprehensive tests

**Assumptions:**
- Users will provide database connection credentials via environment variables or configuration
- Connection management will be handled at the application level
- Schema migrations are out of scope (focus on query execution)
- Initial release supports read and write operations, advanced features (transactions, migrations) in future iterations

**Timeline:**
- Phase 1 (Core Foundation): 2-3 weeks
- Phase 2 (Advanced Features): 1-2 weeks
- Phase 3 (Documentation & Polish): 1 week
- **Total Estimated Duration:** 4-6 weeks

---

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Drizzle API changes | Medium | Low | Pin to stable version, monitor releases |
| Database-specific quirks | Medium | Medium | Comprehensive testing per vendor |
| Connection pool exhaustion | High | Low | Implement connection limits and monitoring |
| SQL injection vulnerabilities | High | Low | Use parameterized queries exclusively |
| Performance issues with large results | Medium | Medium | Implement streaming and pagination |

---

## Success Criteria

- [ ] All CRUD operations work across PostgreSQL, MySQL, and SQLite
- [ ] 100% test coverage for core functionality
- [ ] Zero SQL injection vulnerabilities
- [ ] Documentation covers all tools and examples
- [ ] Performance benchmarks meet or exceed Neo4j tools
- [ ] Successfully integrates with at least one AgentForge pattern example
- [ ] Passes all linting and type-checking

---

## Related Planning Documents

- **Epics and Stories:** `planning/epics-and-stories.md` (EP-01 through EP-05)
- **Execution Checklists:** `planning/checklists/epic-01-story-tasks.md` through `epic-05-story-tasks.md`
- **Kanban Queue:** `planning/kanban-queue.md`
- **Project Plan:** `planning/project-plan.md` (overall AgentForge Framework context)
