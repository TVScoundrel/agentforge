# Feature Plan: Agent Skills Compatibility for AgentForge

**Epic Range:** EP-06 through EP-06
**Status:** Planned
**Last Updated:** 2026-02-23
**Active Story:** ST-06001 (Ready)
**Specification:** https://agentskills.io/specification

---

## Feature Overview

**Objective:** Enable AgentForge agents to discover, activate, and use reusable skills compatible with the Agent Skills specification (https://agentskills.io). Skills are markdown-based instruction packs that agents load on demand via tool calls.

**Target Users:**
- AgentForge framework maintainers implementing runtime capabilities
- Agent developers who want reusable, composable skill instructions
- Teams managing internal skill libraries with trust and governance controls

**Desired Outcomes:**
- AgentForge discovers local skill packs from standard directories at startup
- Skill metadata (name + description) is injected into the agent system prompt as `<available_skills>` XML
- Agents activate skills on demand via tool calls (`activate-skill`, `read-skill-resource`)
- The LLM decides which skills to activate — no framework-level AI matching
- Full skill content and referenced resources are loaded progressively (metadata first, full body on activation, sub-resources on demand)
- Trust policies control script execution and resource access per skill root
- Developers can validate skill packs using conformance tests

**Business Value:**
- Reduces duplicated prompt engineering across agents
- Enables portable skill reuse across projects and teams
- Aligns with the Agent Skills open standard (adopted by GitHub Copilot, Cursor, Claude Code, Gemini CLI, and others)
- Improves safety posture with policy-driven skill activation

---

## Integration Approach

The Agent Skills spec defines two integration approaches:
1. **Filesystem-based agents** — agents with shell access load skills via `cat SKILL.md`
2. **Tool-based agents** — agents without shell access use tools to trigger skill loading

AgentForge agents are **tool-based**. We implement skill activation as AgentForge tools built with the standard tool builder API.

### Design Parallel: ToolRegistry → SkillRegistry

AgentForge already has `ToolRegistry` — register tools programmatically, query by category/tag, and call `registry.generatePrompt()` to produce an LLM-ready tool description block. Skills follow the same pattern but with **folder-based auto-discovery** instead of programmatic registration:

| Aspect | ToolRegistry | SkillRegistry |
|--------|-------------|---------------|
| Registration | Programmatic: `registry.register(tool)` | Auto-discovery: configure `skillRoots: string[]` |
| Storage | `Map<string, Tool>` | `Map<string, Skill>` (from scanned SKILL.md files) |
| Query API | `.get()`, `.getAll()`, `.getByCategory()`, `.search()` | `.get(name)`, `.getAll()`, `.has(name)`, `.size()` |
| Prompt generation | `registry.generatePrompt()` → tool descriptions | `skillRegistry.generatePrompt()` → `<available_skills>` XML |
| Events | `tool:registered`, `tool:removed` | `skill:discovered`, `skill:activated` |
| Integration | `registry.toLangChainTools()` | Tools: `activate-skill`, `read-skill-resource` |

### Developer Experience

```typescript
import { SkillRegistry } from '@agentforge/core';
import { createReActAgent } from '@agentforge/patterns';

// 1. Create registry with folder config — auto-discovers skills
const skillRegistry = new SkillRegistry({
  skillRoots: ['.agentskills', '~/.agentskills', './project-skills'],
});

// 2. Generate <available_skills> XML for system prompt
const skillsPrompt = skillRegistry.generatePrompt();

// 3. Build agent with skill-awareness
const agent = createReActAgent({
  model: llm,
  tools: [
    ...toolRegistry.toLangChainTools(),
    ...skillRegistry.toActivationTools(),  // activate-skill + read-skill-resource
  ],
  systemPrompt: `You are a helpful assistant.

${toolRegistry.generatePrompt({ groupByCategory: true })}

${skillsPrompt}`,
});
```

### Runtime Flow

```
Startup:
  1. new SkillRegistry({ skillRoots }) → scan folders → parse SKILL.md frontmatter
  2. skillRegistry.generatePrompt() → <available_skills> XML
  3. XML injected into agent system prompt (~50-100 tokens per skill)

Runtime (agent decides):
  4. Agent reads task → sees relevant skill in <available_skills>
  5. Agent calls activate-skill("skill-name") tool
     → SkillRegistry resolves skill → returns full SKILL.md body
  6. Agent optionally calls read-skill-resource("skill-name", "references/GUIDE.md")
     → SkillRegistry resolves path within skill root → returns file content
  7. Agent follows skill instructions using its existing tools
```

### Progressive Disclosure (per spec)

| Phase | Content | Token budget |
|-------|---------|-------------|
| Discovery | name + description per skill | ~50-100 per skill |
| Activation | Full SKILL.md body | < 5000 recommended |
| Resources | scripts/, references/, assets/ files | On demand |

---

## Scope

### In Scope
- `SkillRegistry` class with folder-config-based auto-discovery (parallel to `ToolRegistry`)
- Configurable `skillRoots: string[]` for runtime skill discovery
- Parsing and validation of `SKILL.md` frontmatter per spec (name, description, license, compatibility, metadata, allowed-tools)
- `skillRegistry.generatePrompt()` → `<available_skills>` XML for system prompt injection
- `activate-skill` tool backed by SkillRegistry for loading full skill instructions on demand
- `read-skill-resource` tool backed by SkillRegistry for loading referenced files (scripts/, references/, assets/)
- Trust policy enforcement for skill resource and script access
- Path traversal protection for all resource resolution
- Feature flag (`agentSkills.enabled`) for progressive rollout
- Documentation, demos, and conformance tests

### Out of Scope
- Remote skill marketplace integration
- Automatic install or download from third-party skill registries
- Non-markdown skill package formats
- Framework-level AI matching/ranking (the LLM decides which skills to activate)
- Programmatic skill registration (skills are discovered from folders, not registered in code)
- Full cross-framework runtime parity beyond AgentForge integration requirements

---

## Story Coverage by Epic

- EP-06: ST-06001, ST-06002, ST-06003, ST-06004, ST-06005

---

## Validation and Rollout Expectations

- Unit tests: frontmatter parser, directory scanner, XML generation, tool schemas, trust policy decisions, path resolution
- Integration tests: end-to-end activation with fixture skill packs (valid + malformed + untrusted)
- Demo path: one sample agent run activating and using two skills from different roots
- Observability: structured logs for discovery counts, activation events, resource loads, and policy denials
- Rollout/rollback control: `agentSkills.enabled` feature flag with default-off rollout and immediate disable path
- Spec conformance: validate fixture skills against `skills-ref validate`

---

## Related Planning Documents

- `planning/epics-and-stories.md` (EP-06 and ST-06001 through ST-06005)
- `planning/kanban-queue.md`
- `planning/checklists/epic-06-story-tasks.md`
- Agent Skills specification: https://agentskills.io/specification
- Integration guide: https://agentskills.io/integrate-skills
