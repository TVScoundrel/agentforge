# Epic 08: Type Safety Hardening and `no-explicit-any` Debt Burn-Down - Story Tasks

## ST-08001: Establish Explicit `any` Baseline and No-Regression Gate for `src/**`

**Branch:** `codex/fix/st-08001-explicit-any-baseline-gate`

### Checklist
- [x] Create branch `codex/fix/st-08001-explicit-any-baseline-gate`
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
  - Added CI-complete lint flow (`pnpm lint:ci`)
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
  - `4a2aa00` chore(st-08001): correct epic story status mapping
  - Pushed to `origin/codex/fix/st-08001-explicit-any-baseline-gate`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #59 marked ready: https://github.com/TVScoundrel/agentforge/pull/59
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #59 on 2026-03-09

---

## ST-08002: Hardening Pass 1 for `@agentforge/core` Runtime Hotspots

**Branch:** `codex/fix/st-08002-core-runtime-type-hardening`

### Checklist
- [x] Create branch `codex/fix/st-08002-core-runtime-type-hardening`
- [x] Create draft PR with story ID in title
  - PR #60: https://github.com/TVScoundrel/agentforge/pull/60
- [x] Replace explicit `any` usage in `packages/core/src/tools/registry.ts` hotspots with `unknown` + narrowing or specific generic constraints
- [x] Replace explicit `any` usage in `packages/core/src/tools/executor.ts` hotspots with stronger domain typing
- [x] Replace explicit `any` usage in `packages/core/src/resources/http-pool.ts` hotspots with safer typed boundaries
- [x] Add focused tests or adapt existing tests to validate behavior remains unchanged in touched areas
  - Added `packages/core/tests/resources/http-pool.test.ts`
  - Ran targeted touched-area tests (`registry`, `executor`, `http-pool`) → 58 passed
- [x] Record before/after warning counts for touched files in PR/story docs
  - Recorded in `docs/st08002-core-runtime-type-hardening.md` (`25/21/18 -> 0/0/0`, core `256 -> 192`)
- [x] Add or update story documentation at `docs/st08002-core-runtime-type-hardening.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused `http-pool` tests and re-ran touched-area validations
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` → 146 passed | 16 skipped (162 files); 2073 passed | 286 skipped (2359 tests)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` → 0 errors (warnings-only across workspace)
- [x] Commit completed checklist items as logical commits and push updates
  - `6a28091` refactor(st-08002): harden core runtime typing hotspots
  - `a7208e2` chore(st-08002): record draft PR creation
  - `3080b0d` docs(st-08002): finalize validation and review status
- [x] Mark PR Ready only after all story tasks are complete
  - PR #60 marked ready: https://github.com/TVScoundrel/agentforge/pull/60
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #60 on 2026-03-10

---

## ST-08003: Hardening Pass 1 for `@agentforge/tools` and `@agentforge/patterns`

**Branch:** `codex/fix/st-08003-tools-patterns-type-hardening`

### Checklist
- [x] Create branch `codex/fix/st-08003-tools-patterns-type-hardening`
  - Created as `codex/fix/st-08003-tools-patterns-type-hardening` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #61: https://github.com/TVScoundrel/agentforge/pull/61
- [x] Reduce explicit `any` usage in top warning files under `packages/tools/src/**`
  - Reduced explicit-`any` usage in `packages/tools/src/data/neo4j/connection.ts` and `packages/tools/src/data/neo4j/utils/result-formatter.ts`; remaining usage is confined to a single suppressed legacy boundary in `connection.ts`
- [x] Reduce explicit `any` usage in top warning files under `packages/patterns/src/**`
  - Eliminated explicit-`any` usage in `packages/patterns/src/multi-agent/agent.ts`, `utils.ts`, and `types.ts`
- [x] Introduce shared helper types where useful to avoid repeated broad casts
  - Added ReAct result-narrowing helpers in `packages/patterns/src/multi-agent/utils.ts`
- [x] Confirm no public API regressions for touched signatures (or explicitly document intentional changes)
  - Public signatures remain compatible; intentional bug fix documented: `wrapReActAgent` error path now honors configured `verbose` logging
- [x] Add focused tests or adapt existing tests for behavior-sensitive changes
  - `pnpm test --run packages/patterns/tests/multi-agent/agent.test.ts packages/patterns/tests/multi-agent/utils.test.ts packages/tools/tests/data/neo4j.test.ts` -> 20 passed, 13 skipped
- [x] Record before/after warning counts for touched files in PR/story docs
  - Recorded in `docs/st08003-tools-patterns-type-hardening.md` (`164 -> 120`, delta `-44`)
- [x] Add or update story documentation at `docs/st08003-tools-patterns-type-hardening.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Existing tests cover touched multi-agent/neo4j behavior; focused suite re-run and passing
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `146 passed | 16 skipped` files; `2074 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - Commits on branch: `21d51bd`, `3dc27f9` (plus checklist/tracker sync in finalization commit)
- [x] Mark PR Ready only after all story tasks are complete
  - PR #61 marked ready: https://github.com/TVScoundrel/agentforge/pull/61
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #61 on 2026-03-11

---

## ST-08004: Test/Example Typing Policy and Targeted Cleanup

**Branch:** `chore/st-08004-test-example-typing-policy`

### Checklist
- [x] Create branch `chore/st-08004-test-example-typing-policy`
  - Created as `codex/chore/st-08004-test-example-typing-policy` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #62: https://github.com/TVScoundrel/agentforge/pull/62
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
