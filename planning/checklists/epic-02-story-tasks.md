# Epic 02: Query Execution and CRUD Operations - Story Tasks

## ST-02001: Implement Raw SQL Query Execution Tool

**Branch:** `feat/st-02001-raw-sql-query-tool`
**PR:** #28 https://github.com/TVScoundrel/agentforge/pull/28

### Checklist
- [x] Create branch `feat/st-02001-raw-sql-query-tool`
- [x] Create draft PR with story ID in title
- [x] Create `packages/tools/src/data/relational/query/types.ts` with query interfaces
- [x] Create `packages/tools/src/data/relational/query/query-executor.ts`
- [x] Implement `executeQuery()` function with parameterized query support
- [x] Add support for SELECT, INSERT, UPDATE, DELETE statements
- [x] Implement parameter binding for all database vendors
- [x] Add result formatting to JSON
- [x] Create `packages/tools/src/data/relational/tools/relational-query.ts`
- [x] Define Zod schema for tool input (sql, params, vendor)
- [x] Implement tool function using query executor
- [x] Add error handling with sanitized error messages
- [ ] Add query timeout configuration (deferred to future enhancement)
- [x] Add query logging (optional, configurable)
- [x] Export tool from `tools/index.ts`
- [x] Create unit tests for query executor
- [x] Create unit tests for relational-query tool
- [x] Add or update story documentation at docs/st02001-raw-sql-query-tool.md (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [x] Run full test suite before finalizing the PR and record results (1108 passed, 32 skipped)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results (ST-02001 files lint-clean)
- [x] Mark PR ready for review
- [ ] Wait for merge (PR #28: https://github.com/TVScoundrel/agentforge/pull/28)

---

## ST-02002: Implement Type-Safe SELECT Tool

**Branch:** `feat/st-02002-type-safe-select-tool`

### Checklist
- [x] Create branch `feat/st-02002-type-safe-select-tool` ✅ DONE
- [x] Create draft PR with story ID in title ✅ DONE (PR #30)
- [x] Create `packages/tools/src/data/relational/query/query-builder.ts` ✅ SKIPPED (implemented directly in tool using Drizzle sql template API)
- [x] Implement SELECT query builder using Drizzle ✅ DONE (in relational-select.ts)
- [x] Add support for WHERE conditions (eq, ne, gt, lt, like, in, etc.) ✅ DONE
- [x] Add support for ORDER BY (asc, desc) ✅ DONE
- [x] Add support for LIMIT and OFFSET ✅ DONE
- [x] Add support for column selection (specific columns or all) ✅ DONE
- [x] Create `packages/tools/src/data/relational/tools/relational-select.ts` ✅ DONE
- [x] Define Zod schema for tool input (table, columns, where, orderBy, limit) ✅ DONE
- [x] Implement tool function using query builder ✅ DONE
- [x] Add type-safe result mapping ✅ DONE
- [x] Add clear error messages for invalid queries ✅ DONE
- [x] Handle empty result sets gracefully ✅ DONE
- [x] Export tool from `tools/index.ts` ✅ DONE
- [x] Create unit tests for query builder ✅ DONE (in relational-select-tool.test.ts)
- [x] Create unit tests for relational-select tool ✅ DONE (8 passed, 6 skipped)
- [x] Add or update story documentation at docs/st02002-type-safe-select-tool.md (or document why not required) ✅ DONE
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required ✅ DONE
- [x] Run full test suite before finalizing the PR and record results ✅ DONE (1118 passed, 62 skipped)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results ✅ DONE (All issues in new code fixed)
- [x] Mark PR ready for review ✅ DONE (PR #30: https://github.com/TVScoundrel/agentforge/pull/30)
- [x] Wait for merge ✅ DONE (merged 2026-02-18 via PR #30)

---

## ST-02003: Implement Type-Safe INSERT Tool

**Branch:** `feat/st-02003-type-safe-insert-tool`

### Checklist
- [ ] Create branch `feat/st-02003-type-safe-insert-tool`
- [ ] Create draft PR with story ID in title
- [ ] Extend query builder with INSERT support
- [ ] Add support for single row insert
- [ ] Add support for multiple row insert (batch)
- [ ] Add support for returning inserted row IDs
- [ ] Add support for returning full inserted rows (configurable)
- [ ] Create `packages/tools/src/data/relational/tools/relational-insert.ts`
- [ ] Define Zod schema for tool input (table, data, returning)
- [ ] Implement tool function using query builder
- [ ] Add type validation for input data
- [ ] Add constraint violation error handling (unique, foreign key, etc.)
- [ ] Add support for default values and auto-increment fields
- [ ] Handle vendor-specific RETURNING clause differences
- [ ] Export tool from `tools/index.ts`
- [ ] Create unit tests for INSERT query builder
- [ ] Create unit tests for relational-insert tool
- [ ] Add or update story documentation at docs/st02003-type-safe-insert-tool.md (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Mark PR ready for review
- [ ] Wait for merge

---

## ST-02004: Implement Type-Safe UPDATE Tool

**Branch:** `feat/st-02004-type-safe-update-tool`

### Checklist
- [ ] Create branch `feat/st-02004-type-safe-update-tool`
- [ ] Create draft PR with story ID in title
- [ ] Extend query builder with UPDATE support
- [ ] Add support for WHERE conditions (required for safety)
- [ ] Add support for returning count of affected rows
- [ ] Create `packages/tools/src/data/relational/tools/relational-update.ts`
- [ ] Define Zod schema for tool input (table, data, where, allowFullTableUpdate)
- [ ] Implement tool function using query builder
- [ ] Add type validation for update data
- [ ] Prevent accidental full-table updates (require explicit flag)
- [ ] Add optimistic locking support (optional, version field)
- [ ] Handle constraint violations
- [ ] Export tool from `tools/index.ts`
- [ ] Create unit tests for UPDATE query builder
- [ ] Create unit tests for relational-update tool
- [ ] Test full-table update prevention
- [ ] Add or update story documentation at docs/st02004-type-safe-update-tool.md (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Mark PR ready for review
- [ ] Wait for merge

---

## ST-02005: Implement Type-Safe DELETE Tool

**Branch:** `feat/st-02005-type-safe-delete-tool`

### Checklist
- [ ] Create branch `feat/st-02005-type-safe-delete-tool`
- [ ] Create draft PR with story ID in title
- [ ] Extend query builder with DELETE support
- [ ] Add support for WHERE conditions (required for safety)
- [ ] Add support for returning count of deleted rows
- [ ] Create `packages/tools/src/data/relational/tools/relational-delete.ts`
- [ ] Define Zod schema for tool input (table, where, allowFullTableDelete)
- [ ] Implement tool function using query builder
- [ ] Prevent accidental full-table deletes (require explicit flag)
- [ ] Add cascade delete handling
- [ ] Add soft delete support (optional, deletedAt field)
- [ ] Handle foreign key constraint violations
- [ ] Export tool from `tools/index.ts`
- [ ] Create unit tests for DELETE query builder
- [ ] Create unit tests for relational-delete tool
- [ ] Test full-table delete prevention
- [ ] Add or update story documentation at docs/st02005-type-safe-delete-tool.md (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Mark PR ready for review
- [ ] Wait for merge

---

## ST-02006: Implement SQL Sanitization and Security

**Branch:** `feat/st-02006-sql-sanitization-security`

### Checklist
- [x] Create branch `feat/st-02006-sql-sanitization-security` ✅ DONE
- [x] Create draft PR with story ID in title ✅ DONE (PR #31)
- [ ] Create `packages/tools/src/data/relational/utils/sql-sanitizer.ts`
- [ ] Implement input validation for SQL strings
- [ ] Implement input escaping for special characters
- [ ] Add dangerous SQL pattern detection (DROP, TRUNCATE, ALTER in user input)
- [ ] Add table name validation (alphanumeric, underscore only)
- [ ] Add column name validation
- [ ] Enforce parameterized query usage in all tools
- [ ] Create security documentation in docs/
- [ ] Document SQL injection prevention best practices
- [ ] Create unit tests for SQL sanitizer
- [ ] Create unit tests for common injection patterns
- [ ] Test against OWASP SQL injection examples
- [ ] Add security audit checklist
- [ ] Add or update story documentation at docs/st02006-sql-sanitization-security.md (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Mark PR ready for review
- [ ] Wait for merge

---

## Epic 02 Completion Criteria

- [ ] All 6 stories merged
- [ ] All CRUD operations work across all supported databases
- [ ] SQL injection prevention verified
- [ ] All tests passing
- [ ] Security documentation complete
