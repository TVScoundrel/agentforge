# Epic 03: Schema Introspection and Metadata - Story Tasks

## ST-03001: Implement Schema Introspection Tool

**Branch:** `feat/st-03001-schema-introspection-tool`

### Checklist
- [x] Create branch `feat/st-03001-schema-introspection-tool` ✅ DONE
- [x] Create draft PR with story ID in title ✅ DONE (PR #33)
- [x] Create `packages/tools/src/data/relational/schema/types.ts` with schema interfaces ✅ DONE
- [x] Define `TableSchema`, `ColumnSchema`, `IndexSchema` interfaces ✅ DONE
- [x] Create `packages/tools/src/data/relational/schema/schema-inspector.ts` ✅ DONE
- [x] Implement PostgreSQL schema introspection using information_schema ✅ DONE
- [x] Implement MySQL schema introspection using information_schema ✅ DONE
- [x] Implement SQLite schema introspection using sqlite_master ✅ DONE
- [x] Extract table names from database ✅ DONE
- [x] Extract column information (name, type, nullable, default) ✅ DONE
- [x] Extract primary key information ✅ DONE
- [x] Extract foreign key information ✅ DONE
- [x] Extract index information ✅ DONE
- [x] Create `packages/tools/src/data/relational/tools/relational-get-schema.ts` ✅ DONE
- [x] Define Zod schema for tool input (database, tables filter) ✅ DONE
- [x] Implement tool function using schema inspector ✅ DONE
- [x] Add schema caching with configurable TTL ✅ DONE
- [x] Add cache invalidation method ✅ DONE
- [x] Export tool from `tools/index.ts` ✅ DONE
- [x] Create unit tests for schema inspector ✅ DONE
- [x] Create integration tests with real databases ✅ DONE (SQLite-backed integration tests)
- [x] Add or update story documentation at docs/st03001-schema-introspection-tool.md (or document why not required) ✅ DONE
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required ✅ DONE (added unit + integration coverage for schema introspection and tool invocation)
- [x] Run full test suite before finalizing the PR and record results ✅ DONE (`pnpm test --run` -> 98 passed files, 1 skipped file; 1188 passed, 82 skipped tests)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results ✅ DONE (`pnpm lint` -> 0 errors; warnings-only baseline output)
- [x] Mark PR ready for review ✅ DONE (PR #33 undrafted)
- [x] Wait for merge ✅ DONE (PR #33 merged on 2026-02-19)

---

## ST-03002: Implement Schema Metadata Utilities

**Branch:** `feat/st-03002-schema-metadata-utilities`

### Checklist
- [x] Create branch `feat/st-03002-schema-metadata-utilities`
- [x] Create draft PR with story ID in title (PR #37)
- [x] Create `packages/tools/src/data/relational/schema/schema-validator.ts`
- [x] Implement table existence validator
- [x] Implement column existence validator
- [x] Implement column type validator
- [x] Create type mapper for DB types to TypeScript types
- [x] Map PostgreSQL types to TypeScript
- [x] Map MySQL types to TypeScript
- [x] Map SQLite types to TypeScript
- [x] Create schema diff utility for testing
- [x] Implement schema comparison logic
- [x] Implement schema export to JSON format
- [x] Add schema import from JSON (for testing)
- [x] Export utilities from `schema/index.ts`
- [x] Create unit tests for validators
- [x] Create unit tests for type mapper
- [x] Create unit tests for schema diff
- [x] Add or update story documentation at docs/st03002-schema-metadata-utilities.md (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required (added 68 unit tests across 3 test files)
- [x] Run full test suite before finalizing the PR and record results (`pnpm test --run` -> 1316 passed, 127 skipped)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results (0 errors; 109 warnings-only baseline outside story scope)
- [x] Mark PR ready for review (PR #37 marked ready on 2026-02-19)
- [x] Wait for merge
  - Merged PR: https://github.com/TVScoundrel/agentforge/pull/37 (merged 2026-02-19)

---

## Epic 03 Completion Criteria

- [x] All 2 stories merged
- [ ] Schema introspection works for all supported databases
- [ ] Schema validation utilities functional
- [ ] All tests passing
- [ ] Documentation complete
