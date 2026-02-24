---
outline: deep
---

# Skill Authoring Guide

This guide explains how to create skills compatible with AgentForge's implementation of the [Agent Skills specification](https://agentskills.io/specification).

## Skill Directory Structure

Each skill lives in its own directory within a skill root. The directory name **must** match the skill's `name` field in its frontmatter.

```
my-skill/
├── SKILL.md              # Required — skill definition
├── references/           # Optional — reference documents
│   ├── api-guide.md
│   └── examples.md
├── scripts/              # Optional — executable scripts (trust-controlled)
│   └── setup.sh
└── assets/               # Optional — images, data files
    └── diagram.png
```

## SKILL.md Format

A skill file has two parts: **YAML frontmatter** (metadata) and **markdown body** (instructions).

```markdown
---
name: code-review
description: Performs thorough code reviews with style and security checks
version: 1.0.0
license: MIT
compatibility:
  - agentforge
  - copilot
metadata:
  category: development
  difficulty: intermediate
allowed-tools:
  - read-file
  - grep-search
  - run-in-terminal
---

# Code Review Skill

You are a code review expert. When activated, follow these steps:

1. Read the file(s) to review using `read-file`
2. Check for common issues...
```

## Frontmatter Fields

### Required

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `name` | `string` | 1–64 chars, lowercase `[a-z0-9-]`, must match directory name | Unique skill identifier |
| `description` | `string` | 1–1024 chars | Short description shown in skill listing |

### Optional

| Field | Type | Description |
|-------|------|-------------|
| `version` | `string` | Semantic version (e.g. `1.0.0`) |
| `license` | `string` | SPDX license identifier |
| `compatibility` | `string[]` | Platforms this skill targets |
| `metadata` | `object` | Arbitrary key-value pairs |
| `allowed-tools` | `string[]` | Tool names the skill is designed to use |

### Field Mapping to AgentForge Behavior

| Spec Field | AgentForge Usage |
|------------|-----------------|
| `name` | Skill lookup key, directory validation, activation tool parameter |
| `description` | Included in `<available_skills>` XML prompt |
| `version` | Stored in metadata, not enforced at runtime |
| `license` | Stored in metadata, not enforced at runtime |
| `compatibility` | Stored in metadata, not enforced at runtime |
| `metadata` | Stored in metadata, available via `registry.get(name)` |
| `allowed-tools` | Available via `registry.getAllowedTools(name)` for agent tool filtering |

## Validation Rules

AgentForge validates skills during discovery:

1. **Name format** — Must be 1–64 characters, lowercase alphanumeric with hyphens (`[a-z0-9-]+`)
2. **Name match** — Frontmatter `name` must match the parent directory name
3. **Description required** — Must be 1–1024 characters
4. **SKILL.md required** — Directory must contain a `SKILL.md` file
5. **Valid YAML** — Frontmatter must parse as valid YAML

::: warning
Skills that fail validation are skipped with a warning event. Check `registry.getScanErrors()` for diagnostics.
:::

## Resource Directories

### `references/`

Reference documents that the agent can read for additional context. Always accessible regardless of trust level.

```markdown
When reviewing code, load the style guide first:
Use `read-skill-resource` to read `references/style-guide.md`
```

### `scripts/`

Executable scripts. **Access is controlled by trust policies.** Scripts from untrusted roots are blocked by default.

```markdown
Run the setup script to configure the linter:
Use `read-skill-resource` to read `scripts/setup-linter.sh`
Then execute it with `run-in-terminal`
```

### `assets/`

Static assets like images, data files, or templates. Always accessible.

## Trust Policies

Trust levels control access to `scripts/` resources:

| Trust Level | `references/` | `scripts/` | `assets/` |
|-------------|---------------|------------|-----------|
| `workspace` | Read | Read | Read |
| `trusted` | Read | Read | Read |
| `untrusted` | Read | **Denied** | Read |

### Promoting a Skill Root

To allow script access from a root:

1. **Review** the skill scripts manually
2. **Configure** the root with explicit trust:

```typescript
const registry = new SkillRegistry({
  enabled: true,
  skillRoots: [
    { path: '/path/to/reviewed-skills', trust: 'trusted' },
  ],
});
```

### `allowed-tools` Field

The `allowed-tools` frontmatter field declares which tools a skill is designed to use. This supports agent tool filtering — an agent can restrict its tool set to only the tools a skill expects:

```typescript
const allowedTools = registry.getAllowedTools('code-review');
// ['read-file', 'grep-search', 'run-in-terminal']
```

::: tip
`allowed-tools` is informational — it doesn't enforce tool restrictions at the framework level. The agent or orchestrator decides whether to filter tools.
:::

## Progressive Disclosure

The Agent Skills spec requires progressive disclosure to manage token budgets:

| Phase | Content | Token Budget |
|-------|---------|-------------|
| **Discovery** | Name + description only | ~50–100 tokens per skill |
| **Activation** | Full SKILL.md body | < 5,000 recommended |
| **Resources** | scripts/, references/, assets/ | On demand |

### Writing for Progressive Disclosure

- Keep your `description` concise — it's shown in the skill listing
- Front-load key instructions in the SKILL.md body
- Move detailed reference material to `references/` files
- Keep the SKILL.md body under 5,000 tokens when possible

## Example: Complete Skill

```
test-generator/
├── SKILL.md
└── references/
    └── testing-patterns.md
```

**SKILL.md:**

```markdown
---
name: test-generator
description: Generates comprehensive test suites for TypeScript projects using Vitest
version: 1.0.0
license: MIT
compatibility:
  - agentforge
  - copilot
metadata:
  category: testing
  framework: vitest
allowed-tools:
  - read-file
  - create-file
  - grep-search
---

# Test Generator

You are an expert test writer. When activated, generate comprehensive
test suites for the specified code.

## Process

1. Read the source file using `read-file`
2. Load testing patterns from `references/testing-patterns.md`
   using `read-skill-resource`
3. Analyze the code structure
4. Generate tests following the patterns guide
5. Write tests using `create-file`

## Test Quality Rules

- Every public function must have at least one test
- Include edge cases and error paths
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
```

**references/testing-patterns.md:**

```markdown
# Testing Patterns

## Unit Test Structure

Use `describe` blocks grouped by function, with `it` blocks per case:

\`\`\`typescript
describe('functionName', () => {
  it('should handle normal input', () => {
    // Arrange → Act → Assert
  });

  it('should throw on invalid input', () => {
    expect(() => fn(null)).toThrow();
  });
});
\`\`\`

## Mock Patterns

- Use `vi.fn()` for function mocks
- Use `vi.spyOn()` for method spies
- Always restore mocks in `afterEach`
```

## Troubleshooting

### Skill Not Discovered

- Verify the directory contains a `SKILL.md` file
- Check that `name` in frontmatter matches the directory name exactly
- Ensure the skill root path is correct and accessible
- Check `registry.getScanErrors()` for parse errors

### Script Access Denied

- Verify the skill root's trust level allows script access
- Promote the root to `trusted` or `workspace` trust level
- Or set `allowUntrustedScripts: true` (not recommended for production)

### Prompt Not Generated

- Ensure `enabled: true` is set in `SkillRegistryConfig`
- Check that skills were discovered: `registry.size() > 0`
