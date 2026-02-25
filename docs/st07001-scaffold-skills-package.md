# ST-07001: Scaffold `@agentforge/skills` Package

## Summary

Scaffolded the `@agentforge/skills` workspace package as the future home for the Agent Skills subsystem currently living in `@agentforge/core`.

## Decisions

### Package Identity
- **Description**: "Composable skill system for building modular AI agents in TypeScript, part of the AgentForge framework"
- **Keywords**: Targeted for discoverability (`agent-skills`, `llm-skills`, `composable-agents`, `modular-agents`, `skill-authoring`, `agent-capabilities`)
- The description conveys what skills *does* without requiring prior AgentForge knowledge, while acknowledging it's part of the ecosystem

### Dependency Strategy
- `@agentforge/core` as **peer dependency** (`>=0.14.0`) — consumer must install core
- `@agentforge/core` as **dev dependency** (`workspace:*`) — for local development/testing
- `gray-matter` added to skills' `dependencies` — will be **removed from core** in ST-07003 when the source code moves
- Cannot remove from core yet because `packages/core/src/skills/parser.ts` still imports it

### tsconfig Convention
- Matches `packages/testing/tsconfig.json` pattern — standalone config with same options as `tsconfig.base.json` rather than extending it
- This is consistent with how other leaf packages are configured

### Test Impact
- **No tests required** — scaffold-only story with no business logic
- Tests for the skills module will be migrated from core in ST-07004

## Files Created
- `packages/skills/package.json`
- `packages/skills/tsconfig.json`
- `packages/skills/tsup.config.ts`
- `packages/skills/src/index.ts` (placeholder)

## Files Modified
- `vitest.workspace.ts` — added skills test paths
- `pnpm-lock.yaml` — workspace linking updated
