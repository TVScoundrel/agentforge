# Epic 03: Schema Introspection and Metadata - Story Tasks

## ST-03001: Implement Schema Introspection Tool

**Branch:** `feat/st-03001-schema-introspection-tool`

### Checklist
- [x] Create branch `feat/st-03001-schema-introspection-tool` ✅ DONE
- [x] Create draft PR with story ID in title ✅ DONE (PR #33)
- [ ] Create `packages/tools/src/data/relational/schema/types.ts` with schema interfaces
- [ ] Define `TableSchema`, `ColumnSchema`, `IndexSchema` interfaces
- [ ] Create `packages/tools/src/data/relational/schema/schema-inspector.ts`
- [ ] Implement PostgreSQL schema introspection using information_schema
- [ ] Implement MySQL schema introspection using information_schema
- [ ] Implement SQLite schema introspection using sqlite_master
- [ ] Extract table names from database
- [ ] Extract column information (name, type, nullable, default)
- [ ] Extract primary key information
- [ ] Extract foreign key information
- [ ] Extract index information
- [ ] Create `packages/tools/src/data/relational/tools/relational-get-schema.ts`
- [ ] Define Zod schema for tool input (database, tables filter)
- [ ] Implement tool function using schema inspector
- [ ] Add schema caching with configurable TTL
- [ ] Add cache invalidation method
- [ ] Export tool from `tools/index.ts`
- [ ] Create unit tests for schema inspector
- [ ] Create integration tests with real databases
- [ ] Add or update story documentation at docs/st03001-schema-introspection-tool.md (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Mark PR ready for review
- [ ] Wait for merge

---

## ST-03002: Implement Schema Metadata Utilities

**Branch:** `feat/st-03002-schema-metadata-utilities`

### Checklist
- [ ] Create branch `feat/st-03002-schema-metadata-utilities`
- [ ] Create draft PR with story ID in title
- [ ] Create `packages/tools/src/data/relational/schema/schema-validator.ts`
- [ ] Implement table existence validator
- [ ] Implement column existence validator
- [ ] Implement column type validator
- [ ] Create type mapper for DB types to TypeScript types
- [ ] Map PostgreSQL types to TypeScript
- [ ] Map MySQL types to TypeScript
- [ ] Map SQLite types to TypeScript
- [ ] Create schema diff utility for testing
- [ ] Implement schema comparison logic
- [ ] Implement schema export to JSON format
- [ ] Add schema import from JSON (for testing)
- [ ] Export utilities from `schema/index.ts`
- [ ] Create unit tests for validators
- [ ] Create unit tests for type mapper
- [ ] Create unit tests for schema diff
- [ ] Add or update story documentation at docs/st03002-schema-metadata-utilities.md (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Mark PR ready for review
- [ ] Wait for merge

---

## Epic 03 Completion Criteria

- [ ] All 2 stories merged
- [ ] Schema introspection works for all supported databases
- [ ] Schema validation utilities functional
- [ ] All tests passing
- [ ] Documentation complete
