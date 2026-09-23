# Exclusive Ticket Claims

GitHub assignment records ownership but is not an exclusive lock: it allows multiple assignees, and two sessions using the same account are indistinguishable. Use a comment token to elect one claimant before assigning the ticket.

## Claim protocol

1. Read the ticket's state, labels, assignees, blockers, and claim comments. A claimable ticket is open, labelled `ready-for-agent`, unassigned, unblocked, and has no non-released claim.
2. Generate a unique token and post a structured claim comment with that token, `status=active`, `purpose=implementation` or `purpose=dispatch`, and `task=none`.
3. Re-read the comments. The earliest non-released claim wins because GitHub serializes comment creation. A losing claimant changes only its own status to `released`, leaves assignees unchanged, and stops. A `dispatched` claim continues to occupy the ticket.
4. The winner assigns the ticket to the current actor and re-reads the complete claim state. Continue only while the ticket remains open, `ready-for-agent`, unblocked, assigned only to the current actor, and the token remains the winning claim.

That final re-read is the **ownership gate**. Refresh it immediately before the winner starts changing files or changes claim state; a losing claimant may release only its own claim as step 3 permits. An active dispatch gate additionally requires the winning claim to remain `status=active purpose=dispatch task=none`. A dispatched ownership gate requires that same winning token to be `status=dispatched purpose=dispatch` with a non-`none` task identifier. A failed gate stops work without rewriting the claim; report it for user recovery.

Use this marker so claims are discoverable without depending on prose:

```text
<!-- agentforge-ticket-claim:v1 token=<unique-token> status=<active|dispatched|released> purpose=<implementation|dispatch> task=<none|created-task-id> -->
```

A dispatcher passes the active dispatch gate after task creation, then changes its winning claim to `dispatched` and replaces `task=none` with the created task identifier. The created task receives the token in its initial prompt and passes the dispatched ownership gate before changing files. It does not rewrite the dispatcher claim during handoff.

If task creation succeeds but publishing `dispatched` reports failure, refresh first. The handoff succeeded if the exact claim already passes the dispatched ownership gate with that task identifier; otherwise retry the edit once only if the active dispatch gate still passes. Never create a replacement task. If neither gate passes or the retry fails, leave the claim unchanged, report the task identifier and token as a blocked handoff, and stop; the created task remains waiting. A later run may publish `dispatched` on the existing claim only after verifying the exact task, ticket, and token and passing the active dispatch gate.

`released` is terminal: never reactivate that claim. Release a winning claim only when its ownership gate still passes and it is certain that no task was created and no file changes began. If task creation may have succeeded, preserve the occupying claim and use the handoff recovery above. Remove the assignment only when the current run added it and no other winning claim depends on it. Treat an ambiguous or abandoned claim as requiring user input rather than taking over the ticket.
