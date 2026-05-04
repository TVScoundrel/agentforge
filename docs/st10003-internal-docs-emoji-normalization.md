# ST-10003: Normalize Emoji Usage in Planning and Internal Docs

**Date:** 2026-05-04
**Story:** ST-10003 - Normalize Emoji Usage in Planning and Internal Docs
**Scope:** Planning and internal Markdown files identified by the ST-10001 audit

## Summary

This story removes decorative emoji and emoji-style status markers from planning and internal documentation while preserving the underlying planning semantics.

The cleanup is intentionally limited to markdown presentation. It does not change runtime code, story IDs, acceptance criteria meaning, branch names, or execution workflow conventions.

## Files Targeted

The cleanup follows the ST-10001 planning/internal inventory, including:

- `planning/kanban-queue.md`
- `planning/checklists/epic-01-story-tasks.md`
- `planning/checklists/epic-02-story-tasks.md`
- `planning/checklists/epic-03-story-tasks.md`
- `planning/epics-and-stories.md`
- `planning/PEER_DEPENDENCIES.md`
- internal docs under `docs/`
- internal package notes under `packages/cli/` and `packages/patterns/`
- historical PR body markdown files tracked in the repository

## Normalization Rules Applied

- Decorative heading icons were removed without changing headings beyond the icon removal.
- Completion markers were converted to plain text such as `Complete`, `DONE`, or existing status wording.
- Warning markers were converted to plain text such as `Needs attention` or `Could improve`.
- Negative markers used for anti-patterns or missing capabilities were converted to explicit words such as `Anti-pattern` or `Missing`.
- Deferred markers were converted to `Deferred`.
- Fenced code blocks and literal examples were preserved.

## Test Impact

No automated tests were added because this is a documentation-only presentation cleanup. The implementation does not alter TypeScript source, runtime behavior, package exports, docs tooling, or generated outputs.

## Validation

- `git diff --check`: passed.
- Scoped internal-doc emoji scan: `internal_scope_outside=0`, `internal_scope_fenced=65`.
- `pnpm test --run`: passed, 166 files passed, 2267 tests passed, 286 skipped.
- `pnpm lint`: passed with existing warning baseline and no errors.
