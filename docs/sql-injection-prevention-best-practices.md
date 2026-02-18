# SQL Injection Prevention Best Practices (Relational Tools)

## Overview

This project enforces SQL injection protections for relational tools using:
- strict SQL query validation (`validateSqlString`)
- explicit dangerous-operation blocking (`DROP`, `TRUNCATE`, `ALTER`)
- parameterized query enforcement for mutation statements
- identifier validation utilities for table/column names

Core implementation:
- `packages/tools/src/data/relational/utils/sql-sanitizer.ts`
- integrated in `packages/tools/src/data/relational/query/query-executor.ts`

## Best Practices

1. Always use parameter binding (`?`, `$1`, `:name`) for dynamic values.
2. Never embed untrusted user input directly into SQL text.
3. Block dangerous DDL operations in agent-exposed query paths.
4. Validate all table and column identifiers before query construction.
5. Return sanitized errors to callers; keep sensitive details in logs only.
6. Add regression tests for known injection payload patterns.

## Security Audit Checklist

- [ ] All mutation queries (`INSERT`, `UPDATE`, `DELETE`) require params.
- [ ] Queries with placeholders fail when params are missing.
- [ ] Dangerous operations (`DROP`, `TRUNCATE`, `ALTER`) are blocked.
- [ ] Table names pass identifier validation before use.
- [ ] Column names pass identifier validation before use.
- [ ] OWASP-style injection payload tests are present and passing.
- [ ] Error messages exposed to callers avoid leaking DB internals.
- [ ] Security-focused tests are included in CI test runs.

