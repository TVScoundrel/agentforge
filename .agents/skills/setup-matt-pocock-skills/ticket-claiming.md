# Exclusive Ticket Claims

GitHub assignment records ownership but is not an exclusive lock: it allows multiple assignees, and two sessions using the same account are indistinguishable. Use a comment token to elect one claimant before assigning the ticket.

## Claim protocol

1. Read the ticket's state, labels, assignees, blockers, and claim comments. A claimable ticket is open, labelled `ready-for-agent`, unassigned, unblocked, and has no non-released claim.
2. Generate a unique token and post a structured claim comment with that token, `status=active`, `purpose=implementation` or `purpose=dispatch`, and `task=none`.
3. Re-read the comments. The earliest non-released claim wins because GitHub serializes comment creation. A losing claimant changes only its own status to `released`, leaves assignees unchanged, and stops. A `dispatched` claim continues to occupy the ticket.
4. The winner assigns the ticket to the current actor and re-reads the complete claim state. Continue only while the ticket remains open, `ready-for-agent`, unblocked, assigned only to the current actor, and the token remains the winning claim.

Use this marker so claims are discoverable without depending on prose:

```text
<!-- agentforge-ticket-claim:v1 token=<unique-token> status=<active|dispatched|released> purpose=<implementation|dispatch> task=<none|created-task-id> -->
```

A dispatcher changes its winning claim to `dispatched` and replaces `task=none` with the created task identifier immediately after task creation. The created task receives the token in its initial prompt and waits until the matching claim is `dispatched` with a non-`none` task identifier before changing files. It treats that monotonic state as ownership proof and does not rewrite the dispatcher claim during handoff.

If task creation succeeds but publishing `dispatched` fails, refresh and retry that claim edit once. Never create a replacement task. If publication still fails, leave the claim active and assigned, report the task identifier and token as a blocked handoff, and stop; the created task remains waiting. A later run may reconcile only after verifying that exact task, ticket, and token, then publish `dispatched` on the existing claim.

If work cannot start, change the claim to `released`. Remove the assignment only when the current run added it and no other winning claim depends on it. Treat an ambiguous or abandoned claim as requiring user input rather than taking over the ticket.
