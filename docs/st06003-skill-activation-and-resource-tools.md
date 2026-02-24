# ST-06003: Skill Activation and Resource Tools

**Story:** As an agent at runtime, I want to activate a skill by name and optionally load its referenced resources so that I can follow skill instructions to complete user tasks.

**Epic:** EP-06 (Agent Skills Compatibility Layer)
**Branch:** `feat/st-06003-skill-activation-and-resource-tools`
**PR:** https://github.com/TVScoundrel/agentforge/pull/48

---

## Summary

This story implements the runtime activation layer for the Agent Skills system. Two tools —  `activate-skill` and `read-skill-resource` — are built using the AgentForge tool builder API and pre-wired to a `SkillRegistry` instance via the `toActivationTools()` convenience method.

These tools follow the Agent Skills specification's **progressive disclosure** pattern:
1. **Discovery** (ST-06002): skill name + description in `<available_skills>` XML
2. **Activation** (this story): full SKILL.md body loaded on demand via tool call
3. **Resources** (this story): referenced files (scripts/, references/, assets/) loaded on demand

## Architecture

### Tool Design

Both tools are first-class AgentForge tools created with `ToolBuilder`:

| Tool | Input | Output | Purpose |
|------|-------|--------|---------|
| `activate-skill` | `{ name: string }` | Full SKILL.md body (string) | Load skill instructions |
| `read-skill-resource` | `{ name: string, path: string }` | File content (string) | Load referenced resource |

### Integration Pattern

```typescript
import { SkillRegistry } from '@agentforge/core';
import { createReActAgent } from '@agentforge/patterns';

const skillRegistry = new SkillRegistry({
  skillRoots: ['.agentskills', '~/.agentskills'],
  enabled: true,
});

const agent = createReActAgent({
  model: llm,
  tools: [
    ...toolRegistry.toLangChainTools(),
    ...skillRegistry.toActivationTools(),  // [activate-skill, read-skill-resource]
  ],
  systemPrompt: [
    'You are a helpful assistant.',
    toolRegistry.generatePrompt(),
    skillRegistry.generatePrompt(),
  ].filter(Boolean).join('\n\n'),
});
```

### Path Traversal Protection

`read-skill-resource` implements strict path containment:
- Rejects absolute paths (starting with `/` or `\`)
- Rejects `..` traversal patterns (both direct and nested)
- Resolves paths relative to the skill root directory
- Verifies the resolved path remains within the skill root using `path.relative()` comparison

### Event System Extension

Two new events added to `SkillRegistryEvent`:
- `skill:activated` — emitted when `activate-skill` successfully loads a skill body
- `skill:resource-loaded` — emitted when `read-skill-resource` successfully reads a file

Events are emitted through the registry's event system via the new `emitEvent()` public method.

### SKILLS Tool Category

A new `ToolCategory.SKILLS` enum value (`'skills'`) was added to organize skill-related tools alongside existing categories (FILE_SYSTEM, WEB, CODE, DATABASE, API, UTILITY, CUSTOM).

## Files Changed

| File | Change |
|------|--------|
| `packages/core/src/skills/activation.ts` | **NEW** — Tool factories, path resolver, body extractor |
| `packages/core/src/skills/registry.ts` | Added `toActivationTools()`, `emitEvent()`, activation import |
| `packages/core/src/skills/types.ts` | Added `SKILL_ACTIVATED`, `SKILL_RESOURCE_LOADED` events |
| `packages/core/src/skills/index.ts` | Added activation tool exports |
| `packages/core/src/tools/types.ts` | Added `SKILLS` to `ToolCategory` enum |
| `packages/core/tests/skills/activation.test.ts` | **NEW** — 38 tests |

## Test Coverage

38 tests across 6 describe blocks:

| Block | Tests | Coverage |
|-------|-------|----------|
| `resolveResourcePath` | 8 | Path security: absolute, traversal, valid paths |
| `activate-skill tool` | 8 | Metadata, success, errors, events, edge cases |
| `read-skill-resource tool` | 11 | All resource dirs, traversal blocking, errors, events |
| `createSkillActivationTools` | 2 | Factory output shape and categories |
| `SkillRegistry.toActivationTools()` | 2 | Convenience method binding |
| `End-to-end integration` | 5+2 | Full workflows, multi-root, event lifecycle, compose |

## Design Decisions

1. **Lazy body loading**: SKILL.md body is read from disk at activation time rather than cached in the registry. This aligns with the spec's progressive disclosure principle and avoids storing potentially large instruction sets in memory for all discovered skills.

2. **String return type**: Both tools return strings (not parsed objects). This matches the spec's intent that skill content is instruction text for the LLM to follow, not structured data for programmatic consumption.

3. **Error messages as return values**: Tools return descriptive error strings rather than throwing exceptions. This prevents agent crashes and gives the LLM context to recover gracefully.

4. **Public `emitEvent()`**: Rather than tightly coupling the activation tools into the registry class, tools call `registry.emitEvent()` to emit events through the existing event system. This keeps the activation module independent while maintaining unified observability.
