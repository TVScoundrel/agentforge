---
name: dispatch-implementation-frontier
description: "Create one real worktree-backed Codex task per unassigned, unblocked GitHub implementation ticket, link it to the repository-local skills, and invoke $implement."
disable-model-invocation: true
---

# Dispatch Implementation Frontier

Dispatch the current ticket **frontier** into parallel, user-owned Codex tasks.

This is a single-maintainer workflow: run one dispatcher at a time. Each created task claims its ticket through `$implement`.

## 1. Resolve the frontier

Use the implementation tickets created or referenced in the current conversation. Read their current tracker state, labels, assignees, and native parent and dependency relationships. When native dependencies are unavailable, use the repository's documented fallback relationships.

The frontier is every ticket that is:

- open;
- labelled `ready-for-agent`; and
- unassigned; and
- free of unresolved blockers.

Exclude specification issues and tickets outside the conversation's work. If the source ticket set cannot be identified, ask the user for the source spec or tickets before creating tasks.

This step is complete when every candidate ticket has been accounted for as frontier, assigned, blocked, closed, or out of scope.

## 2. Resolve the project

Find the saved Codex project whose path matches the current repository. Confirm that it is a Git repository and select a managed worktree environment starting from the project's default branch. Record the canonical project checkout's absolute `.agents` path as the read-only source of repository-local skills.

This step is complete when one project and one readable `.agents/skills/implement/SKILL.md` source file are resolved without guessing.

## 3. Create real tasks

For every frontier ticket, create one separate top-level Codex task with the app's task-creation tool. A dispatched ticket is a user-owned task, not a collaboration subagent; the new task may spawn its own subagents.

Immediately before dispatching each ticket, refresh its state, labels, assignees, and blockers. Create the task only while every frontier condition still holds.

Give each task its own managed Git worktree. Its initial prompt must:

- explicitly invoke `$implement` for the derived ticket number by loading and following the canonical checkout's absolute `.agents/skills/implement/SKILL.md` path;
- resolve every repository-local skill it invokes from the same absolute `.agents/skills/<name>/SKILL.md` tree and resolve each skill's relative references from that skill's directory;
- use the canonical `.agents` tree as a read-only skill library and write ticket changes only in the task worktree;
- require reading the ticket, parent spec, comments, repository instructions, domain glossary, and relevant ADRs;
- require delivery through the repository's normal ticket workflow, including the ticket-referencing pull request when repository instructions require one;
- keep blocked follow-up tickets and unrelated changes out of scope; and
- allow subagents when useful.

Treat an unreadable or missing skill source as a blocker: the task reports the failure without claiming or implementing the ticket.

Do not restate `$implement`'s internal workflow. The invoked skill is the source of truth.

If task creation fails or may have succeeded, report the outcome and do not retry it in the same run.

This step is complete when every frontier ticket maps to one creation request and every creation request specifies a managed worktree.

## 4. Verify and report

Check that each creation request succeeded or is queued for worktree setup. Never pass a queued client task identifier to tools that require a ready task identifier.

Report the one-to-one ticket-to-task mapping and confirm that every task:

- is a real Codex task;
- has a dedicated managed worktree; and
- received the absolute read-only skill source and an explicit `$implement` invocation.

Emit the app's created-task directive for every ready or queued task so the user can open it.
