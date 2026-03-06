# Epic 08: Type Safety Hardening and `no-explicit-any` Debt Burn-Down - Story Tasks

## ST-08001: Establish Explicit `any` Baseline and No-Regression Gate for `src/**`

**Branch:** `fix/st-08001-explicit-any-baseline-gate`

### Checklist
- [ ] Create branch `fix/st-08001-explicit-any-baseline-gate`
- [ ] Create draft PR with story ID in title
- [ ] Capture baseline `@typescript-eslint/no-explicit-any` counts for `packages/**/src/**/*.ts` and record package/file hotspots
- [ ] Implement a verification command that fails when `src/**` explicit-`any` warnings increase above baseline
- [ ] Wire the verification command into CI or an existing verification workflow
- [ ] Document local execution steps and expected pass/fail behavior
- [ ] Add or update story documentation at `docs/st08001-explicit-any-baseline-and-gate.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-08002: Hardening Pass 1 for `@agentforge/core` Runtime Hotspots

**Branch:** `fix/st-08002-core-runtime-type-hardening`

### Checklist
- [ ] Create branch `fix/st-08002-core-runtime-type-hardening`
- [ ] Create draft PR with story ID in title
- [ ] Replace explicit `any` usage in `packages/core/src/tools/registry.ts` hotspots with `unknown` + narrowing or specific generic constraints
- [ ] Replace explicit `any` usage in `packages/core/src/tools/executor.ts` hotspots with stronger domain typing
- [ ] Replace explicit `any` usage in `packages/core/src/resources/http-pool.ts` hotspots with safer typed boundaries
- [ ] Add focused tests or adapt existing tests to validate behavior remains unchanged in touched areas
- [ ] Record before/after warning counts for touched files in PR/story docs
- [ ] Add or update story documentation at `docs/st08002-core-runtime-type-hardening.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-08003: Hardening Pass 1 for `@agentforge/tools` and `@agentforge/patterns`

**Branch:** `fix/st-08003-tools-patterns-type-hardening`

### Checklist
- [ ] Create branch `fix/st-08003-tools-patterns-type-hardening`
- [ ] Create draft PR with story ID in title
- [ ] Reduce explicit `any` usage in top warning files under `packages/tools/src/**`
- [ ] Reduce explicit `any` usage in top warning files under `packages/patterns/src/**`
- [ ] Introduce shared helper types where useful to avoid repeated broad casts
- [ ] Confirm no public API regressions for touched signatures (or explicitly document intentional changes)
- [ ] Add focused tests or adapt existing tests for behavior-sensitive changes
- [ ] Record before/after warning counts for touched files in PR/story docs
- [ ] Add or update story documentation at `docs/st08003-tools-patterns-type-hardening.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-08004: Test/Example Typing Policy and Targeted Cleanup

**Branch:** `chore/st-08004-test-example-typing-policy`

### Checklist
- [ ] Create branch `chore/st-08004-test-example-typing-policy`
- [ ] Create draft PR with story ID in title
- [ ] Define and document policy for acceptable `any` usage in tests/examples vs required `unknown`/specific typing
- [ ] Update ESLint configuration/scoping if needed so policy is explicit and enforceable
- [ ] Remove low-effort explicit-`any` warnings in tests/examples while preserving readability
- [ ] Capture lint output deltas and rationale for any remaining intentional `any` usage
- [ ] Add or update story documentation at `docs/st08004-test-example-typing-policy.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch
