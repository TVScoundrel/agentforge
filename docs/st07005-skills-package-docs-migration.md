# ST-07005: Update Documentation and Examples

**Epic:** EP-07 — Extract Skills into Dedicated Package
**Branch:** `feat/st-07005-skills-docs-migration`
**PR:** #56

## Summary

Updated all documentation, guides, tutorials, examples, and API references to reflect the skills package extraction from `@agentforge/core` to `@agentforge/skills`.

## Changes

### Import Updates (10 files)

| File | Changes |
|------|---------|
| `docs-site/guide/agent-skills.md` | Imports → `@agentforge/skills`, logger namespaces updated |
| `docs-site/guide/agent-skills-authoring.md` | API link updated |
| `docs-site/tutorials/skill-powered-agent.md` | Imports, install cmd, API link updated |
| `docs-site/examples/agent-skills.md` | 10 import updates (6 simple, 2 mixed-import splits, 2 kept as core) |
| `docs-site/api/core.md` | Agent Skills section removed, cross-reference tip added |
| `docs-site/api/skills.md` | **New file** — full SkillRegistry API reference |
| `docs-site/guide/migration.md` | New "Skills Package Extraction" migration section |
| `examples/applications/skill-aware-agent/package.json` | Added `@agentforge/skills` dependency |
| `examples/applications/skill-aware-agent/src/index.ts` | Import updated to `@agentforge/skills` |
| `README.md` | Added `@agentforge/skills` row to package table |

### Mixed Import Splits

Two code examples had mixed imports that needed splitting:

```typescript
// Before
import { SkillRegistry, ToolRegistry } from '@agentforge/core';

// After
import { SkillRegistry } from '@agentforge/skills';
import { ToolRegistry } from '@agentforge/core';
```

```typescript
// Before
import { SkillRegistry, toolBuilder, ToolCategory } from '@agentforge/core';

// After
import { SkillRegistry } from '@agentforge/skills';
import { toolBuilder, ToolCategory } from '@agentforge/core';
```

### Logger Namespace Updates

```
# Before
agentforge:core:skills:registry
agentforge:core:skills:activation
agentforge:core:skills:scanner

# After
agentforge:skills:registry
agentforge:skills:activation
agentforge:skills:scanner
```

## Test Impact

No test changes required — this story only updates documentation and the `skill-aware-agent` example app. All 2337 tests continue to pass (159 files passed, 1 skipped).

## Validation

- **Tests:** 159 passed | 1 skipped (160 files), 2337 passed | 17 skipped (2354 tests)
- **Lint:** 0 errors, 109 warnings (all pre-existing `@typescript-eslint/no-explicit-any`)
