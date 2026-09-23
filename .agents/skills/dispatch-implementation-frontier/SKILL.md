---
name: dispatch-implementation-frontier
description: "Create one real worktree-backed Codex task per unassigned, unblocked implementation ticket and invoke $implement in each."
disable-model-invocation: true
---

# Dispatch Implementation Frontier

Dispatch the current ticket **frontier** into parallel, user-owned Codex tasks.

## 1. Resolve the frontier

Use the implementation tickets created or referenced in the current conversation. Read their current tracker state, labels, assignees, comments, and native parent and dependency relationships. When native dependencies are unavailable, use the repository's documented fallback relationships.

The frontier is every ticket that is:

- open;
- labelled `ready-for-agent`; and
- unassigned; and
- free of an `active` or `dispatched` claim; and
- free of unresolved blockers.

Exclude specification issues and tickets outside the conversation's work. If the source ticket set cannot be identified, ask the user for the source spec or tickets before creating tasks.

This step is complete when every candidate ticket has been accounted for as frontier, reserved, assigned, blocked, closed, or out of scope.

## 2. Resolve the project

Find the saved Codex project whose path matches the current repository. Confirm that it is a Git repository and select a managed worktree environment starting from the project's default branch.

This step is complete when one project is resolved without guessing.

## 3. Create real tasks

For every frontier ticket, create one separate top-level Codex task with the app's task-creation tool. A dispatched ticket is a user-owned task, not a collaboration subagent; the new task may spawn its own subagents.

Immediately before dispatching each ticket, refresh its state, labels, assignees, comments, and blockers. Continue only while every frontier condition still holds.

Read `docs/agents/ticket-claiming.md` and acquire an exclusive claim with purpose `dispatch`. After task creation, mark it `dispatched` and record the created task identifier. If creation fails, release only this run's claim and assignment as that protocol permits.

Give each task its own managed Git worktree. Its initial prompt must:

- explicitly invoke the available `$implement` skill for the derived ticket number;
- pass the winning claim token and require `$implement` to verify it before changing code;
- require reading the ticket, parent spec, comments, repository instructions, domain glossary, and relevant ADRs;
- require delivery through the repository's normal ticket workflow, including the ticket-referencing pull request when repository instructions require one;
- keep blocked follow-up tickets and unrelated changes out of scope; and
- allow subagents when useful.

Do not restate `$implement`'s internal workflow. The invoked skill is the source of truth.

This step is complete when every claimed frontier ticket maps to exactly one created task, every task maps to exactly one ticket, and every creation request specifies a managed worktree.

## 4. Verify and report

Check that each creation request succeeded or is queued for worktree setup. Never pass a queued client task identifier to tools that require a ready task identifier.

Report the one-to-one ticket-to-task mapping and confirm that every task:

- is a real Codex task;
- has a dedicated managed worktree; and
- received an explicit `$implement` invocation.

Emit the app's created-task directive for every ready or queued task so the user can open it.
