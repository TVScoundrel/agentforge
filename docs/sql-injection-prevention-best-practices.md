# SQL Injection Prevention Best Practices (Relational Tools)

## Overview

This project enforces SQL injection protections for relational tools using:
- strict SQL query validation (`validateSqlString`)
- explicit dangerous-operation blocking (`CREATE`, `DROP`, `TRUNCATE`, `ALTER`)
- parameterized query enforcement for mutation statements
- keyword scanning that ignores SQL comments and string literals

Core implementation:
- `packages/tools/src/data/relational/utils/sql-sanitizer.ts`
- integrated in `packages/tools/src/data/relational/query/query-executor.ts`

## Best Practices

1. Always use parameter binding (`?`, `$1`, `:name`) for dynamic values.
2. Never embed untrusted user input directly into SQL text.
3. Block dangerous DDL operations in agent-exposed query paths.
4. Return sanitized errors to callers; keep sensitive details in logs only.
5. Add regression tests for known injection payload patterns.

## Security Audit Checklist

- [ ] All mutation queries (`INSERT`, `UPDATE`, `DELETE`) require params.
- [ ] Queries with placeholders fail when params are missing.
- [ ] Dangerous operations (`CREATE`, `DROP`, `TRUNCATE`, `ALTER`) are blocked.
- [ ] OWASP-style injection payload tests are present and passing.
- [ ] Error messages exposed to callers avoid leaking DB internals.
- [ ] Security-focused tests are included in CI test runs.
