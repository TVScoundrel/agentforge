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
import { SkillRegistry } from '@agentforge/skills';

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
| `skillRoots` | `Array<string \| SkillRootConfig>` | — (required) | Directories to scan for skills (required; pass `[]` to disable discovery) |
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
  5. Agent calls activate-skill({ name: "skill-name" })
     → Returns full SKILL.md body content
  6. Agent optionally calls read-skill-resource({ name: "skill-name", path: "references/guide.md" })
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
  if (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    typeof (data as { name: unknown }).name === 'string'
  ) {
    console.log(`Skill activated: ${(data as { name: string }).name}`);
  } else {
    console.log('Skill activated');
  }
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

## Rollout Checklist

Use this checklist when enabling Agent Skills in a production or team environment.

### 1. Feature-Flag Enablement

1. Start with `enabled: false` (default) — skills are discovered but not surfaced to the LLM
2. Verify discovery with `registry.size()` and `registry.getScanErrors()` before enabling
3. Set `enabled: true` to activate prompt injection
4. Set `allowUntrustedScripts: false` (default) — block untrusted script access

```typescript
const registry = new SkillRegistry({
  enabled: true,
  skillRoots: [
    { path: '.agentskills', trust: 'workspace' },
    { path: '~/.agentskills', trust: 'untrusted' },
  ],
  allowUntrustedScripts: false,
  maxDiscoveredSkills: 20,
});
```

### 2. Observability Checks

Subscribe to registry events for monitoring and alerting:

```typescript
import { SkillRegistryEvent } from '@agentforge/skills';

// Log all activations
registry.on(SkillRegistryEvent.SKILL_ACTIVATED, (data) => {
  console.log('Skill activated', data);
});

// Alert on trust policy denials
registry.on(SkillRegistryEvent.TRUST_POLICY_DENIED, (data) => {
  console.warn('Trust policy denied', data);
});

// Track resource loads
registry.on(SkillRegistryEvent.SKILL_RESOURCE_LOADED, (data) => {
  console.log('Skill resource loaded', data);
});

// Monitor scan warnings
registry.on(SkillRegistryEvent.SKILL_WARNING, (data) => {
  console.warn('Skill scan warning', data);
});
```

::: tip
For production, replace `console.*` calls with structured logging (e.g. `createLogger` from `@agentforge/core`) and a metrics library.
:::

**Key events to monitor:**

| Event (enum → emitted string) | Severity | Action |
|---|---|---|
| `SKILL_DISCOVERED` (`skill:discovered`) | Info | Track discovery count per deploy |
| `SKILL_ACTIVATED` (`skill:activated`) | Info | Monitor activation frequency |
| `SKILL_RESOURCE_LOADED` (`skill:resource-loaded`) | Info | Track resource access patterns |
| `TRUST_POLICY_DENIED` (`trust:policy-denied`) | Warning | Alert on unexpected denials |
| `TRUST_POLICY_ALLOWED` (`trust:policy-allowed`) | Info | Audit script access from trusted roots |
| `SKILL_WARNING` (`skill:warning`) | Warning | Investigate malformed skills |

**Logging namespaces** (set `LOG_LEVEL=debug` for detailed output):

- `agentforge:skills:registry` — Discovery, registration
- `agentforge:skills:activation` — Activation, resource loading, trust decisions
- `agentforge:skills:scanner` — Directory scanning

### 3. Rollback Procedure

If issues are detected after enabling Agent Skills:

1. **Immediate** — Set `enabled: false` to suppress prompt injection (agents stop seeing skills)
2. **If activation tools are problematic** — Remove activation tools from the agent's tool array
3. **If discovery causes issues** — Remove skill root paths from the configuration
4. **Full rollback** — Remove the `SkillRegistry` instantiation entirely

::: warning
Setting `enabled: false` only suppresses `generatePrompt()`. If activation tools are registered with the agent, they remain callable. Remove them from the tool array for a complete rollback.
:::

## See Also

- **[Skill Authoring Guide](/guide/agent-skills-authoring)** — How to write spec-compliant SKILL.md files with frontmatter, resources, and trust policies
- **[Skill-Powered Agent Tutorial](/tutorials/skill-powered-agent)** — Step-by-step walkthrough building a skill-powered agent from scratch
- **[Agent Skills Examples](/examples/agent-skills)** — Common patterns and runnable code snippets
- **[SkillRegistry API Reference](/api/skills#skillregistry)** — Full API documentation for the SkillRegistry class

