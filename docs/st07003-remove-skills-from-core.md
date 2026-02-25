# ST-07003: Remove Skills from Core (Breaking Change)

## Summary

Removed the skills system source code from `@agentforge/core` entirely as a clean breaking change, rather than adding deprecation re-exports. The skills feature was introduced in EP-06 (v0.14.0) and has no external consumers, making a shim unnecessary.

## What Changed

### Deleted from `packages/core/`

**Source files** (`src/skills/`):
- `activation.ts`, `parser.ts`, `registry.ts`, `scanner.ts`, `trust.ts`, `types.ts`, `index.ts`

**Tests and fixtures** (`tests/skills/`):
- 7 test files (215 tests): `activation.test.ts`, `conformance.test.ts`, `parser.test.ts`, `prompt.test.ts`, `registry.test.ts`, `scanner.test.ts`, `trust.test.ts`
- Fixture skill packs: `valid/`, `malformed/`, `untrusted/`

### Modified

| File | Change |
|------|--------|
| `packages/core/src/index.ts` | Removed `export * from './skills/index.js'` |
| `packages/core/package.json` | Removed `gray-matter` from dependencies |

## Decision: Clean Break vs Deprecation Shim

**Chosen:** Clean break (delete entirely, no re-exports)

**Rationale:**
- Skills feature is brand new (EP-06, merged 2026-02-24)
- No external consumers exist — the feature shipped in v0.14.0 one day before extraction began
- A deprecation shim would create a circular dependency (core ↔ skills) with complex build ordering
- Clean break is simpler, smaller, and avoids ongoing maintenance of shim code

## Impact

### Bundle Size
| Output | Before | After | Reduction |
|--------|--------|-------|-----------|
| ESM | 171.62 KB | 143.67 KB | −27.95 KB (−16.3%) |
| CJS | 181.15 KB | 151.82 KB | −29.33 KB (−16.2%) |
| DTS | broken | 149.28 KB | Fixed |

### Test Count
- Core: 160 files → 153 files (−7 skills test files)
- Tests: 2337 → 2122 (−215 skills tests)
- Tests will be migrated to `@agentforge/skills` in ST-07004

### Migration Path
```typescript
// Before (v0.14.0)
import { SkillRegistry } from '@agentforge/core';

// After (v0.15.0+)
import { SkillRegistry } from '@agentforge/skills';
```
