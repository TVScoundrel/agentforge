---
name: finish-ticket
description: Finish a ticket after its pull request has merged by fast-forwarding main, grooming dependent issues, and removing the completed worktree.
---

# Finish Ticket

Complete the post-merge lifecycle for the ticket implemented by the current task. Treat `$finish-ticket` as authorization to update the local main checkout, groom that ticket's dependencies, and remove its clean feature worktree. A supplied ticket number is an optional override, not a required argument.

1. Resolve the ticket from the current task's context and delivery artifacts: prefer its attached pull request and referenced GitHub issue, then the feature branch and commit history. Also resolve the merged pull request, feature branch, feature worktree, repository default branch, and the checkout holding that default branch. Ask for a ticket number only when those sources identify no ticket or conflicting tickets. If the pull request is not merged, stop without changing the ticket, main, or worktree.
2. Inspect the feature worktree before making changes. Require every tracked and untracked change to be accounted for. A dirty worktree is a blocker: preserve it and report the exact files.
3. Fetch the remote default branch. In its existing checkout, fast-forward the local branch to its remote-tracking branch with `--ff-only`; never synthesize a merge commit or discard local commits. Verify both refs point to the same commit. If no checkout holds the default branch, or it cannot fast-forward, preserve the feature worktree and report the blocker.
4. Apply `$dependency-grooming` to the ticket. Use `groom ticket #<number>` when it is closed and `close ticket #<number>` when it remains open after the merge. This step is complete only when that skill's completion criteria are satisfied.
5. Move all operations to the default-branch checkout, then remove the feature worktree through Git using its explicit absolute path. Remove only the worktree belonging to the merged pull request; preserve the feature branch unless the user separately asks to delete it. Prune stale worktree metadata and verify the removed path no longer appears in `git worktree list`.

Report the merged pull request, ticket, updated default-branch commit, dependency-grooming changes and remaining blockers, removed worktree path, and preserved feature branch. The skill is complete only when the pull request is confirmed merged, local main matches remote main, dependency grooming is complete, and the worktree is absent.
