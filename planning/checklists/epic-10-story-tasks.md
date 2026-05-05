# Epic 10: Documentation Only Changes - Story Tasks

## ST-10001: Audit Markdown Emoji Usage Across Project-Owned Docs

**Branch:** `docs/st-10001-markdown-emoji-audit`

### Checklist
- [x] Create branch `docs/st-10001-markdown-emoji-audit`
- [x] Create draft PR with story ID in title
- [x] Inventory project-owned `.md` files with decorative emoji usage and group them by scope (public docs, package READMEs, planning/internal docs, examples/templates)
- [x] Distinguish decorative emoji from meaningful non-emoji symbols or literal sample output that should be preserved
- [x] Document the prioritized cleanup sequence for follow-on stories
- [x] Add or update story documentation at `docs/st10001-markdown-emoji-audit.md` (or document why not required).
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required.
- [x] Run full test suite before finalizing the PR and record results.
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results.
- [x] Commit completed checklist items as logical commits and push updates.
- [x] Mark PR Ready only after all story tasks are complete.
- [x] Wait for merge; do not merge directly from local branch.

---

## ST-10002: Normalize Emoji Usage in Public-Facing Docs

**Branch:** `docs/st-10002-public-docs-emoji-normalization`

### Checklist
- [x] Create branch `docs/st-10002-public-docs-emoji-normalization`
- [x] Create draft PR with story ID in title
- [x] Remove decorative emoji from targeted public-facing docs such as the root README, package READMEs, and selected docs-site pages identified by the audit
- [x] Preserve wording and structure except where readability cleanup is required after emoji removal
- [x] Preserve meaningful non-emoji Unicode and literal sample output unless explicitly documented otherwise
- [x] Add or update story documentation at `docs/st10002-public-docs-emoji-normalization.md` (or document why not required).
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required.
- [x] Run full test suite before finalizing the PR and record results.
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results.
- [x] Commit completed checklist items as logical commits and push updates.
- [x] Mark PR Ready only after all story tasks are complete.
- [x] Wait for merge; do not merge directly from local branch.

---

## ST-10003: Normalize Emoji Usage in Planning and Internal Docs

**Branch:** `docs/st-10003-internal-docs-emoji-normalization`

### Checklist
- [x] Create branch `docs/st-10003-internal-docs-emoji-normalization`
- [x] Create draft PR with story ID in title
- [x] Remove decorative emoji from targeted planning docs, feature plans, checklists, and internal markdown identified by the audit
- [x] Replace emoji status markers with plain-text wording where needed while preserving planning semantics
- [x] Keep the cleanup scoped to markdown presentation rather than content redesign
- [x] Add or update story documentation at `docs/st10003-internal-docs-emoji-normalization.md` (or document why not required).
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required.
- [x] Run full test suite before finalizing the PR and record results. (`pnpm test --run` passed: 166 files, 2267 tests, 286 skipped)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results. (passed with existing warning baseline and no errors)
- [x] Commit completed checklist items as logical commits and push updates.
- [x] Mark PR Ready only after all story tasks are complete.
- [ ] Wait for merge; do not merge directly from local branch.

---

## ST-10004: Normalize Emoji Usage in Examples and Template Docs

**Branch:** `docs/st-10004-example-template-docs-emoji-normalization`

### Checklist
- [x] Create branch `docs/st-10004-example-template-docs-emoji-normalization`
- [x] Create draft PR with story ID in title
- [x] Remove decorative emoji from targeted example READMEs, template docs, and similar supporting markdown identified by the audit
- [x] Preserve literal demo output where emoji are part of the documented runtime behavior and intentionally meant to remain
- [x] Keep example code, commands, and setup flow unchanged aside from markdown presentation cleanup
- [x] Add or update story documentation at `docs/st10004-example-template-docs-emoji-normalization.md` (or document why not required).
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required.
- [x] Run full test suite before finalizing the PR and record results. (`pnpm test --run` passed: 166 files, 2267 tests, 286 skipped)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results. (passed with existing warning baseline and no errors)
- [x] Commit completed checklist items as logical commits and push updates.
- [x] Mark PR Ready only after all story tasks are complete.
- [ ] Wait for merge; do not merge directly from local branch.

---

## ST-10005: Add Documentation Style Guardrails for Emoji Usage

**Branch:** `docs/st-10005-docs-style-guardrails`

### Checklist
- [x] Create branch `docs/st-10005-docs-style-guardrails`
- [ ] Create draft PR with story ID in title
- [x] Add contributor-facing or internal style guidance for decorative emoji usage in project-owned markdown
- [x] Distinguish disallowed decorative emoji from acceptable literal sample output and meaningful symbols
- [x] Reference EP-10 as the evergreen lane for future docs-only cleanup stories
- [x] Add or update story documentation at `docs/st10005-docs-style-guardrails.md` (or document why not required).
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required.
- [x] Run full test suite before finalizing the PR and record results.
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results.
- [ ] Commit completed checklist items as logical commits and push updates.
- [ ] Mark PR Ready only after all story tasks are complete.
- [ ] Wait for merge; do not merge directly from local branch.

### Notes

- Documentation guidance was added to `docs-site/contributing.md` rather than a new standalone policy file so contributors have one authoritative markdown/process guide.
- Test-first rationale:
  - No failing automated test was practical because this story changes contributor guidance only and does not modify runtime code or docs tooling behavior.
- Validation:
  - `pnpm test --run` -> `167` files passed, `16` skipped; `2272` tests passed, `286` skipped
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
