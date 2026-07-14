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
- [ ] Wait for merge; do not merge directly from local branch
