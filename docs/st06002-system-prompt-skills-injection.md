# ST-06002: SkillRegistry.generatePrompt() and System Prompt Integration

## Summary

Implements `SkillRegistry.generatePrompt()` — produces an `<available_skills>` XML block for system prompt injection, following the Agent Skills integration guide format. Mirrors the role of `ToolRegistry.generatePrompt()` for tools.

## Design Decisions

### XML Output Format (vs Plain Text)

The Agent Skills spec recommends XML for structured skill metadata in prompts. This differs from `ToolRegistry.generatePrompt()` which uses plain text. The XML format provides:
- Clear structure for LLM parsing (`<name>`, `<description>`, `<location>`)
- Composability — concatenating XML and plain text sections in system prompts works naturally

### Feature Flag (Default Off)

`config.enabled` defaults to `false`. When disabled, `generatePrompt()` returns an empty string, ensuring agents without skills operate with completely unmodified system prompts. This makes the feature opt-in and safe for existing deployments.

### Subset Filtering

`generatePrompt({ skills: ['code-review', 'testing'] })` enables creating focused agents with different skill sets from the same registry. When the `skills` array is omitted or empty, all discovered skills are included.

### maxDiscoveredSkills Cap

Applied after subset filtering. Limits prompt token usage when many skills are discovered. Skills are included in discovery order (first root first).

## API Surface

```typescript
const registry = new SkillRegistry({
  skillRoots: ['~/.copilot/skills'],
  enabled: true,            // Feature flag (default: false)
  maxDiscoveredSkills: 10,  // Optional cap
});

// All skills
const xml = registry.generatePrompt();

// Subset for focused agent
const xml = registry.generatePrompt({ skills: ['code-review'] });

// Compose with tool prompt
const systemPrompt = [
  toolRegistry.generatePrompt(),
  skillRegistry.generatePrompt(),
].filter(Boolean).join('\n\n');
```

### Example XML Output

```xml
<available_skills>
  <skill>
    <name>code-review</name>
    <description>Review code for quality and correctness</description>
    <location>/home/user/.copilot/skills/code-review</location>
  </skill>
</available_skills>
```

## Test Coverage

- **23 tests** in `packages/core/tests/skills/prompt.test.ts`
- Feature Flag Gating (4 tests): default off, explicit off, enabled, enabled but empty
- XML Generation (3 tests): structure, multiple skills, XML escaping
- Subset Filtering (5 tests): filter, nonexistent, empty array, no options, mixed
- maxDiscoveredSkills Cap (5 tests): limit, zero, exceeds, after filter, undefined
- Prompt Composition (2 tests): composable with tool prompt, empty when disabled
- Edge Cases (4 tests): undefined options, empty registry, re-scan, consistency
