---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

When the user names implementation tickets, read `docs/agents/issue-tracker.md` and follow its claim convention before changing files. For GitHub, continue only while the ticket is open, `ready-for-agent`, unblocked, and assigned only to the current actor; assign an unassigned ticket to that actor and then re-read those conditions. If another actor owns it, stop and ask the user rather than taking over the ticket. This is single-maintainer coordination, not a distributed lock.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.
