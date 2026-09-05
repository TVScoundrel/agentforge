---
name: dependency-grooming
description: Reconcile open dependent GitHub issue bodies after a ticket closes. Use after closing an issue, or when a ticket's Dependencies, Current blockers, and native GitHub dependency edges may be stale.
---

# Dependency Grooming

Close a ticket and synchronize its dependents with the live GitHub dependency graph. The command is idempotent: rerunning it against an already-closed ticket performs only the grooming verification and any missing body normalization.

## Invocation

Use `close ticket #<number>` when the user wants the ticket closed and its dependents groomed. Use `groom ticket #<number>` when the ticket is already closed and only dependent cleanup is requested.

## Workflow

1. Resolve the issue and repository from the current task. If no issue number is supplied, stop and ask for it.
2. Read the issue state before writing. For `close ticket`, close it only when it is open; if it is already closed, record a no-op and continue. For `groom ticket`, require the issue to be closed.
3. Discover open dependents using native GitHub dependency data first. Search open issue bodies for references to the closed issue as a fallback, because older tickets may not have native edges.
4. Read every candidate dependent body before editing it. Preserve its parent, scope, acceptance criteria, and non-dependency sections.
5. Normalize each dependency section to this structure, replacing the existing dependency section rather than appending another:

   ```markdown
   ## Dependencies

   - #123 — completed prerequisite.
   - #124 — open blocker.
   - #125 — reference only.

   ## Current blockers

   - #124 — <title>
   ```

   Use `None — can start immediately` when no unfinished blocker remains. Keep a closed prerequisite under `Dependencies` only when it explains the ticket's context; remove it from `Current blockers`.
6. Verify the native graph: a closed issue must not remain an open `blocked_by` edge. If native dependencies are unavailable, ensure `Current blockers` contains only open issues.
7. Re-read every edited issue and report the issue numbers changed, the remaining blockers, and any dependent whose body or graph could not be reconciled.

## Guardrails

- Only the explicitly requested ticket may be closed; never close, reopen, relabel, or assign dependent issues.
- Do not rewrite acceptance criteria or implementation scope while grooming dependencies.
- Treat native dependency edges as the live gate; body text is explanatory context that must be kept synchronized.
- Never leave a completed issue under a `Blocked by` heading.
- A second run must be a no-op when state and dependency sections are already correct: no duplicate headings, bullets, comments, or lifecycle changes.

## Completion criteria

The skill is complete only when the target issue is confirmed closed and every open dependent discovered for it has either been normalized and re-read, or is listed with an exact blocker explaining why it could not be updated.
