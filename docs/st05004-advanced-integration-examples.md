# ST-05004: Advanced Integration Examples

## Story

**Epic:** 05 — Documentation, Examples, and Testing  
**Story ID:** ST-05004  
**Branch:** `docs/st-05004-advanced-integration-examples`  
**PR:** [#44](https://github.com/TVScoundrel/agentforge/pull/44)

## Summary

Create advanced integration examples demonstrating real-world usage patterns for the relational database tools. These go beyond the basic quick-start examples from ST-05003 and cover production concerns like transactions, batch operations, streaming, multi-agent architectures, error handling, connection pooling, and schema introspection.

## Deliverables

All files created in `packages/tools/examples/relational/`:

| File | Topic |
|---|---|
| `README.md` | Index and prerequisites |
| `01-transactions.md` | `withTransaction`, isolation levels, timeouts, savepoints |
| `02-batch-insert.md` | Large dataset ingestion, batch sizing by vendor, retries |
| `03-batch-update.md` | Bulk modifications, optimistic locking, soft deletes |
| `04-result-streaming.md` | LIMIT/OFFSET streaming, `maxRows`, AsyncGenerator, AbortController |
| `05-multi-agent.md` | Shared database across agents with role-based tool assignment |
| `06-error-handling.md` | Connection retries, SQL validation, constraint violations, batch errors |
| `07-connection-pooling.md` | Pool config, vendor defaults, workload tuning, metrics, lifecycle |
| `08-schema-introspection.md` | Runtime discovery, caching, dynamic queries, schema diffing |
| `09-performance-guide.md` | Consolidated tuning reference for all tools |

## Design Decisions

1. **Markdown over executable scripts** — Examples are documentation-first. They include complete TypeScript snippets but are meant to be read and adapted, not executed as-is. This matches the pattern established in ST-05003.

2. **Numbered file prefix** — Files are numbered (`01-` through `09-`) to provide a natural reading order from basic → advanced concepts.

3. **Consistent structure** — Every guide follows the same format:
   - Logger note linking to LOGGING_STANDARDS.md
   - Concept explanation
   - Working TypeScript code blocks
   - Vendor-specific comparison tables
   - Best practices section

4. **Cross-referencing** — The performance guide (`09-performance-guide.md`) consolidates recommendations scattered across other guides into a single reference. Individual guides remain self-contained.

5. **Multi-agent example** — Demonstrates the framework's differentiating capability: multiple specialized agents sharing a database with different permission levels via tool subset assignment.

## Test Impact

This is a documentation-only story. No production code was modified.

- No new tests required
- No existing tests affected
- All code examples verified for API consistency against source implementations

## Dependencies

- **ST-05003** (Usage examples and documentation) — Provides the basic README and quick-start that these advanced examples build upon.
- **ST-01001–ST-04003** (All implementation stories) — The tools demonstrated in these examples.
