---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

When the user names implementation tickets in the configured tracker, read `docs/agents/ticket-claiming.md` and follow its exclusive claim protocol before changing files. If the prompt supplies a dispatch claim token, wait until its matching claim is `dispatched` with a created task identifier, then treat it as ownership proof without rewriting it. If another claim owns the ticket or the supplied token does not match, stop and ask the user rather than taking over the ticket.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.
