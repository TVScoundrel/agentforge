---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

When the user names implementation tickets in the configured tracker, fetch each ticket and its comments, then inspect its current assignees. Claim every unassigned ticket as the session's first external write before changing files. Continue when the ticket is already assigned to the current actor. If another actor owns it, stop and ask the user rather than taking over the ticket.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.
