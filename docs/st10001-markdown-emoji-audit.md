# ST-10001: Markdown Emoji Usage Audit

**Date:** 2026-05-03  
**Scope:** Project-owned Markdown files discovered by `rg --files -g '*.md'`  
**Story:** ST-10001 - Audit Markdown Emoji Usage Across Project-Owned Docs

## Summary

- Scanned 246 Markdown files.
- Found emoji-range characters in 120 files.
- Found 1605 total emoji-range characters: 1294 outside fenced code blocks and 311 inside fenced code blocks.
- `README.md` was scanned and has no emoji-range matches after the earlier README cleanup.
- This audit does not change runtime code or normalize existing documentation content. It only records the cleanup inventory and recommended sequencing.

## Classification Rules

- **Decorative cleanup candidate:** Emoji used in headings, feature bullets, status lists, badges, callouts, or prose where plain text would carry the same meaning.
- **Status marker cleanup candidate:** Check/cross/warning-style markers used as visual status shorthand in Markdown tables or planning prose. These should be normalized to plain text when doing docs cleanup.
- **Preserve by default:** Emoji-range characters inside fenced code blocks, literal sample output, prompt fixtures, or examples where the character is part of demonstrated runtime behavior.
- **Preserve non-emoji symbols by default:** Text symbols such as ASCII punctuation, arrows, and plain check/cross symbols should only be changed when they are being used as decorative Markdown status markers.

## Scope Totals

| Scope | Files with matches | Prose/status count | Fenced-code count | Total |
| --- | ---: | ---: | ---: | ---: |
| Public docs | 43 | 297 | 183 | 480 |
| Package docs | 19 | 291 | 48 | 339 |
| Planning/internal | 33 | 502 | 66 | 568 |
| Examples/templates | 25 | 204 | 14 | 218 |

## Recommended Cleanup Sequence

1. **ST-10002 - Public-facing docs and package docs:** Start with `docs-site/**` and package documentation/READMEs because these are user-facing and have the broadest presentation impact. Preserve fenced code snippets and literal API examples.
2. **ST-10003 - Planning and internal docs:** Normalize planning queues, checklists, story docs, roadmap/status documents, and temporary PR body files. Replace emoji status shorthand with plain-text status wording.
3. **ST-10004 - Examples and templates:** Normalize example READMEs and template docs while preserving prompt fixtures, sample output, and code snippets where emoji-like characters are part of the demonstrated behavior.
4. **ST-10005 - Documentation style guardrails:** Add contributor-facing guidance after the initial cleanup slices so the rules reflect the real preservation cases found in this audit.

## Inventory

### Public docs

| File | Prose/status count | Fenced-code count | Recommendation |
| --- | ---: | ---: | --- |
| `docs-site/guide/concepts/patterns.md` | 40 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs-site/guide/advanced/vertical-agents.md` | 16 | 22 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/guide/what-is-agentforge.md` | 31 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs-site/guide/concepts/tools.md` | 22 | 8 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/changelog.md` | 22 | 2 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/DOCUMENTATION_ROADMAP.md` | 21 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs-site/guide/migration.md` | 12 | 7 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/examples/plan-execute.md` | 5 | 12 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/guide/concepts/memory.md` | 11 | 6 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/examples/custom-tools.md` | 10 | 6 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/guide/concepts/middleware.md` | 10 | 6 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/guide/concepts/state.md` | 0 | 16 | Preserve as literal code or sample output unless the owning story changes that example. |
| `docs-site/examples/agent-skills.md` | 9 | 6 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/examples/react-agent.md` | 6 | 8 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/index.md` | 14 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs-site/tutorials/skill-powered-agent.md` | 6 | 8 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/guide/quick-start.md` | 1 | 10 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/examples/reflection.md` | 4 | 6 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/tutorials/first-agent.md` | 0 | 10 | Preserve as literal code or sample output unless the owning story changes that example. |
| `docs-site/guide/advanced/tool-deduplication.md` | 9 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs-site/guide/getting-started.md` | 9 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs-site/tutorials/neo4j-graphrag.md` | 0 | 7 | Preserve as literal code or sample output unless the owning story changes that example. |
| `docs-site/api/skills.md` | 6 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs-site/api/tools.md` | 5 | 1 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/examples/middleware.md` | 0 | 6 | Preserve as literal code or sample output unless the owning story changes that example. |
| `docs-site/examples/multi-agent.md` | 5 | 1 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/guide/advanced/streaming.md` | 0 | 6 | Preserve as literal code or sample output unless the owning story changes that example. |
| `docs-site/guide/patterns/multi-agent.md` | 2 | 4 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/tutorials/testing.md` | 0 | 6 | Preserve as literal code or sample output unless the owning story changes that example. |
| `docs-site/api/core.md` | 4 | 1 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/guide/advanced/resources.md` | 0 | 5 | Preserve as literal code or sample output unless the owning story changes that example. |
| `docs-site/guide/advanced/debugging.md` | 4 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs-site/guide/advanced/human-in-the-loop.md` | 2 | 2 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/guide/patterns/plan-execute.md` | 2 | 2 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs-site/tutorials/custom-tools.md` | 4 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs-site/guide/advanced/monitoring.md` | 0 | 2 | Preserve as literal code or sample output unless the owning story changes that example. |
| `docs-site/guide/concepts/database.md` | 0 | 2 | Preserve as literal code or sample output unless the owning story changes that example. |
| `docs-site/guide/patterns/react.md` | 2 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs-site/guide/patterns/reflection.md` | 2 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs-site/tutorials/advanced-patterns.md` | 0 | 2 | Preserve as literal code or sample output unless the owning story changes that example. |
| `docs-site/tutorials/production-deployment.md` | 0 | 2 | Preserve as literal code or sample output unless the owning story changes that example. |
| `docs-site/contributing.md` | 1 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs-site/guide/installation.md` | 0 | 1 | Preserve as literal code or sample output unless the owning story changes that example. |

### Package docs

| File | Prose/status count | Fenced-code count | Recommendation |
| --- | ---: | ---: | --- |
| `packages/patterns/docs/pattern-comparison.md` | 76 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/tools/README.md` | 44 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/tools/docs/NEO4J_IMPLEMENTATION_SUMMARY.md` | 20 | 19 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `packages/patterns/docs/react-pattern.md` | 20 | 5 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `packages/patterns/docs/plan-execute-pattern.md` | 20 | 4 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `packages/patterns/README.md` | 22 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/cli/README.md` | 18 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/testing/README.md` | 17 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/patterns/docs/multi-agent-pattern.md` | 9 | 4 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `packages/tools/src/web/web-search/TESTING.md` | 12 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/core/docs/LANGCHAIN_INTEGRATION.md` | 10 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/core/README.md` | 10 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/patterns/docs/reflection-pattern.md` | 6 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/core/docs/LANGCHAIN_COMPATIBILITY.md` | 0 | 5 | Preserve as literal code or sample output unless the owning story changes that example. |
| `packages/patterns/docs/plan-execute-quick-reference.md` | 0 | 5 | Preserve as literal code or sample output unless the owning story changes that example. |
| `packages/patterns/docs/README.md` | 5 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/tools/docs/NEO4J.md` | 1 | 4 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `packages/core/docs/LANGGRAPH_INTEGRATION.md` | 0 | 2 | Preserve as literal code or sample output unless the owning story changes that example. |
| `packages/skills/README.md` | 1 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |

### Planning/internal

| File | Prose/status count | Fenced-code count | Recommendation |
| --- | ---: | ---: | --- |
| `docs/ROADMAP.md` | 127 | 2 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `packages/cli/CLI_TESTS_SUMMARY.md` | 48 | 18 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `packages/cli/tests/README.md` | 58 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `planning/kanban-queue.md` | 57 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/NESTED_GRAPH_INTERRUPT_FIX.md` | 19 | 30 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `planning/checklists/epic-02-story-tasks.md` | 45 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `planning/checklists/epic-03-story-tasks.md` | 27 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/FRAMEWORK_DESIGN.md` | 16 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/patterns/MIGRATION_STATUS.md` | 13 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/LOGGING_STANDARDS.md` | 4 | 8 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `docs/CODEBASE_LEARNING_GUIDE.md` | 9 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/MONOREPO_SETUP.md` | 9 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st02001-raw-sql-query-tool.md` | 9 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/patterns/FIXES_APPLIED.md` | 7 | 2 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `.pr-body-st-03001.md` | 8 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st01002-connection-manager.md` | 7 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/patterns/src/multi-agent/PHASE_3_4_1_SUMMARY.md` | 1 | 6 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `planning/checklists/epic-01-story-tasks.md` | 7 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st01001-setup-drizzle-dependencies.md` | 5 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `planning/PEER_DEPENDENCIES.md` | 5 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st01004-connection-lifecycle.md` | 3 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st02002-type-safe-select-tool.md` | 3 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st02003-type-safe-insert-tool.md` | 2 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st02004-type-safe-update-tool.md` | 2 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st05003-usage-examples-documentation.md` | 2 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `planning/epics-and-stories.md` | 2 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `.pr-body-st-02006.md` | 1 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st02005-type-safe-delete-tool.md` | 1 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st02006-sql-sanitization-security.md` | 1 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st03001-schema-introspection-tool.md` | 1 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st04001-transaction-support.md` | 1 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st04002-batch-operations.md` | 1 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `docs/st04003-result-streaming.md` | 1 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |

### Examples/templates

| File | Prose/status count | Fenced-code count | Recommendation |
| --- | ---: | ---: | --- |
| `packages/cli/templates/README.md` | 36 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `examples/README.md` | 19 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `templates/README.md` | 18 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/tools/examples/relational/09-performance-guide.md` | 8 | 6 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `examples/vertical-agents/README.md` | 13 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/tools/examples/relational/01-transactions.md` | 12 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `examples/applications/customer-support/README.md` | 7 | 1 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `examples/integrations/express-api/README.md` | 8 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `examples/applications/code-reviewer/README.md` | 7 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `examples/integrations/nextjs-app/README.md` | 7 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `examples/vertical-agents/code-review/README.md` | 7 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `examples/vertical-agents/customer-support/README.md` | 7 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `examples/vertical-agents/data-analyst/README.md` | 7 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/cli/templates/api/README.md` | 7 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/cli/templates/cli/README.md` | 7 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/cli/templates/full/README.md` | 7 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `examples/applications/data-analyst/README.md` | 6 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/cli/templates/reusable-agent/README.md` | 6 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `examples/applications/customer-support/APPROVAL_WORKFLOW.md` | 4 | 1 | Clean prose/status markers; preserve fenced code and literal sample output. |
| `examples/applications/research-assistant/README.md` | 5 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `examples/vertical-agents/code-review/prompts/system.md` | 4 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/patterns/examples/multi-agent/README.md` | 2 | 0 | Clean decorative headings, bullets, badges, or status markers in the assigned follow-on story. |
| `packages/tools/examples/relational/06-error-handling.md` | 0 | 2 | Preserve as literal code or sample output unless the owning story changes that example. |
| `packages/tools/examples/relational/07-connection-pooling.md` | 0 | 2 | Preserve as literal code or sample output unless the owning story changes that example. |
| `packages/tools/examples/relational/08-schema-introspection.md` | 0 | 2 | Preserve as literal code or sample output unless the owning story changes that example. |

## Test Impact

No automated tests are required for this audit story because it only adds documentation and planning metadata. Follow-on cleanup stories should run docs-site or package-specific checks only if they alter docs tooling, generated examples, or link structure.

## Validation

- `pnpm test --run` passed on 2026-05-03: 164 test files passed, 2257 tests passed, 286 tests skipped.
- `pnpm lint` passed on 2026-05-03 with warnings only from existing TypeScript lint debt; this story did not touch runtime TypeScript sources.
