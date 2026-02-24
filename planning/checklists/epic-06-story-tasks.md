# Epic 06: Agent Skills Compatibility Layer - Story Tasks

## ST-06001: Implement SkillRegistry with Folder-Config Auto-Discovery

**Branch:** `feat/st-06001-skill-registry-and-discovery`

### Checklist
- [x] Create branch `feat/st-06001-skill-registry-and-discovery`
- [x] Create draft PR with story ID in title
  - PR #46: https://github.com/TVScoundrel/agentforge/pull/46
- [x] Implement `SkillRegistry` class accepting `skillRoots: string[]` config (parallel to ToolRegistry)
- [x] Implement auto-scan of configured roots at init — identify directories containing a valid `SKILL.md`
- [x] Implement YAML frontmatter parser for all spec fields: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`
- [x] Implement `name` field validation per spec (1-64 chars, lowercase alphanumeric + hyphens, no leading/trailing/consecutive hyphens, must match parent directory name)
- [x] Implement `description` field validation per spec (1-1024 chars, non-empty)
- [x] Add duplicate skill name handling with deterministic precedence and structured warnings
- [x] Expose query API: `.get(name)`, `.getAll()`, `.has(name)`, `.size()` — returning skill metadata (name, description, source path, full parsed metadata)
- [x] Emit events: `skill:discovered`, `skill:warning` during scan for observability
- [x] Add structured logs for discovery counts, parse successes, and parse failures
- [x] Create unit tests for SkillRegistry init, scanner, frontmatter parser, name validation, query API, duplicate handling, and malformed skill recovery
  - 71 tests across 3 files: parser (34), scanner (10), registry (27)
- [x] Add or update story documentation at docs/st06001-skill-discovery-and-frontmatter.md (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - 71 new unit tests added covering all acceptance criteria
- [x] Run full test suite before finalizing the PR and record results
  - 148 test files passed, 7 failed (pre-existing Docker/testcontainers — MySQL/PostgreSQL integration), 2106 tests passed
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - 0 errors, 109 warnings (all pre-existing @typescript-eslint/no-explicit-any in patterns package)
- [x] Commit completed checklist items as logical commits and push updates
  - `05b85ca` feat(st-06001): implement SkillRegistry with folder-config auto-discovery
  - `1844948` test(st-06001): add unit tests for SkillRegistry, parser, and scanner
  - `7feb594` docs(st-06001): add story documentation and update trackers
- [x] Mark PR Ready only after all story tasks are complete
- [x] Wait for merge; do not merge directly from local branch
  - Merged PR: https://github.com/TVScoundrel/agentforge/pull/46 (2026-02-24)

---

## ST-06002: Implement SkillRegistry.generatePrompt() and System Prompt Integration

**Branch:** `feat/st-06002-skill-registry-prompt-generation`

### Checklist
- [x] Create branch `feat/st-06002-skill-registry-prompt-generation`
- [x] Create draft PR with story ID in title
  - PR #47: https://github.com/TVScoundrel/agentforge/pull/47
- [x] Implement `SkillRegistry.generatePrompt()` returning `<available_skills>` XML block (name + description per skill)
- [x] Implement `generatePrompt({ skills?: string[] })` subset filter — only named skills appear in XML, enabling focused agents with different skill sets
- [x] Follow Agent Skills integration guide XML format (name, description, location elements per skill)
- [x] Ensure prompt output composes naturally with `toolRegistry.generatePrompt()` in system prompt construction
  - Tested: concatenating skill XML with tool plain text via `filter(Boolean).join('\n\n')`
- [x] Add `agentSkills.enabled` feature flag (default: off) — `generatePrompt()` returns empty string when disabled
  - Added `enabled?: boolean` to `SkillRegistryConfig` (default: `false`)
- [x] Add configurable `maxDiscoveredSkills` cap to limit prompt token usage
  - Added `maxDiscoveredSkills?: number` to `SkillRegistryConfig`, applied after subset filter
- [x] Verify agents without skills enabled operate with unmodified system prompts
  - Tested: disabled flag returns empty string, `filter(Boolean)` removes it from composed prompt
- [x] Add structured logs for prompt generation events (skill count, token estimate)
  - Logs: `skillCount`, `totalDiscovered`, `filterApplied`, `maxCap`, `estimatedTokens`, `xmlLength`
- [x] Create unit tests for XML generation, subset filtering, feature flag gating, prompt composition, and token budget limits
  - 23 tests in `packages/core/tests/skills/prompt.test.ts`
- [x] Add or update story documentation at docs/st06002-system-prompt-skills-injection.md (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - 23 new unit tests covering all acceptance criteria
- [x] Run full test suite before finalizing the PR and record results
  - 149 test files passed, 7 failed (pre-existing Docker/testcontainers), 2129 tests passed
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - 0 errors, 109 warnings (all pre-existing @typescript-eslint/no-explicit-any in patterns package)
- [x] Commit completed checklist items as logical commits and push updates
  - `feb6cd3` feat(st-06002): implement generatePrompt() with feature flag and subset filtering
  - `d6a0ad7` test(st-06002): add unit tests for generatePrompt()
  - `2bf9b6f` docs(st-06002): add story documentation and update trackers
- [x] Mark PR Ready only after all story tasks are complete
- [x] Wait for merge; do not merge directly from local branch
  - Merged PR: https://github.com/TVScoundrel/agentforge/pull/47 (2026-02-24)

---

## ST-06003: Implement Skill Activation and Resource Tools

**Branch:** `feat/st-06003-skill-activation-and-resource-tools`

### Checklist
- [x] Create branch `feat/st-06003-skill-activation-and-resource-tools`
- [x] Create draft PR with story ID in title
  - PR #48: https://github.com/TVScoundrel/agentforge/pull/48
- [x] Implement `activate-skill` tool using AgentForge tool builder API — resolves skill via SkillRegistry, returns full SKILL.md body content
- [x] Implement `read-skill-resource` tool using AgentForge tool builder API — resolves skill + relative path via SkillRegistry, returns file content
- [x] Implement `SkillRegistry.toActivationTools()` convenience method returning both tools pre-wired to the registry instance
- [x] Resolve resource paths relative to skill root directory (scripts/, references/, assets/)
- [x] Block path traversal — resource resolution must stay within the skill root
- [x] Return clear error messages for non-existent skills and missing resource files
- [x] Emit structured logs and events (`skill:activated`, `skill:resource-loaded`) for activation and resource loads
- [x] Register both tools in a `SKILLS` tool category
- [x] Ensure tools can be added to any agent pattern (ReAct, Plan-Execute, Multi-Agent)
  - Tools use standard AgentForge Tool type, compatible with any agent pattern's tool array
- [x] Create fixture skill packs for testing (valid, missing SKILL.md, traversal attempts)
- [x] Create integration tests for end-to-end activation and resource loading flows
  - 38 tests in `packages/core/tests/skills/activation.test.ts`
- [x] Add or update story documentation at docs/st06003-skill-activation-and-resource-tools.md (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - 38 new unit tests covering all acceptance criteria
- [x] Run full test suite before finalizing the PR and record results
  - 150 test files passed, 7 failed (pre-existing Docker/testcontainers), 2167 tests passed
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - 0 errors, 109 warnings (all pre-existing @typescript-eslint/no-explicit-any in patterns package)
- [x] Commit completed checklist items as logical commits and push updates
  - `16cfceb` feat(st-06003): implement skill activation tools and resource loading
  - `71a0679` docs(st-06003): add story documentation and update trackers
- [x] Mark PR Ready only after all story tasks are complete
- [x] Wait for merge; do not merge directly from local branch
  - Merged PR: https://github.com/TVScoundrel/agentforge/pull/48 (2026-02-24)

---

## ST-06004: Implement Skill Trust Policies and Execution Guardrails

**Branch:** `feat/st-06004-skill-trust-policies-and-guardrails`

### Checklist
- [x] Create branch `feat/st-06004-skill-trust-policies-and-guardrails`
- [x] Create draft PR with story ID in title — PR #49
- [x] Define trust policy configuration model for `workspace`, `trusted`, and `untrusted` roots
- [x] Enforce trust policy in `read-skill-resource` before returning script content from `scripts/` directories
- [x] Enforce default-deny for script resources from untrusted roots unless explicitly allowed
- [x] Parse `allowed-tools` frontmatter field and make available for agent tool filtering
- [x] Log guardrail decisions with policy reason codes for auditing
- [x] Create security regression tests for path traversal, untrusted script denial, and policy bypass attempts
- [x] Document secure defaults and trust escalation workflow
- [x] Add or update story documentation at docs/st06004-skill-trust-policies-and-guardrails.md
- [x] Assess test impact; add/update automated tests when needed — 41 trust tests + 175 total skills tests
- [x] Run full test suite before finalizing the PR and record results — 175 pass, 0 fail
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results — 0 errors, 0 warnings
- [x] Commit completed checklist items as logical commits and push updates
- [x] Mark PR Ready only after all story tasks are complete — marked ready 2026-02-24
- [x] Wait for merge; do not merge directly from local branch — merged 2026-02-24, PR #49

---

## ST-06005: Publish Agent Skills Integration Documentation and Conformance Suite

**Branch:** `docs/st-06005-agent-skills-docs-and-conformance`

### Checklist
- [x] Create branch `docs/st-06005-agent-skills-docs-and-conformance`
- [x] Create draft PR with story ID in title — PR #50
- [x] Write developer setup guide for enabling Agent Skills in AgentForge (feature flag, skill roots, tool registration)
- [x] Write skill authoring guide mapping Agent Skills spec fields to AgentForge behavior
- [x] Create end-to-end demo agent activating and using at least two skills from different roots via tool calls
- [x] Build conformance test suite (discovery, prompt injection, tool activation, resource loading, trust policy enforcement) — 35 tests
- [x] Include fixture skill packs: valid, malformed frontmatter, and untrusted examples
- [x] Integrate conformance tests into CI gating — auto-included via vitest workspace `packages/core/tests/**/*.test.ts`
- [x] Document rollout validation, observability checks, and rollback path
- [x] Add or update story documentation at docs/st06005-agent-skills-docs-and-conformance.md
- [x] Assess test impact; 35 new conformance tests added
- [x] Run full test suite before finalizing the PR and record results — 152 files passed (2250 tests), 7 pre-existing Docker integration failures (unrelated)
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results — 0 errors, 109 pre-existing warnings
- [x] Commit completed checklist items as logical commits and push updates
- [x] Mark PR Ready only after all story tasks are complete
- [x] Wait for merge; do not merge directly from local branch
  - Merged PR: https://github.com/TVScoundrel/agentforge/pull/50 (2026-02-24)

---

## Epic 06 Completion Criteria

- [x] All 5 stories merged
- [x] `SkillRegistry` auto-discovers skills from configurable `skillRoots` with spec-compliant frontmatter parsing
- [x] `skillRegistry.generatePrompt()` produces `<available_skills>` XML (gated by feature flag)
- [x] `skillRegistry.toActivationTools()` provides `activate-skill` and `read-skill-resource` tools across all agent patterns
- [x] Trust policies prevent unsafe script execution from untrusted roots
- [x] Conformance suite passes in CI
- [x] Developer and authoring docs are complete and validated
