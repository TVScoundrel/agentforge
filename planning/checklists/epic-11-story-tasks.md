# Epic 11: Security Boundary Hardening - Story Tasks

## ST-11001: Publish Repository Security Boundary Policy

**Branch:** `docs/st-11001-repository-security-boundary-policy`

### Checklist
- [x] Create branch `docs/st-11001-repository-security-boundary-policy`
  - Created on 2026-07-14 from `main`.
- [x] Create draft PR with story ID in title
  - Draft PR #158 created on 2026-07-14: <https://github.com/TVScoundrel/agentforge/pull/158>
- [x] Define test strategy before implementation: identify whether this policy/docs hardening story has a practical failing automated test seam or should rely on documented rationale plus validation commands
  - Strategy: this is a repository-policy and docs-routing story with no practical red-test seam, so record the rationale up front and rely on targeted diff review plus the repo's standard full-suite and lint gates.
- [x] Write or update the failing automated test before production changes when practical; if not practical, record why before implementation
  - No practical failing automated test exists because the story changes policy text and security-routing guidance rather than runtime behavior or a tested docs-build transform.
- [x] Add a top-level `SECURITY.md` that documents supported versions, reporting guidance, and the repository trust boundaries for tools, skills, examples, and downstream host applications
  - Existing tracked `SECURITY.md` already satisfied this baseline on `main` from commit `b7f53f02` (`docs(ep-11): add security policy and hardening backlog`); this story keeps that file as the canonical policy baseline.
- [x] Explicitly distinguish privileged-by-design surfaces from framework guarantees intended to be safe for model-controlled input
  - Confirmed in `SECURITY.md` under `Privileged-by-Design Surfaces` and `Framework Guardrails Expected by Default`.
- [x] Cross-link security-relevant docs to the new policy where that guidance materially affects safe adoption
  - Added links from `README.md`, `docs-site/contributing.md`, `docs-site/guide/concepts/tools.md`, `docs-site/guide/agent-skills.md`, and `docs-site/guide/agent-skills-authoring.md`.
- [x] Include maintainer guidance for classifying example-only issues, untrusted skill roots, and model-exposed tool execution
  - Confirmed in `SECURITY.md` under `Framework Packages vs Example Applications`, `Out of Scope`, and `Disclosure Expectations`.
- [x] Add/update production docs until focused validation passes, keeping evidence in checklist notes and PR body
  - Updated the maintainer/adopter docs above to route security-sensitive usage to the repository policy before exposing privileged surfaces to model-controlled input.
- [x] Add or update story documentation at `docs/st11001-repository-security-boundary-policy.md` (or document why not required)
  - Added `docs/st11001-repository-security-boundary-policy.md`.
- [x] Assess residual test impact; add/update additional automated tests when needed, or document why no further tests are required
  - No additional automated tests are required because the story does not alter runtime behavior; the residual validation need is covered by full-suite and lint verification.
- [x] Assess CI impact; update CI or document why no CI change is required
  - No CI change is required because the story changes policy/docs only and does not introduce a new validation contract beyond the existing repo-wide test and lint commands.
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `224` passed, `9` skipped files; `2498` passed, `110` skipped tests.
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> passed with the existing warning baseline only (`0` errors).
- [x] Commit completed checklist items as logical commits and push updates
  - `91933602` `docs(st-11001): publish security policy guidance` pushed to `origin/docs/st-11001-repository-security-boundary-policy`; tracker and ready-state sync are captured in the current review-prep follow-up commit.
- [x] Mark PR Ready only after all story tasks are complete
  - PR #158 marked ready for review on 2026-07-14 after docs updates, story documentation, validation, PR body verification, and tracker sync were complete.
- [x] Wait for merge; do not merge directly from local branch
  - PR #158 merged into `main` on 2026-07-15 as commit `20246a4b`; post-merge tracker sync and queue grooming completed from local `main`.

## ST-11004: Separate Worker Output from Supervisor Routing Input

**Branch:** `feat/st-11004-worker-routing-boundary`

### Checklist
- [x] Create branch `feat/st-11004-worker-routing-boundary`
  - Created on 2026-07-16 from `main` after moving `ST-11004` to `In Progress` in `planning/kanban-queue.md`.
- [x] Create draft PR with story ID in title
  - Draft PR #159 created on 2026-07-16: <https://github.com/TVScoundrel/agentforge/pull/159>
- [x] Define test strategy before implementation: identify the practical failing automated test seam for worker-output prompt injection and supervisor-routing boundary separation
  - Strategy: use focused red/green routing regressions around `packages/patterns/src/multi-agent/routing-internal/llm-routing.ts` and `packages/patterns/src/multi-agent/nodes/supervisor.ts` because this story changes framework routing behavior with a practical unit-test seam.
- [x] Write or update the failing automated test before production changes when practical; if not practical, record why before implementation
  - Added injection-focused regressions in `packages/patterns/tests/multi-agent/routing-llm.test.ts` and `packages/patterns/tests/multi-agent/nodes/supervisor-routing.ts`, then captured the expected red failure from `pnpm --filter @agentforge/patterns test --run packages/patterns/tests/multi-agent/routing-llm.test.ts packages/patterns/tests/multi-agent/nodes/supervisor-routing.ts` because the supervisor prompt still used injected worker-result text as `Current task`.
- [x] Identify the current supervisor-routing prompt path that reuses worker output and document the intended boundary/transform seam
  - Confirmed the vulnerable path in `packages/patterns/src/multi-agent/routing-internal/llm-routing.ts` and `packages/patterns/src/multi-agent/nodes/shared.ts`, where the latest message content was reused directly; the replacement seam now anchors to trusted `supervisorTask` intent and reintroduces worker results only through labeled untrusted-context formatting.
- [x] Update the multi-agent state model so worker-result context remains available without reusing raw worker free-form output as direct supervisor routing input
  - Added optional `supervisorTask` state support in `packages/patterns/src/multi-agent/state.ts` and taught shared helpers to preserve trusted task intent separately from `completedTasks`.
- [x] Harden supervisor routing prompt construction so worker output is treated as untrusted context instead of authoritative routing instructions
  - Updated `packages/patterns/src/multi-agent/routing-internal/llm-routing.ts` plus assignment-task generation in `packages/patterns/src/multi-agent/nodes/shared.ts` so worker results are appended only as explicitly labeled untrusted context.
- [x] Add focused regression tests covering prompt-injection-style worker output that attempts to rewrite routing instructions or escalate authority
  - Added focused regressions for injected worker-result text in `packages/patterns/tests/multi-agent/routing-llm.test.ts` and `packages/patterns/tests/multi-agent/nodes/supervisor-routing.ts`; follow-up validation also passed in `packages/patterns/tests/multi-agent/nodes.test.ts`, `packages/patterns/tests/multi-agent/agent-system.test.ts`, and `packages/patterns/tests/multi-agent/state.test.ts`.
- [x] Document compatibility impact for downstream applications that currently rely on raw worker-message routing behavior
  - Added compatibility notes to `packages/patterns/docs/multi-agent-pattern.md`, `packages/patterns/examples/multi-agent/README.md`, and `docs/st11004-multi-agent-routing-boundary-separation.md`.
- [x] Add or update story documentation at `docs/st11004-multi-agent-routing-boundary-separation.md` (or document why not required)
  - Added `docs/st11004-multi-agent-routing-boundary-separation.md`.
- [x] Assess residual test impact; add/update additional automated tests when needed, or document why no further tests are required
  - Added the focused routing and supervisor regressions plus adjacent multi-agent suite coverage; no further automated tests are currently required beyond the pending repo-wide validation/lint gates before PR readiness.
- [x] Assess CI impact; update CI or document why no CI change is required
  - No CI change is required because the hardening fits the existing patterns-package and repo-wide validation commands without introducing a new automation contract.
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `224` passed, `9` skipped files; `2500` passed, `110` skipped tests.
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> passed with the existing warning baseline only (`0` errors); package lint output still includes the known repo warning baseline and existing ESLint flat-config env warnings in legacy example files.
- [x] Commit completed checklist items as logical commits and push updates
  - `a826743e` `fix(st-11004): separate supervisor task intent` pushed to `origin/feat/st-11004-worker-routing-boundary`; final review-prep tracker sync is captured in the current follow-up commit.
- [x] Mark PR Ready only after all story tasks are complete
  - PR #159 marked ready for review on 2026-07-16 after the focused regressions, repo-wide `pnpm test --run`, `pnpm lint`, checklist sync, and PR body verification all completed successfully.
- [x] Wait for merge; do not merge directly from local branch
  - PR #159 merged into `main` on 2026-07-16 as commit `7aaeb92e`; post-merge tracker sync, done-story archival, and ready-lane grooming were completed from local `main`.
