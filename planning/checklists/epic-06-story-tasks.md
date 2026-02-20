# Epic 06: Agent Skills Compatibility Layer - Story Tasks

## ST-06001: Implement Skill Discovery and Metadata Registry

**Branch:** `feat/st-06001-skill-discovery-and-registry`

### Checklist
- [ ] Create branch `feat/st-06001-skill-discovery-and-registry`
- [ ] Create draft PR with story ID in title
- [ ] Define skill root configuration contract (`.agents/skills`, `$HOME/.agents/skills`, runtime-configured roots)
- [ ] Implement skill directory scanner for valid `SKILL.md` entries
- [ ] Implement metadata parser for skill name/description and optional frontmatter fields
- [ ] Add duplicate skill ID handling with deterministic precedence and warnings
- [ ] Expose registry API that returns discovered skill metadata and source paths
- [ ] Add structured logs/metrics for discovery counts and parse failures
- [ ] Create unit tests for scanner/parser/duplicate handling/error scenarios
- [ ] Add or update story documentation at docs/st06001-skill-discovery-and-registry.md (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-06002: Implement Skill Matching and Activation Planning

**Branch:** `feat/st-06002-skill-matching-and-activation-planning`

### Checklist
- [ ] Create branch `feat/st-06002-skill-matching-and-activation-planning`
- [ ] Create draft PR with story ID in title
- [ ] Define matching input contract (task text, runtime context, available skill metadata)
- [ ] Implement deterministic ranking/selection with configurable `maxSelectedSkills`
- [ ] Add tie-break strategy and deterministic ordering guarantees
- [ ] Generate planner output including selected skill IDs and rationale
- [ ] Add explicit no-skill-selected behavior path
- [ ] Emit observability events for selection decisions
- [ ] Create unit tests for ranking quality, deterministic outputs, and no-match scenarios
- [ ] Add or update story documentation at docs/st06002-skill-matching-and-activation-planning.md (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-06003: Implement Progressive Skill Loading and Resource Resolution

**Branch:** `feat/st-06003-progressive-skill-loading`

### Checklist
- [ ] Create branch `feat/st-06003-progressive-skill-loading`
- [ ] Create draft PR with story ID in title
- [ ] Implement activation-time loading for selected skill `SKILL.md` files
- [ ] Implement safe resolution for `scripts/`, `references/`, and `assets/` relative paths
- [ ] Add progressive disclosure guard so only needed referenced resources are loaded
- [ ] Add context budget limits for loaded skill content per run
- [ ] Implement graceful handling for missing/broken relative references
- [ ] Add integration fixtures representing valid and invalid skill pack structures
- [ ] Create integration tests for activation/loading/path resolution flows
- [ ] Add or update story documentation at docs/st06003-progressive-skill-loading.md (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-06004: Implement Skill Trust Policies and Execution Guardrails

**Branch:** `feat/st-06004-skill-trust-policies-and-guardrails`

### Checklist
- [ ] Create branch `feat/st-06004-skill-trust-policies-and-guardrails`
- [ ] Create draft PR with story ID in title
- [ ] Define trust policy configuration model for `workspace`, `trusted`, and `untrusted` roots
- [ ] Enforce default-deny execution policy for untrusted skill scripts
- [ ] Enforce root-bound path access and block traversal attempts
- [ ] Implement policy reason codes and security/audit logging
- [ ] Add feature flag for progressive rollout (`agentSkills.enabled`)
- [ ] Create security regression tests for traversal, unsafe script execution, and policy bypass attempts
- [ ] Document secure defaults and trust escalation workflow
- [ ] Add or update story documentation at docs/st06004-skill-trust-policies-and-guardrails.md (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-06005: Publish Agent Skills Integration Documentation and Conformance Suite

**Branch:** `docs/st-06005-agent-skills-integration-docs-and-conformance`

### Checklist
- [ ] Create branch `docs/st-06005-agent-skills-integration-docs-and-conformance`
- [ ] Create draft PR with story ID in title
- [ ] Write developer setup guide for enabling Agent Skills in AgentForge
- [ ] Write skill authoring guide with Agent Skills spec compatibility notes
- [ ] Create end-to-end demo agent using at least two skills from different roots
- [ ] Build conformance test suite (discovery, matching, progressive loading, trust policy enforcement)
- [ ] Integrate conformance tests into CI gating
- [ ] Document rollout validation, observability checks, and rollback path
- [ ] Add or update story documentation at docs/st06005-agent-skills-integration-docs-and-conformance.md (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## Epic 06 Completion Criteria

- [ ] All 5 stories merged
- [ ] Agent skills can be discovered and selected deterministically
- [ ] Progressive loading works with guarded resource resolution
- [ ] Trust policies prevent unsafe skill execution
- [ ] Conformance suite passes in CI
- [ ] Developer and authoring docs are complete and validated
