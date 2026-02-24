# ST-06001: SkillRegistry with Folder-Config Auto-Discovery

## Summary

Implements `SkillRegistry` in `@agentforge/core` — a folder-config auto-discovery system for Agent Skills following the [Agent Skills Specification](https://agentskills.io/specification). The registry scans configured `skillRoots` directories at construction time, discovers skills with valid `SKILL.md` frontmatter, and exposes a query API parallel to `ToolRegistry`.

## Design Decisions

### Folder-Config Auto-Discovery (vs Programmatic Registration)

Unlike `ToolRegistry` which uses programmatic `register()` calls, `SkillRegistry` uses filesystem-based auto-discovery. Skills are filesystem artifacts (directories with `SKILL.md` files), so configuration is a list of root paths (`skillRoots: string[]`) rather than code-level registration.

### Validation Strategy

Follows the Agent Skills spec strictly:
- **Name**: 1-64 chars, lowercase alphanumeric + hyphens, no leading/trailing/consecutive hyphens, must match parent directory name
- **Description**: 1-1024 chars, non-empty
- **Optional fields**: `license`, `compatibility`, `metadata`, `allowed-tools` — parsed but not required

### Duplicate Handling

When the same skill name appears in multiple roots, the first root wins (deterministic precedence by `skillRoots` array order). A `skill:warning` event is emitted for observability.

### Progressive Disclosure

Only YAML frontmatter is parsed at discovery time. The full SKILL.md body content and resource files are deferred to activation (ST-06003).

## Module Structure

```
packages/core/src/skills/
├── types.ts      # SkillMetadata, Skill, SkillRegistryConfig, events
├── parser.ts     # parseSkillContent(), validation functions
├── scanner.ts    # scanSkillRoot(), scanAllSkillRoots(), expandHome()
├── registry.ts   # SkillRegistry class
└── index.ts      # Barrel exports
```

## API Surface

```typescript
import { SkillRegistry } from '@agentforge/core';

const registry = new SkillRegistry({
  skillRoots: ['~/.copilot/skills', './project-skills'],
});

registry.get('code-review');      // Skill | undefined
registry.getAll();                // Skill[]
registry.has('code-review');      // boolean
registry.size();                  // number
registry.getNames();              // string[]
registry.getScanErrors();         // string[]
registry.on('skill:discovered', handler);
registry.off('skill:discovered', handler);
registry.discover();              // Re-scan all roots
```

## Test Coverage

- **71 tests** across 3 test files
- `parser.test.ts`: 34 tests — frontmatter parsing, name/description validation, edge cases
- `scanner.test.ts`: 10 tests — filesystem scanning with temp directory fixtures
- `registry.test.ts`: 27 tests — auto-discovery, query API, duplicates, events, re-scan, malformed recovery

## Dependencies Added

- `gray-matter` — YAML frontmatter parsing (MIT, well-maintained, 5M+ weekly npm downloads)
