---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

When the user names implementation tickets, read `docs/agents/issue-tracker.md`. If the prompt supplies a dispatch claim token, do not create another claim: wait until that token's claim is `dispatched` with a structured task identifier, then treat it as ownership proof without rewriting it. Otherwise follow the tracker's implementation-ticket claim convention when one is defined; when it points to `docs/agents/ticket-claiming.md`, read and follow that exclusive protocol before changing files. If another claim owns the ticket or the supplied token does not match, stop and ask the user rather than taking over the ticket.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.
