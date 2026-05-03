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
- [ ] Wait for merge; do not merge directly from local branch.

---

## ST-10002: Normalize Emoji Usage in Public-Facing Docs

**Branch:** `docs/st-10002-public-docs-emoji-normalization`

### Checklist
- [ ] Create branch `docs/st-10002-public-docs-emoji-normalization`
- [ ] Create draft PR with story ID in title
- [ ] Remove decorative emoji from targeted public-facing docs such as the root README, package READMEs, and selected docs-site pages identified by the audit
- [ ] Preserve wording and structure except where readability cleanup is required after emoji removal
- [ ] Preserve meaningful non-emoji Unicode and literal sample output unless explicitly documented otherwise
- [ ] Add or update story documentation at `docs/st10002-public-docs-emoji-normalization.md` (or document why not required).
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required.
- [ ] Run full test suite before finalizing the PR and record results.
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results.
- [ ] Commit completed checklist items as logical commits and push updates.
- [ ] Mark PR Ready only after all story tasks are complete.
- [ ] Wait for merge; do not merge directly from local branch.

---

## ST-10003: Normalize Emoji Usage in Planning and Internal Docs

**Branch:** `docs/st-10003-internal-docs-emoji-normalization`

### Checklist
- [ ] Create branch `docs/st-10003-internal-docs-emoji-normalization`
- [ ] Create draft PR with story ID in title
- [ ] Remove decorative emoji from targeted planning docs, feature plans, checklists, and internal markdown identified by the audit
- [ ] Replace emoji status markers with plain-text wording where needed while preserving planning semantics
- [ ] Keep the cleanup scoped to markdown presentation rather than content redesign
- [ ] Add or update story documentation at `docs/st10003-internal-docs-emoji-normalization.md` (or document why not required).
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required.
- [ ] Run full test suite before finalizing the PR and record results.
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results.
- [ ] Commit completed checklist items as logical commits and push updates.
- [ ] Mark PR Ready only after all story tasks are complete.
- [ ] Wait for merge; do not merge directly from local branch.

---

## ST-10004: Normalize Emoji Usage in Examples and Template Docs

**Branch:** `docs/st-10004-example-template-docs-emoji-normalization`

### Checklist
- [ ] Create branch `docs/st-10004-example-template-docs-emoji-normalization`
- [ ] Create draft PR with story ID in title
- [ ] Remove decorative emoji from targeted example READMEs, template docs, and similar supporting markdown identified by the audit
- [ ] Preserve literal demo output where emoji are part of the documented runtime behavior and intentionally meant to remain
- [ ] Keep example code, commands, and setup flow unchanged aside from markdown presentation cleanup
- [ ] Add or update story documentation at `docs/st10004-example-template-docs-emoji-normalization.md` (or document why not required).
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required.
- [ ] Run full test suite before finalizing the PR and record results.
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results.
- [ ] Commit completed checklist items as logical commits and push updates.
- [ ] Mark PR Ready only after all story tasks are complete.
- [ ] Wait for merge; do not merge directly from local branch.

---

## ST-10005: Add Documentation Style Guardrails for Emoji Usage

**Branch:** `docs/st-10005-docs-style-guardrails`

### Checklist
- [ ] Create branch `docs/st-10005-docs-style-guardrails`
- [ ] Create draft PR with story ID in title
- [ ] Add contributor-facing or internal style guidance for decorative emoji usage in project-owned markdown
- [ ] Distinguish disallowed decorative emoji from acceptable literal sample output and meaningful symbols
- [ ] Reference EP-10 as the evergreen lane for future docs-only cleanup stories
- [ ] Add or update story documentation at `docs/st10005-docs-style-guardrails.md` (or document why not required).
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required.
- [ ] Run full test suite before finalizing the PR and record results.
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results.
- [ ] Commit completed checklist items as logical commits and push updates.
- [ ] Mark PR Ready only after all story tasks are complete.
- [ ] Wait for merge; do not merge directly from local branch.
