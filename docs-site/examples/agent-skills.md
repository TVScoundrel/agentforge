---
outline: deep
---

# Agent Skills Examples

Practical code examples for integrating Agent Skills into your AgentForge agents. Each example is self-contained and can be adapted to your use case.

## Basic Registry Setup

Create a `SkillRegistry` that scans a local directory for skills:

```typescript
import { SkillRegistry } from '@agentforge/core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const skillRegistry = new SkillRegistry({
  skillRoots: [
    {
      path: path.join(__dirname, '..', '.agentskills'),
      trust: 'workspace',
    },
  ],
  enabled: true,
});

// Query discovered skills
console.log(`Found ${skillRegistry.size()} skills`);
console.log('Names:', skillRegistry.getNames());

// Check for a specific skill
if (skillRegistry.has('code-review')) {
  const skill = skillRegistry.get('code-review');
  console.log(skill?.metadata.description);
  console.log('Trust level:', skill?.trustLevel);
}

// Get all skills
for (const skill of skillRegistry.getAll()) {
  console.log(`${skill.metadata.name} — ${skill.metadata.description}`);
}
```

## Prompt Generation

Generate the `<available_skills>` XML block to include in your agent's system prompt:

```typescript
import { SkillRegistry } from '@agentforge/core';

const skillRegistry = new SkillRegistry({
  skillRoots: [{ path: './.agentskills', trust: 'workspace' }],
  enabled: true,
  maxDiscoveredSkills: 10, // Limit prompt token usage
});

// Full prompt with all skills
const fullPrompt = skillRegistry.generatePrompt();

// Filtered prompt — only include specific skills
const focusedPrompt = skillRegistry.generatePrompt({
  skills: ['code-review', 'test-generator'],
});

// Compose with tool prompt
import { ToolRegistry } from '@agentforge/core';

const toolRegistry = new ToolRegistry();
// ... register tools ...

const systemPrompt = `You are a helpful coding assistant.

${toolRegistry.generatePrompt()}

${skillRegistry.generatePrompt()}

When a task matches an available skill, activate it and follow its instructions.`;
```

::: tip Feature Flag
When `enabled: false` (the default), `generatePrompt()` returns an empty string. This lets you toggle skills without changing your prompt construction logic.
:::

## Activation Tools

Wire skill activation into any agent pattern using `toActivationTools()`:

```typescript
import { SkillRegistry } from '@agentforge/core';
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const skillRegistry = new SkillRegistry({
  skillRoots: [{ path: './.agentskills', trust: 'workspace' }],
  enabled: true,
});

// Get the two activation tools
const [activateSkill, readSkillResource] = skillRegistry.toActivationTools();

// Use with ReAct agent
const agent = createReActAgent({
  model: new ChatOpenAI({ modelName: 'gpt-4o' }),
  tools: [activateSkill, readSkillResource],
  systemPrompt: `You have access to skills. ${skillRegistry.generatePrompt()}`,
});

// Or use individual tool factories
import {
  createActivateSkillTool,
  createReadSkillResourceTool,
} from '@agentforge/core';

const activate = createActivateSkillTool(skillRegistry);
const readResource = createReadSkillResourceTool(skillRegistry);
```

### activate-skill

The agent calls this tool to load a skill's full instructions:

```typescript
// The agent would invoke this tool like:
// activate-skill({ name: "code-review" })
//
// Returns the full SKILL.md body content (below the frontmatter):
// "# Code Review Skill\n\n## Process\n1. Read the file(s)..."
```

### read-skill-resource

The agent calls this tool to load resource files from a skill directory:

```typescript
// The agent would invoke this tool like:
// read-skill-resource({ name: "test-generator", path: "references/test-template.md" })
//
// Returns the file content as a string.
// Common resource directories: references/, scripts/, assets/ (any file within the skill directory is allowed)
// Note: script files are subject to trust policy checks based on the skill root's trust level.
```

## Multi-Root Configuration

Configure multiple skill roots with different trust levels for layered access control:

```typescript
import { SkillRegistry } from '@agentforge/core';

const skillRegistry = new SkillRegistry({
  skillRoots: [
    // First-party skills — full access including scripts
    {
      path: './.agentskills',
      trust: 'workspace',
    },
    // Vetted team/community skills — scripts allowed
    {
      path: '/opt/company-skills',
      trust: 'trusted',
    },
    // User-installed skills — scripts blocked
    {
      path: `${process.env.HOME}/.agentskills`,
      trust: 'untrusted',
    },
  ],
  enabled: true,
});

// Skills from all roots are merged
// Duplicate names: first root wins (deterministic precedence)
console.log(`Total skills: ${skillRegistry.size()}`);

// Check a skill's trust level
const skill = skillRegistry.get('some-community-skill');
console.log('Trust:', skill?.trustLevel); // 'trusted' or 'untrusted'
```

::: info String Shorthand
You can pass plain strings instead of config objects. Strings default to `untrusted` trust:
```typescript
const registry = new SkillRegistry({
  skillRoots: ['/path/to/skills'], // Equivalent to { path: '...', trust: 'untrusted' }
  enabled: true,
});
```
:::

## Trust Policies

Control what resources agents can access based on the skill root's trust level:

```typescript
import { SkillRegistry, SkillRegistryEvent } from '@agentforge/core';

const skillRegistry = new SkillRegistry({
  skillRoots: [
    { path: './.agentskills', trust: 'workspace' },
    { path: './community-skills', trust: 'untrusted' },
  ],
  enabled: true,
  // allowUntrustedScripts: true, // Override to allow scripts from untrusted roots (NOT recommended)
});

// Monitor trust decisions
skillRegistry.on(SkillRegistryEvent.TRUST_POLICY_DENIED, (data) => {
  const event = data as {
    name: string;
    resourcePath: string;
    trustLevel: string;
    reason: string;
    message: string;
  };
  console.warn(`DENIED: ${event.name}/${event.resourcePath} — ${event.message}`);
});

skillRegistry.on(SkillRegistryEvent.TRUST_POLICY_ALLOWED, (data) => {
  const event = data as {
    name: string;
    resourcePath: string;
    trustLevel: string;
    reason: string;
  };
  console.log(`ALLOWED: ${event.name}/${event.resourcePath} (${event.reason})`);
});
```

**Trust policy matrix:**

| Resource Type | `workspace` | `trusted` | `untrusted` |
|--------------|:-----------:|:---------:|:-----------:|
| `references/*` | ✅ | ✅ | ✅ |
| `assets/*` | ✅ | ✅ | ✅ |
| `scripts/*` | ✅ | ✅ | ❌ |

::: warning Path Traversal Protection
The `read-skill-resource` tool blocks all path traversal attempts. Absolute paths, `..` segments, and symlink escapes are rejected before any file access occurs.
:::

## Allowed-Tools Filtering

Skills can declare which tools they're designed to use. Use `getAllowedTools()` to filter your agent's tool set per skill:

```typescript
import { SkillRegistry, ToolRegistry } from '@agentforge/core';

const skillRegistry = new SkillRegistry({
  skillRoots: [{ path: './.agentskills', trust: 'workspace' }],
  enabled: true,
});

const toolRegistry = new ToolRegistry();
// ... register tools ...

// Get the allowed tools for a specific skill
const allowedTools = skillRegistry.getAllowedTools('code-review');
// Returns: ['file-reader', 'file-search'] or undefined if not set

if (allowedTools) {
  // Filter registered tools to only those the skill expects
  const filtered = toolRegistry.getAll()
    .filter(tool => allowedTools.includes(tool.metadata.name));
  console.log('Filtered tools:', filtered.map(t => t.metadata.name));
}
```

## Event Monitoring

Subscribe to registry events for observability, logging, and metrics:

```typescript
import { SkillRegistry, SkillRegistryEvent } from '@agentforge/core';

const skillRegistry = new SkillRegistry({
  skillRoots: [{ path: './.agentskills', trust: 'workspace' }],
  enabled: true,
});

// Discovery events (emitted during construction / discover())
skillRegistry.on(SkillRegistryEvent.SKILL_DISCOVERED, (data) => {
  const skill = data as {
    metadata: { name: string; description: string };
    skillPath: string;
    trustLevel: string;
  };
  console.log(`✅ Discovered: ${skill.metadata.name} (${skill.trustLevel})`);
});

skillRegistry.on(SkillRegistryEvent.SKILL_WARNING, (data) => {
  const warning = data as {
    skillPath: string;
    rootPath: string;
    error: string;
    duplicateOf?: string;
  };
  console.warn(`⚠️ Warning: ${warning.error} at ${warning.skillPath}`);
});

// Runtime events (emitted by activation tools)
skillRegistry.on(SkillRegistryEvent.SKILL_ACTIVATED, (data) => {
  const event = data as { name: string; skillPath: string; bodyLength: number };
  console.log(`📋 Activated: ${event.name} (${event.bodyLength} chars)`);
});

skillRegistry.on(SkillRegistryEvent.SKILL_RESOURCE_LOADED, (data) => {
  const event = data as {
    name: string;
    resourcePath: string;
    resolvedPath: string;
    contentLength: number;
  };
  console.log(`📄 Resource: ${event.name}/${event.resourcePath}`);
});

// Trust events
skillRegistry.on(SkillRegistryEvent.TRUST_POLICY_DENIED, (data) => {
  const event = data as { name: string; resourcePath: string; message: string };
  console.error(`🚫 Denied: ${event.message}`);
});

skillRegistry.on(SkillRegistryEvent.TRUST_POLICY_ALLOWED, (data) => {
  const event = data as { name: string; resourcePath: string; reason: string };
  console.log(`🔓 Allowed: ${event.name}/${event.resourcePath}`);
});

// Unsubscribe when done
const handler = (data: unknown) => { /* ... */ };
skillRegistry.on(SkillRegistryEvent.SKILL_ACTIVATED, handler);
skillRegistry.off(SkillRegistryEvent.SKILL_ACTIVATED, handler);
```

## Re-Discovery

Rescan skill roots at runtime (e.g., after installing new skills):

```typescript
const skillRegistry = new SkillRegistry({
  skillRoots: [{ path: './.agentskills', trust: 'workspace' }],
  enabled: true,
});

console.log(`Initial: ${skillRegistry.size()} skills`);

// ... user installs a new skill directory ...

// Rescan all roots (clears and rebuilds the registry)
skillRegistry.discover();
console.log(`After rescan: ${skillRegistry.size()} skills`);
```

## Combining Skills with Custom Tools

Build agents that use both custom tools and skill-driven instructions:

```typescript
import { SkillRegistry, toolBuilder, ToolCategory } from '@agentforge/core';
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

// Custom local file-reading tool (distinct from the built-in `file-reader` tool)
const readFileTool = toolBuilder()
  .name('local-file-reader')
  .description('Read the contents of a file')
  .category(ToolCategory.FILE_SYSTEM)
  .schema(z.object({
    path: z.string().describe('File path to read'),
  }))
  .implementSafe(async ({ path }) => {
    const fs = await import('fs/promises');
    return fs.readFile(path, 'utf-8');
  })
  .build();

// Skill registry with activation tools
const skillRegistry = new SkillRegistry({
  skillRoots: [{ path: './.agentskills', trust: 'workspace' }],
  enabled: true,
});

const [activateSkill, readSkillResource] = skillRegistry.toActivationTools();

// Combine custom tools + skill activation tools
const agent = createReActAgent({
  model: new ChatOpenAI({ modelName: 'gpt-4o' }),
  tools: [readFileTool, activateSkill, readSkillResource],
  systemPrompt: `You are a coding assistant.

${skillRegistry.generatePrompt()}

When a task matches a skill, activate it first to get detailed instructions.
You also have direct tools available for file operations.`,
});
```

## What's Next?

- **[Agent Skills Integration Guide](/guide/agent-skills)** — Configuration reference, runtime flow, security, and rollout checklist
- **[Skill Authoring Guide](/guide/agent-skills-authoring)** — How to write spec-compliant SKILL.md files
- **[Skill-Powered Agent Tutorial](/tutorials/skill-powered-agent)** — Step-by-step walkthrough building from scratch
- **[SkillRegistry API Reference](/api/core#skillregistry)** — Full API documentation
