# Epic 07: Extract Skills into Dedicated Package - Story Tasks

## ST-07001: Scaffold `@agentforge/skills` Package

**Branch:** `feat/st-07001-scaffold-skills-package`

### Checklist
- [x] Create branch `feat/st-07001-scaffold-skills-package`
- [x] Create draft PR with story ID in title
  - PR #52: https://github.com/TVScoundrel/agentforge/pull/52
- [x] Create `packages/skills/` directory with `package.json` (name: `@agentforge/skills`, version matching monorepo)
- [x] Set package description to be clear and discoverable while acknowledging AgentForge: e.g. "Composable skill system for building modular AI agents in TypeScript, part of the AgentForge framework"
- [x] Set keywords for independent discoverability: `agent-skills`, `llm-skills`, `composable-agents`, `modular-agents`, `skill-authoring`, `agent-capabilities`, `typescript`
- [x] Add `@agentforge/core` as peer dependency and dev dependency
- [x] Move `gray-matter` dependency from `packages/core/package.json` to `packages/skills/package.json`
  - Added to skills; removal from core deferred to ST-07003 (code still lives in core)
- [x] Add `tsconfig.json` extending `../../tsconfig.base.json`
  - Uses matching conventions (ES2022, Node16) without extending base (consistent with testing package)
- [x] Add `tsup.config.ts` for dual ESM/CJS build output
- [x] Register `packages/skills` in `pnpm-workspace.yaml`
  - Auto-included via `packages/*` glob
- [x] Update `vitest.workspace.ts` to include `packages/skills`
- [x] Create placeholder `src/index.ts` export
- [x] Verify `pnpm install` succeeds with workspace linking
- [x] Verify `pnpm -r build` succeeds including new package
  - Skills outputs: dist/index.js (ESM), dist/index.cjs (CJS), dist/index.d.ts (DTS)
- [x] Add or update story documentation at `docs/st07001-scaffold-skills-package.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - No tests required — scaffold-only, no business logic. Tests migrate in ST-07004.
- [x] Update `docs-site/changelog.md` `[Unreleased]` section with changes from this story (or document why not applicable)
  - Not applicable — scaffold-only, no user-facing changes
- [x] Run full test suite before finalizing the PR and record results
  - 158 passed | 1 skipped | 1 failed (160 files); 2336 passed | 17 skipped | 1 failed (2354 tests)
  - The 1 failure is a **pre-existing flaky timer test** (`packages/tools/tests/web/web-search/utils.test.ts` line 63: expected >=100ms, got 99ms) — unrelated to this change
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - 0 errors, 109 warnings (all pre-existing `@typescript-eslint/no-explicit-any`)
- [x] Mark PR Ready only after all story tasks are complete
- [x] Wait for merge; do not merge directly from local branch
  - Merged PR: https://github.com/TVScoundrel/agentforge/pull/52 (2026-02-25)

---

## ST-07002: Move Skills Source Files and Re-wire Imports

**Branch:** `feat/st-07002-move-skills-source`

### Checklist
- [x] Create branch `feat/st-07002-move-skills-source`
- [x] Create draft PR with story ID in title
  - PR #53: https://github.com/TVScoundrel/agentforge/pull/53
- [x] Move `packages/core/src/skills/*.ts` to `packages/skills/src/` (activation.ts, parser.ts, registry.ts, scanner.ts, trust.ts, types.ts)
  - Core files remain in place; deleted in ST-07003 when deprecation re-exports replace them
- [x] Replace relative imports to core internals with `@agentforge/core` package imports:
  - `../tools/builder.js` → `@agentforge/core` (ToolBuilder)
  - `../tools/types.js` → `@agentforge/core` (ToolCategory, Tool)
  - `../langgraph/observability/logger.js` → `@agentforge/core` (createLogger, LogLevel)
- [x] Verify `ToolCategory.SKILLS` enum value stays in `@agentforge/core` (no move needed)
  - Confirmed — ToolCategory enum stays in core; skills package imports it via `@agentforge/core`
- [x] Update `packages/skills/src/index.ts` barrel exports to match previous public API
- [x] Verify `pnpm -r build` succeeds with clean output
  - All 7 packages build: skills ESM/CJS/DTS all succeed
- [x] Verify TypeScript strict mode passes (`pnpm typecheck`)
  - Skills passes with zero errors; core has 9 pre-existing errors in logging.test.ts (unrelated)
- [x] Add or update story documentation at `docs/st07002-move-skills-source.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - No new tests required — source is copied (not changed), existing tests in core still pass against core's files. Tests migrate to skills package in ST-07004.
- [x] Update `docs-site/changelog.md` `[Unreleased]` section with changes from this story (or document why not applicable)
- [x] Run full test suite before finalizing the PR and record results
  - 159 passed | 1 skipped (160 files); 2337 passed | 17 skipped (2354 tests); 0 failures
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - 0 errors, 109 warnings (all pre-existing `@typescript-eslint/no-explicit-any`)
- [x] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-07003: Add Deprecation Re-exports in Core and Clean Keywords

**Branch:** `feat/st-07003-core-deprecation-shim`

### Checklist
- [ ] Create branch `feat/st-07003-core-deprecation-shim`
- [ ] Create draft PR with story ID in title
- [ ] Replace `packages/core/src/skills/index.ts` with thin re-exports from `@agentforge/skills`
- [ ] Add `@deprecated` JSDoc to every re-exported symbol pointing to `@agentforge/skills`
- [ ] Add `@agentforge/skills` as optional peer dependency of `@agentforge/core`
- [ ] Implement one-time console deprecation warning on first import of the shim
- [ ] Remove `gray-matter` from `packages/core/package.json` dependencies
- [ ] Remove skills-related keywords from core's `package.json` (`agent-skills`, `skill-*` terms)
- [ ] Audit core's description/README — ensure focused on orchestration/runtime, no skills vocabulary
- [ ] Verify core build succeeds and bundle size is smaller
- [ ] Verify IDE shows strikethrough on deprecated imports
- [ ] Add or update story documentation at `docs/st07003-core-deprecation-shim.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Update `docs-site/changelog.md` `[Unreleased]` section with changes from this story (or document why not applicable)
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-07004: Migrate Tests and Fixtures

**Branch:** `feat/st-07004-migrate-skills-tests`

### Checklist
- [ ] Create branch `feat/st-07004-migrate-skills-tests`
- [ ] Create draft PR with story ID in title
- [ ] Move skills unit tests from `packages/core/` to `packages/skills/tests/`
  - parser tests (34), scanner tests (10), registry tests (27), prompt tests (23), activation tests (40), trust tests (41)
- [ ] Move conformance suite (35 tests) to `packages/skills/tests/`
- [ ] Move fixture skill packs to `packages/skills/tests/fixtures/`
- [ ] Update test imports from `@agentforge/core` skills paths to `@agentforge/skills` or relative paths
- [ ] Verify no test files referencing skills remain in `packages/core/tests/`
- [ ] Run `pnpm test --run` — same test count, 0 regressions
- [ ] Verify conformance suite runs within the skills package
- [ ] Add or update story documentation at `docs/st07004-migrate-skills-tests.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Update `docs-site/changelog.md` `[Unreleased]` section with changes from this story (or document why not applicable)
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-07005: Update Documentation and Examples

**Branch:** `feat/st-07005-skills-docs-migration`

### Checklist
- [ ] Create branch `feat/st-07005-skills-docs-migration`
- [ ] Create draft PR with story ID in title
- [ ] Update `docs-site/guide/agent-skills.md` install instructions to `@agentforge/skills`
- [ ] Update `docs-site/guide/agent-skills-authoring.md` import references
- [ ] Update `docs-site/tutorials/skill-powered-agent.md` imports and install steps
- [ ] Update `docs-site/examples/agent-skills.md` code samples to import from `@agentforge/skills`
- [ ] Update `docs-site/api/core.md` — move SkillRegistry API docs to new `api/skills.md` page
- [ ] Add migration note to `docs-site/guide/migration.md` documenting the `@agentforge/core` → `@agentforge/skills` move
- [ ] Update `examples/applications/skill-aware-agent` to depend on `@agentforge/skills`
- [ ] Update root `README.md` package table to include `@agentforge/skills`
- [ ] Draft `docs-site/changelog.md` entry for next release covering the extraction
- [ ] Verify `pnpm --filter docs-site dev` builds without dead-link warnings
- [ ] Add or update story documentation at `docs/st07005-skills-package-docs-migration.md`
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Update `docs-site/changelog.md` `[Unreleased]` section with changes from this story (or document why not applicable)
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-07006: Update Release Scripts and Checklist for Skills Package

**Branch:** `feat/st-07006-release-scripts-skills`

### Checklist
- [ ] Create branch `feat/st-07006-release-scripts-skills`
- [ ] Create draft PR with story ID in title
- [ ] Update `scripts/release.sh` — add `packages/skills/package.json` to `PACKAGE_FILES` array
- [ ] Update `scripts/publish.sh` — add `packages/skills` to `PACKAGES` array (after core, before cli)
- [ ] Update `scripts/convert-workspace-deps.mjs` — add `'skills'` to workspace package name list
- [ ] Update `RELEASE_CHECKLIST.md` — add skills to version bump, publish, and verify sections
- [ ] Update `.ai/RELEASE_PROCESS.md` — add skills to step 1 (version bump), step 8 (publish order), step 9 (verify), quick checklist, task template
- [ ] Verify `./scripts/release.sh` dry-run logic still works (or manually inspect changes)
- [ ] Add or update story documentation (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Update `docs-site/changelog.md` `[Unreleased]` section with changes from this story (or document why not applicable)
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch
