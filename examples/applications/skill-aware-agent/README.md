# Skill-Aware Agent Demo

Demonstrates an AgentForge agent that discovers, activates, and uses skills from two different roots with different trust levels.

## What This Demo Shows

1. **Skill discovery** — `SkillRegistry` scans two skill roots at startup
2. **Prompt injection** — `<available_skills>` XML is added to the system prompt
3. **Skill activation** — Agent calls `activate-skill` to load skill instructions
4. **Resource loading** — Agent calls `read-skill-resource` to load reference docs
5. **Trust enforcement** — Scripts from untrusted roots are blocked
6. **Mixed trust levels** — Workspace skills have full access, community skills are restricted

## Skill Roots

- `skills/workspace/` — Trusted workspace skills (code-review, test-generator)
- `skills/community/` — Untrusted community skills (community-tool)

## Running

```bash
# From the repo root (after installing workspace dependencies)
pnpm install
pnpm tsx examples/applications/skill-aware-agent/src/index.ts
```

## Expected Output

The demo runs without an actual LLM call — it demonstrates the framework integration by:
1. Creating a `SkillRegistry` with two roots at different trust levels
2. Generating the `<available_skills>` system prompt
3. Creating activation tools
4. Simulating skill activation and resource loading
5. Demonstrating trust policy enforcement (script blocked from untrusted root)
