---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

When the user names implementation tickets, read `docs/agents/issue-tracker.md`. If the prompt supplies a dispatch claim token, read `docs/agents/ticket-claiming.md`, do not create another claim, and wait until that token satisfies the protocol's dispatched ownership gate before changing files. Otherwise follow the tracker's implementation-ticket claim convention when one is defined; when it points to `docs/agents/ticket-claiming.md`, read and follow that exclusive protocol before changing files. If an ownership gate fails, stop and ask the user rather than taking over the ticket.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.
