# Epic 08: Type Safety Hardening and `no-explicit-any` Debt Burn-Down - Story Tasks

## ST-08001: Establish Explicit `any` Baseline and No-Regression Gate for `src/**`

**Branch:** `fix/st-08001-explicit-any-baseline-gate`

### Checklist
- [x] Create branch `fix/st-08001-explicit-any-baseline-gate`
  - Created as `codex/fix/st-08001-explicit-any-baseline-gate` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #59: https://github.com/TVScoundrel/agentforge/pull/59
- [x] Capture baseline `@typescript-eslint/no-explicit-any` counts for `packages/**/src/**/*.ts` and record package/file hotspots
  - Baseline captured in `scripts/no-explicit-any-baseline.json` and documented in `docs/st08001-explicit-any-baseline-and-gate.md`
  - Total: 496 warnings (`src/**`) | Packages: core 256, tools 82, patterns 82, testing 51, cli 25, skills 0
- [x] Implement a verification command that fails when `src/**` explicit-`any` warnings increase above baseline
  - Added `scripts/check-explicit-any-baseline.mjs`
  - Added npm script: `pnpm lint:explicit-any:baseline`
- [x] Wire the verification command into CI or an existing verification workflow
  - Integrated into root lint flow (`pnpm lint`)
  - Added CI workflow `.github/workflows/type-safety-baseline.yml`
- [x] Document local execution steps and expected pass/fail behavior
  - Documented in `docs/st08001-explicit-any-baseline-and-gate.md` under "Local Verification"
- [x] Add or update story documentation at `docs/st08001-explicit-any-baseline-and-gate.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - No runtime behavior changes; tooling/CI-only story, so no new tests added
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` → 145 passed | 16 skipped (161 files); 2070 passed | 286 skipped (2356 tests)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` → 0 errors, warnings-only baseline output in package lint runs
  - `pnpm lint:explicit-any:baseline` → passed at 496/496 (`src/**`)
- [x] Commit completed checklist items as logical commits and push updates
  - `805b325` fix(st-08001): add explicit-any baseline gate
  - `3753e64` docs(st-08001): document baseline and validation
  - `5954c2c` chore(st-08001): update trackers to in-review
  - Pushed to `origin/codex/fix/st-08001-explicit-any-baseline-gate`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #59 marked ready: https://github.com/TVScoundrel/agentforge/pull/59
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
