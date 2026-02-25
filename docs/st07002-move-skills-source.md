# ST-07002: Move Skills Source Files and Re-wire Imports

## Summary

Copied the 6 skills source files from `packages/core/src/skills/` to `packages/skills/src/`, establishing `@agentforge/skills` as a standalone package with its own source, re-wired to import core primitives via `@agentforge/core` package imports.

## Changes

### Files Copied to `packages/skills/src/`

| File | Import Changes |
|------|---------------|
| `types.ts` | None — pure type definitions |
| `trust.ts` | None — only internal refs to `./types.js` |
| `parser.ts` | None — only internal refs + `gray-matter` |
| `scanner.ts` | `createLogger`, `LogLevel` → `@agentforge/core` |
| `registry.ts` | `createLogger`, `LogLevel` → `@agentforge/core` |
| `activation.ts` | `ToolBuilder`, `ToolCategory`, `Tool`, `createLogger`, `LogLevel` → `@agentforge/core` |

### Logger Name Updates

Logger names updated from `agentforge:core:skills:*` to `agentforge:skills:*` to reflect the new package home:
- `agentforge:skills:activation`
- `agentforge:skills:registry`
- `agentforge:skills:scanner`

### Barrel Exports

`packages/skills/src/index.ts` updated to match the previous public API from `packages/core/src/skills/index.ts` — all types, enums, functions, and classes are re-exported.

### What Stays in Core

- Core source files remain in place (deleted and replaced with deprecation re-exports in ST-07003)
- `ToolCategory.SKILLS` enum value stays in `@agentforge/core` — the skills package imports it

## Decisions

- **Copy, not move**: Core files stay until ST-07003 replaces them with thin re-exports. This prevents breaking `@agentforge/core` exports during the transition.
- **Logger namespace**: Changed from `agentforge:core:skills:*` to `agentforge:skills:*` to reflect the canonical package home.
- **No `index.ts` copy**: The core barrel file (`packages/core/src/skills/index.ts`) is not copied — the skills package has its own barrel that imports from local files.
