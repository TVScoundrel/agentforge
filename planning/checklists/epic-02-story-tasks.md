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
- [x] Create branch `feat/st-02003-type-safe-insert-tool`
- [x] Create draft PR with story ID in title (PR #34)
- [x] Extend query builder with INSERT support
- [x] Add support for single row insert
- [x] Add support for multiple row insert (batch)
- [x] Add support for returning inserted row IDs
- [x] Add support for returning full inserted rows (configurable)
- [x] Create relational-insert tool module at `packages/tools/src/data/relational/tools/relational-insert/`
- [x] Define Zod schema for tool input (table, data, returning)
- [x] Implement tool function using query builder
- [x] Add type validation for input data
- [x] Add constraint violation error handling (unique, foreign key, etc.)
- [x] Add support for default values and auto-increment fields
- [x] Handle vendor-specific RETURNING clause differences
- [x] Export tool from `tools/index.ts`
- [x] Create unit tests for INSERT query builder
- [x] Create unit tests for relational-insert tool
- [x] Add or update story documentation at docs/st02003-type-safe-insert-tool.md (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required (added relational-insert query-builder + schema + tool invocation tests)
- [x] Run full test suite before finalizing the PR and record results (`pnpm test --run` -> 1212 passed, 105 skipped)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results (`pnpm lint` -> 0 errors, warnings-only baseline output across workspace)
- [x] Mark PR ready for review (PR #34: https://github.com/TVScoundrel/agentforge/pull/34)
- [x] Wait for merge ✅ DONE (merged 2026-02-19 via PR #34)

---

## ST-02004: Implement Type-Safe UPDATE Tool

**Branch:** `feat/st-02004-type-safe-update-tool`

### Checklist
- [x] Create branch `feat/st-02004-type-safe-update-tool`
- [x] Create draft PR with story ID in title (PR #35)
- [x] Extend query builder with UPDATE support
- [x] Add support for WHERE conditions (required for safety)
- [x] Add support for returning count of affected rows
- [x] Create relational-update tool module at `packages/tools/src/data/relational/tools/relational-update/`
- [x] Define Zod schema for tool input (table, data, where, allowFullTableUpdate)
- [x] Implement tool function using query builder
- [x] Add type validation for update data
- [x] Prevent accidental full-table updates (require explicit flag)
- [x] Add optimistic locking support (optional, version field)
- [x] Handle constraint violations
- [x] Export tool from `tools/index.ts`
- [x] Create unit tests for UPDATE query builder
- [x] Create unit tests for relational-update tool
- [x] Test full-table update prevention
- [x] Add or update story documentation at docs/st02004-type-safe-update-tool.md (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required (added relational-update schema + query-builder + tool invocation tests)
- [x] Run full test suite before finalizing the PR and record results (`pnpm test --run` -> 1234 passed, 121 skipped)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results (0 errors; warnings-only baseline outside story scope)
- [x] Mark PR ready for review (PR #35 marked ready on 2026-02-19)
- [x] Wait for merge ✅ DONE (merged 2026-02-19 via PR #35)

---

## ST-02005: Implement Type-Safe DELETE Tool

**Branch:** `feat/st-02005-type-safe-delete-tool`

### Checklist
- [x] Create branch `feat/st-02005-type-safe-delete-tool`
- [x] Create draft PR with story ID in title (PR #38)
- [x] Extend query builder with DELETE support
- [x] Add support for WHERE conditions (required for safety)
- [x] Add support for returning count of deleted rows
- [x] Create relational-delete tool module at `packages/tools/src/data/relational/tools/relational-delete/`
- [x] Define Zod schema for tool input (table, where, allowFullTableDelete)
- [x] Implement tool function using query builder
- [x] Prevent accidental full-table deletes (require explicit flag)
- [x] Add cascade delete handling
- [x] Add soft delete support (optional, deletedAt field)
- [x] Handle foreign key constraint violations
- [x] Export tool from `tools/index.ts`
- [x] Create unit tests for DELETE query builder
- [x] Create unit tests for relational-delete tool
- [x] Test full-table delete prevention
- [x] Add or update story documentation at docs/st02005-type-safe-delete-tool.md (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required (added relational-delete schema + query-builder + tool invocation tests)
- [x] Run full test suite before finalizing the PR and record results (`pnpm test --run` -> 112 passed, 4 skipped files; 1334 passed, 143 skipped tests)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results (`pnpm lint` -> 0 errors; warnings-only baseline across workspace)
- [x] Mark PR ready for review (PR #38 marked ready on 2026-02-20)
- [ ] Wait for merge

---

## ST-02006: Implement SQL Sanitization and Security

**Branch:** `feat/st-02006-sql-sanitization-security`

### Checklist
- [x] Create branch `feat/st-02006-sql-sanitization-security` ✅ DONE
- [x] Create draft PR with story ID in title ✅ DONE (PR #31)
- [x] Create `packages/tools/src/data/relational/utils/sql-sanitizer.ts` ✅ DONE
- [x] Implement input validation for SQL strings ✅ DONE
- [ ] Implement input escaping for special characters ⏳ Deferred / out of scope for ST-02006 (current mitigation relies on parameterized queries; no dedicated escaping utility implemented in this story)
- [x] Add dangerous SQL pattern detection (CREATE, DROP, TRUNCATE, ALTER in user input) ✅ DONE
- [ ] Add table name validation (alphanumeric, underscore only) ⏳ Deferred / out of scope for ST-02006 (raw SQL path does not implement standalone identifier validators in this story)
- [ ] Add column name validation ⏳ Deferred / out of scope for ST-02006 (raw SQL path does not implement standalone identifier validators in this story)
- [x] Enforce parameterized query usage in all tools ✅ DONE (integrated into relational query execution path)
- [x] Create security documentation in docs/ ✅ DONE (`docs/sql-injection-prevention-best-practices.md`)
- [x] Document SQL injection prevention best practices ✅ DONE
- [x] Create unit tests for SQL sanitizer ✅ DONE
- [x] Create unit tests for common injection patterns ✅ DONE
- [x] Test against OWASP SQL injection examples ✅ DONE
- [x] Add security audit checklist ✅ DONE (included in security docs)
- [x] Add or update story documentation at docs/st02006-sql-sanitization-security.md (or document why not required) ✅ DONE
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required ✅ DONE (added sanitizer + relational query security tests)
- [x] Run full test suite before finalizing the PR and record results ✅ DONE (`pnpm test --run` -> 96 passed, 1 skipped file; 1184 passed, 80 skipped tests)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results ✅ DONE (`pnpm lint` -> 0 errors; warnings-only output after PR #32 merged)
- [x] Document lint baseline scope for reviewers and mark baseline remediation out-of-scope for ST-02006 ✅ DONE (PR #32 merged on 2026-02-18; PR #31 scope note updated)
- [x] Mark PR ready for review ✅ DONE (PR #31 undrafted and ready)
- [x] Wait for merge ✅ DONE (PR #31 merged on 2026-02-19)

---

## Epic 02 Completion Criteria

- [ ] All 6 stories merged
- [ ] All CRUD operations work across all supported databases
- [ ] SQL injection prevention verified
- [ ] All tests passing
- [ ] Security documentation complete
