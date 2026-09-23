# Exclusive Ticket Claims

GitHub assignment records ownership but is not an exclusive lock: it allows multiple assignees, and two sessions using the same account are indistinguishable. Use a comment token to elect one claimant before assigning the ticket.

## Claim protocol

1. Read the ticket's state, labels, assignees, blockers, and claim comments. A claimable ticket is open, labelled `ready-for-agent`, unassigned, unblocked, and has no `active` or `dispatched` claim.
2. Generate a unique token and post a structured claim comment with that token, `status=active`, and `purpose=implementation` or `purpose=dispatch`.
3. Re-read the comments. The earliest active claim wins because GitHub serializes comment creation. A losing claimant changes only its own status to `released`, leaves assignees unchanged, and stops.
4. The winner assigns the ticket to the current actor and re-reads the complete claim state. Continue only while the ticket remains open, `ready-for-agent`, unblocked, assigned only to the current actor, and the token remains the winning claim.

Use this marker so claims are discoverable without depending on prose:

```text
<!-- agentforge-ticket-claim:v1 token=<unique-token> status=<active|dispatched|released> purpose=<implementation|dispatch> -->
```

A dispatcher changes its winning claim to `dispatched` and records the created task identifier after task creation. The implementation task receives that token, verifies it, and changes the claim purpose to `implementation` before editing files.

If work cannot start, change the claim to `released`. Remove the assignment only when the current run added it and no other winning claim depends on it. Treat an ambiguous or abandoned claim as requiring user input rather than taking over the ticket.
