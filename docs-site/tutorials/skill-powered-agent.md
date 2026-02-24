---
outline: deep
---

# Building a Skill-Powered Agent

In this tutorial, you'll build an AI agent that discovers, activates, and follows SKILL.md-driven instructions at runtime — all in about 15 minutes. By the end, your agent will select and use skills autonomously to complete user tasks.

## What You'll Build

A skill-powered coding assistant that can:
- Discover available skills from configured directories
- Show skill summaries in its system prompt
- Activate a skill on demand and follow its instructions
- Load skill resources (references, templates, scripts)
- Respect trust boundaries for script access

## Prerequisites

- Node.js 18+
- An OpenAI API key (or any LangChain-compatible LLM)
- Basic TypeScript knowledge
- Familiarity with [AgentForge tools](/guide/concepts/tools) and [agent patterns](/guide/patterns/react)

## Step 1: Set Up the Project

```bash
npx @agentforge/cli create skill-agent
cd skill-agent
pnpm install
```

Install the LLM provider:

```bash
pnpm add @agentforge/core @agentforge/patterns @langchain/openai
```

Create `.env`:

```bash
OPENAI_API_KEY=your-api-key-here
```

## Step 2: Create Your First Skill

Skills are directories containing a `SKILL.md` file with YAML frontmatter. Create a skill root and your first skill:

```bash
mkdir -p .agentskills/code-review
```

Create `.agentskills/code-review/SKILL.md`:

```markdown
---
name: code-review
description: Performs thorough code reviews with focus on best practices, security, and maintainability.
allowed-tools:
  - file-reader
  - file-search
---

# Code Review Skill

## Process

1. Read the file(s) the user wants reviewed
2. Analyze for:
   - Security vulnerabilities
   - Performance issues
   - Code style and readability
   - Error handling gaps
3. Provide a structured review with severity levels:
   - 🔴 Critical — must fix before merge
   - 🟡 Warning — should fix
   - 🟢 Suggestion — nice to have

## Output Format

Use this template for each finding:

**[SEVERITY] Title**
- File: `path/to/file`
- Line: N
- Issue: Description of the problem
- Fix: Suggested solution
```

::: tip Skill Name Must Match Directory
The `name` field in the frontmatter **must** match the parent directory name. So `code-review/SKILL.md` requires `name: code-review`.
:::

## Step 3: Create a Second Skill with Resources

Create a test-generator skill with a reference template:

```bash
mkdir -p .agentskills/test-generator/references
```

Create `.agentskills/test-generator/SKILL.md`:

```markdown
---
name: test-generator
description: Generates comprehensive test suites following project conventions and testing best practices.
allowed-tools:
  - file-reader
  - file-writer
---

# Test Generator Skill

## Process

1. Read the source file to understand the API surface
2. Load the test template from `references/test-template.md`
3. Generate tests covering:
   - Happy path for each public method
   - Edge cases (null, empty, boundary values)
   - Error handling paths
4. Follow the project's existing test conventions

## Conventions

- Use `describe`/`it` blocks with clear descriptions
- One assertion per test when possible
- Use factory helpers for test data setup
```

Create `.agentskills/test-generator/references/test-template.md`:

```markdown
# Test Template

Use this structure for generated test files:

\`\`\`typescript
import { describe, it, expect } from 'vitest';

describe('<ModuleName>', () => {
  describe('<methodName>()', () => {
    it('should <expected behavior> when <condition>', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
\`\`\`
```

## Step 4: Configure the Skill Registry

Now wire the skills into your agent. Create `src/index.ts`:

```typescript
import { SkillRegistry } from '@agentforge/core';
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Create the skill registry
const skillRegistry = new SkillRegistry({
  skillRoots: [
    {
      path: path.join(__dirname, '..', '.agentskills'),
      trust: 'workspace',  // Full trust for your own skills
    }
  ],
  enabled: true,           // Enable skill prompt generation
  maxDiscoveredSkills: 20, // Cap to manage prompt token usage
});

console.log(`Discovered ${skillRegistry.size()} skills:`);
for (const skill of skillRegistry.getAll()) {
  console.log(`  - ${skill.metadata.name}: ${skill.metadata.description}`);
}
```

Run it to verify discovery works:

```bash
pnpm dlx tsx src/index.ts
```

Expected output:

```
Discovered 2 skills:
  - code-review: Performs thorough code reviews with focus on best practices, security, and maintainability.
  - test-generator: Generates comprehensive test suites following project conventions and testing best practices.
```

## Step 5: Generate the System Prompt

The `generatePrompt()` method produces an `<available_skills>` XML block that tells the LLM which skills are available:

```typescript
// 2. Generate skill-aware system prompt
const skillPrompt = skillRegistry.generatePrompt();
console.log(skillPrompt);
```

Output:

```xml
<available_skills>
  <skill>
    <name>code-review</name>
    <description>Performs thorough code reviews with focus on best practices, security, and maintainability.</description>
    <location>/path/to/.agentskills/code-review</location>
  </skill>
  <skill>
    <name>test-generator</name>
    <description>Generates comprehensive test suites following project conventions and testing best practices.</description>
    <location>/path/to/.agentskills/test-generator</location>
  </skill>
</available_skills>
```

::: tip Subset Filtering
You can pass a `skills` filter to only include specific skills in the prompt:
```typescript
const prompt = skillRegistry.generatePrompt({ skills: ['code-review'] });
```
This is useful when building focused agents that only need a subset of available skills.
:::

## Step 6: Wire Activation Tools into the Agent

The `toActivationTools()` method returns two tools pre-wired to the registry:

- **`activate-skill`** — loads the full SKILL.md instructions for a skill by name
- **`read-skill-resource`** — reads a resource file from a skill's directory

```typescript
// 3. Get activation tools
const [activateSkill, readSkillResource] = skillRegistry.toActivationTools();

// 4. Create the LLM
const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0,
});

// 5. Build the agent with skill tools
const agent = createReActAgent({
  llm,
  tools: [activateSkill, readSkillResource],
  systemPrompt: `You are a coding assistant with access to specialized skills.

${skillPrompt}

When a user asks for help, check if an available skill matches the task.
If so, use the activate-skill tool to load the skill's full instructions,
then follow those instructions to complete the task.
Use read-skill-resource to load any referenced templates or files.`,
});
```

## Step 7: Run Your Skill-Powered Agent

Add the invocation and run it:

```typescript
// 6. Invoke the agent
const result = await agent.invoke({
  messages: [
    {
      role: 'user',
      content: 'Please review the code in src/index.ts for any issues.',
    },
  ],
});

console.log('Agent response:');
for (const msg of result.messages) {
  if (msg._getType() === 'ai' && msg.content) {
    console.log(msg.content);
  }
}
```

The agent will:
1. See `code-review` in `<available_skills>` and recognize it matches the task
2. Call `activate-skill` with `{ name: "code-review" }` to load the full instructions
3. Follow the skill's review process (read files, analyze, structured output)

```bash
pnpm dlx tsx src/index.ts
```

## Step 8: Add Observability with Events

The `SkillRegistry` emits events you can monitor for observability:

```typescript
import { SkillRegistryEvent } from '@agentforge/core';

// Listen for skill activations
skillRegistry.on(SkillRegistryEvent.SKILL_ACTIVATED, (data) => {
  const event = data as { name: string; skillPath: string; bodyLength: number };
  console.log(`📋 Skill activated: ${event.name} (${event.bodyLength} chars)`);
});

// Listen for resource loads
skillRegistry.on(SkillRegistryEvent.SKILL_RESOURCE_LOADED, (data) => {
  const event = data as {
    name: string;
    resourcePath: string;
    contentLength: number;
  };
  console.log(
    `📄 Resource loaded: ${event.name}/${event.resourcePath} (${event.contentLength} chars)`,
  );
});

// Listen for trust policy denials
skillRegistry.on(SkillRegistryEvent.TRUST_POLICY_DENIED, (data) => {
  const event = data as { name: string; resourcePath: string; reason: string };
  console.warn(`🚫 Trust denied: ${event.name}/${event.resourcePath} — ${event.reason}`);
});
```

## Step 9: Add Trust Policies for External Skills

When loading skills from external or community sources, use trust levels to control access:

```typescript
const skillRegistry = new SkillRegistry({
  skillRoots: [
    {
      path: path.join(__dirname, '..', '.agentskills'),
      trust: 'workspace',    // Your own skills — full access
    },
    {
      path: '/usr/local/share/agentskills',
      trust: 'trusted',      // Vetted community skills — scripts allowed
    },
    {
      path: path.join(process.env.HOME!, '.agentskills'),
      trust: 'untrusted',    // Unknown skills — scripts blocked
    },
  ],
  enabled: true,
});
```

| Trust Level | Reference Files | Script Files | Use Case |
|-------------|----------------|--------------|----------|
| `workspace` | ✅ Allowed | ✅ Allowed | First-party skills in your project |
| `trusted` | ✅ Allowed | ✅ Allowed | Vetted community/team skills |
| `untrusted` | ✅ Allowed | ❌ Blocked | Unknown or unreviewed skill sources |

::: warning Script Access
Resources under `scripts/` directories are subject to trust policy enforcement. Only `workspace` and `trusted` roots allow script access. Use `allowUntrustedScripts: true` in config to override (not recommended for production).
:::

## Complete Working Example

Here's the full `src/index.ts` putting it all together:

```typescript
import { SkillRegistry, SkillRegistryEvent } from '@agentforge/core';
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Create and configure skill registry
const skillRegistry = new SkillRegistry({
  skillRoots: [
    {
      path: path.join(__dirname, '..', '.agentskills'),
      trust: 'workspace',
    },
  ],
  enabled: true,
  maxDiscoveredSkills: 20,
});

// 2. Add observability
skillRegistry.on(SkillRegistryEvent.SKILL_ACTIVATED, (data) => {
  const event = data as { name: string; bodyLength: number };
  console.log(`📋 Skill activated: ${event.name} (${event.bodyLength} chars)`);
});

skillRegistry.on(SkillRegistryEvent.SKILL_RESOURCE_LOADED, (data) => {
  const event = data as { name: string; resourcePath: string };
  console.log(`📄 Resource loaded: ${event.name}/${event.resourcePath}`);
});

// 3. Generate prompt and tools
const skillPrompt = skillRegistry.generatePrompt();
const [activateSkill, readSkillResource] = skillRegistry.toActivationTools();

// 4. Create agent
const llm = new ChatOpenAI({ modelName: 'gpt-4o', temperature: 0 });

const agent = createReActAgent({
  llm,
  tools: [activateSkill, readSkillResource],
  systemPrompt: `You are a coding assistant with access to specialized skills.

${skillPrompt}

When a user asks for help, check if an available skill matches the task.
If so, use the activate-skill tool to load the skill's full instructions,
then follow those instructions to complete the task.
Use read-skill-resource to load any referenced templates or files.`,
});

// 5. Run the agent
const result = await agent.invoke({
  messages: [
    {
      role: 'user',
      content: 'Generate tests for the file src/utils/helpers.ts',
    },
  ],
});

for (const msg of result.messages) {
  if (msg._getType() === 'ai' && msg.content) {
    console.log(msg.content);
  }
}
```

## What's Next?

- **[Agent Skills Integration Guide](/guide/agent-skills)** — Configuration reference, runtime flow, security, and rollout checklist
- **[Skill Authoring Guide](/guide/agent-skills-authoring)** — How to write spec-compliant SKILL.md files with frontmatter, resources, and trust policies
- **[Agent Skills Examples](/examples/agent-skills)** — Common patterns and code snippets for skill integration
- **[SkillRegistry API Reference](/api/core#skillregistry)** — Full API documentation for the SkillRegistry class
