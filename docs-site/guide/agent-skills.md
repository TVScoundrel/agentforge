---
outline: deep
---

# Agent Skills Integration

AgentForge supports the [Agent Skills specification](https://agentskills.io/specification), enabling agents to discover, activate, and use reusable skill instruction packs at runtime.

## Overview

Agent Skills are markdown-based instruction packs that agents load on demand via tool calls. Each skill is a directory containing a `SKILL.md` file with frontmatter metadata and instructional content.

```
.agentskills/
├── code-review/
│   ├── SKILL.md
│   ├── references/
│   │   └── style-guide.md
│   └── scripts/
│       └── setup-linter.sh
└── test-generator/
    ├── SKILL.md
    └── references/
        └── patterns.md
```

## Quick Start

### 1. Create a Skill Registry

```typescript
import { SkillRegistry } from '@agentforge/core';

const skillRegistry = new SkillRegistry({
  enabled: true,
  skillRoots: [
    { path: '.agentskills', trust: 'workspace' },
  ],
});
```

### 2. Generate System Prompt

```typescript
const skillsPrompt = skillRegistry.generatePrompt();
// Returns <available_skills> XML block with skill names + descriptions
```

### 3. Register Activation Tools

```typescript
const [activateSkill, readSkillResource] = skillRegistry.toActivationTools();
```

### 4. Wire Into Your Agent

```typescript
import { createReActAgent } from '@agentforge/patterns';

const agent = createReActAgent({
  model: llm,
  tools: [...yourTools, activateSkill, readSkillResource],
  systemPrompt: `You are a helpful assistant.\n\n${skillsPrompt}`,
});
```

## Configuration

### `SkillRegistryConfig`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Feature flag — `generatePrompt()` returns `''` when disabled |
| `skillRoots` | `Array<string \| SkillRootConfig>` | `[]` | Directories to scan for skills |
| `maxDiscoveredSkills` | `number` | `undefined` | Cap on skills included in prompt |
| `allowUntrustedScripts` | `boolean` | `false` | Allow script resources from untrusted roots |

### Skill Root Trust Levels

Each skill root can be assigned a trust level that controls access to `scripts/` resources:

```typescript
const registry = new SkillRegistry({
  enabled: true,
  skillRoots: [
    { path: '.agentskills', trust: 'workspace' },   // Full trust — scripts allowed
    { path: '/org/shared', trust: 'trusted' },       // Verified — scripts allowed
    '/community/skills',                              // Untrusted (default) — scripts denied
  ],
});
```

| Trust Level | Script Access | Use Case |
|-------------|--------------|----------|
| `workspace` | Allowed | Project-local skills |
| `trusted` | Allowed | Verified shared skill repositories |
| `untrusted` | **Denied** | Community or unknown skill sources |

::: tip
Plain string roots default to `'untrusted'` for security. Promote roots to `'trusted'` or `'workspace'` only after reviewing their contents.
:::

## Runtime Flow

```
Startup:
  1. new SkillRegistry({ skillRoots }) → scans folders → parses SKILL.md frontmatter
  2. skillRegistry.generatePrompt() → <available_skills> XML
  3. XML injected into agent system prompt (~50-100 tokens per skill)

Runtime (agent decides):
  4. Agent reads task → sees relevant skill in prompt
  5. Agent calls activate-skill("skill-name")
     → Returns full SKILL.md body content
  6. Agent optionally calls read-skill-resource("skill-name", "references/guide.md")
     → Returns referenced file content
  7. Agent follows skill instructions using its existing tools
```

## Activation Tools

### `activate-skill`

Loads the full body content of a skill's SKILL.md file.

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Skill name (must match a discovered skill) |

**Returns:** SKILL.md body content as markdown string.

### `read-skill-resource`

Reads a resource file from within a skill directory.

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Skill name |
| `path` | `string` | Relative path within the skill directory |

**Returns:** File content as string. Blocked for `scripts/` paths from untrusted roots.

## Events

The `SkillRegistry` emits structured events for observability:

| Event | When |
|-------|------|
| `skill:discovered` | Skill found and parsed during discovery |
| `skill:warning` | Skill parse or validation issue |
| `skill:activated` | `activate-skill` tool successfully loaded a skill |
| `skill:resource-loaded` | `read-skill-resource` tool successfully loaded a resource |
| `trust:policy-denied` | Script access blocked by trust policy |
| `trust:policy-allowed` | Script access permitted by trust policy |

```typescript
registry.on(SkillRegistryEvent.SKILL_ACTIVATED, (data) => {
  console.log(`Skill activated: ${data.name}`);
});
```

## Security

### Path Traversal Protection

All resource paths are validated:
- Absolute paths rejected
- `..` path segments rejected
- Symlink escape attempts blocked
- Resolved path must stay within the skill directory

### Trust Policy Enforcement

Script resources (`scripts/` directory) are subject to trust policy checks. Non-script resources (references, assets, SKILL.md) are always accessible.

See [Trust Policies](/guide/agent-skills-authoring#trust-policies) for the full trust model.

## Feature Flag

Agent Skills uses a feature flag for progressive rollout:

```typescript
// Disabled (default) — generatePrompt() returns ''
const registry = new SkillRegistry({
  skillRoots: ['.agentskills'],
});

// Enabled — generatePrompt() returns <available_skills> XML
const registryEnabled = new SkillRegistry({
  enabled: true,
  skillRoots: ['.agentskills'],
});
```

When disabled, skills are still discovered and activation tools still work — only prompt generation is suppressed. This allows gradual rollout.
