# ST-06005: Publish Agent Skills Integration Documentation and Conformance Suite

**Epic:** EP-06 — Agent Skills Integration  
**PR:** [#50](https://github.com/TVScoundrel/agentforge/pull/50)  
**Branch:** `docs/st-06005-agent-skills-docs-and-conformance`

## Summary

Final story in EP-06 — publishes developer-facing documentation, a conformance test suite, fixture skill packs, an end-to-end demo agent, and rollout guidance for the Agent Skills integration.

## Deliverables

### Documentation (docs-site/guide/)
- **agent-skills.md** — Developer setup guide: quick start, configuration reference, trust levels, runtime flow, activation tools, events, security, feature flag, and rollout checklist
- **agent-skills-authoring.md** — Skill authoring guide: directory structure, SKILL.md format, spec-to-AgentForge field mapping, validation rules, trust policies, progressive disclosure, troubleshooting

### Conformance Test Suite
- **packages/core/tests/skills/conformance.test.ts** — 35 tests covering the full pipeline using static fixture skill packs: discovery, prompt generation, tool activation, resource loading, trust policy enforcement, allowed tools, and full end-to-end pipeline

### Fixture Skill Packs (packages/core/tests/skills/fixtures/)
- `valid/code-review/` — Full skill with references + scripts
- `valid/test-generator/` — Full skill with references
- `malformed/bad-frontmatter/` — Invalid name + empty description
- `malformed/name-mismatch/` — Name doesn't match directory
- `malformed/no-frontmatter/` — Missing YAML frontmatter
- `untrusted/community-tool/` — Skill with trust-gated scripts

### E2E Demo Agent (examples/applications/skill-aware-agent/)
- Complete working demo: SkillRegistry with workspace + community roots, prompt generation, activation tools, resource loading, trust policy enforcement

### Rollout Guidance
- Feature-flag enablement steps
- Event-based observability subscriptions with monitoring table
- 4-level rollback procedure

## Design Decisions

1. **Static fixtures over temp dirs** — The conformance suite uses committed fixture skill packs rather than test-time temp fixtures. This catches regressions in fixture quality and validates the framework against real-world skill structures.

2. **Rollout in developer guide** — The rollout checklist is co-located with the developer guide rather than a separate doc, keeping the operational guidance alongside the integration instructions.

3. **CI integration via vitest workspace** — No CI config changes needed; the conformance tests are automatically picked up by the existing `packages/core/tests/**/*.test.ts` include pattern in `vitest.workspace.ts`.
