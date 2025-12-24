# Package Extraction Plan: @agentforge/patterns

## Overview

Extract the ReAct pattern from `@agentforge/core` to a new `@agentforge/patterns` package to follow the intended architecture.

## Current State

**Location**: `packages/core/src/langgraph/patterns/react/`

**Files**:
- `schemas.ts` - Zod schemas for state
- `state.ts` - State definition
- `types.ts` - TypeScript types
- `prompts.ts` - Prompt templates
- `nodes.ts` - Node implementations
- `agent.ts` - Agent factory function
- `builder.ts` - Fluent builder API
- `index.ts` - Exports

**Tests**: `packages/core/tests/langgraph/patterns/react/`
- `schemas.test.ts` (10 tests)
- `state.test.ts` (10 tests)
- `nodes.test.ts` (9 tests)
- `agent.test.ts` (10 tests)
- `builder.test.ts` (19 tests)
- `integration.test.ts` (7 tests)

**Total**: 65 tests

## Target State

**New Package**: `packages/patterns/`

**Structure**:
```
packages/patterns/
├── src/
│   ├── react/
│   │   ├── schemas.ts
│   │   ├── state.ts
│   │   ├── types.ts
│   │   ├── prompts.ts
│   │   ├── nodes.ts
│   │   ├── agent.ts
│   │   ├── builder.ts
│   │   └── index.ts
│   └── index.ts
├── tests/
│   └── react/
│       ├── schemas.test.ts
│       ├── state.test.ts
│       ├── nodes.test.ts
│       ├── agent.test.ts
│       ├── builder.test.ts
│       └── integration.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

**@agentforge/patterns** will depend on:
- `@agentforge/core` - For tool system, LangGraph utilities
- `@langchain/core` - For base types
- `@langchain/langgraph` - For StateGraph
- `zod` - For schemas

## Migration Steps

### Step 1: Create Package Structure
1. Create `packages/patterns/` directory
2. Create `package.json` with dependencies
3. Create `tsconfig.json` extending root config
4. Create `README.md`

### Step 2: Move Source Files
1. Copy `packages/core/src/langgraph/patterns/react/` → `packages/patterns/src/react/`
2. Update imports to use `@agentforge/core` for:
   - Tool types and registry
   - LangGraph utilities (createStateAnnotation)
   - State management utilities
3. Create `packages/patterns/src/index.ts` to export ReAct

### Step 3: Move Tests
1. Copy `packages/core/tests/langgraph/patterns/react/` → `packages/patterns/tests/react/`
2. Update test imports
3. Verify all tests pass

### Step 4: Update Core Package
1. Remove `packages/core/src/langgraph/patterns/react/`
2. Remove ReAct exports from `packages/core/src/langgraph/patterns/index.ts`
3. Update `packages/core/README.md` to remove ReAct from core features
4. Keep error handling patterns (retry, timeout, error-handler) in core

### Step 5: Update Documentation
1. Update root `README.md` to show `@agentforge/patterns` as available
2. Move `packages/core/docs/react-agent-guide.md` → `packages/patterns/docs/`
3. Move `packages/core/docs/phase-3.1.4-summary.md` → `packages/patterns/docs/`
4. Update `docs/ROADMAP.md` to reflect package split

### Step 6: Verify & Test
1. Run `pnpm install` to link packages
2. Run `pnpm build` in both packages
3. Run `pnpm test` in both packages
4. Verify imports work correctly

## Import Changes

### Before (in @agentforge/core)
```typescript
import { ReActAgentBuilder } from '@agentforge/core';
```

### After (in @agentforge/patterns)
```typescript
import { ReActAgentBuilder } from '@agentforge/patterns';
import { toolBuilder, ToolRegistry } from '@agentforge/core';
```

## Test Count After Extraction

**@agentforge/core**: 271 tests (300 - 29 ReAct core tests)
- Phase 1: 113 tests (Tool System)
- Phase 2: 158 tests (LangGraph Utilities)
- Phase 3: 0 tests (patterns moved out)

**@agentforge/patterns**: 65 tests
- ReAct schemas: 10 tests
- ReAct state: 10 tests
- ReAct nodes: 9 tests
- ReAct agent: 10 tests
- ReAct builder: 19 tests
- ReAct integration: 7 tests

**Total**: 336 tests (271 + 65)

Note: We'll gain 10 tests from moving error handling patterns tests that were counted in Phase 3.

## Timeline

**Estimated Time**: 1-2 hours

1. Create package structure (15 min)
2. Move source files (20 min)
3. Update imports (20 min)
4. Move tests (15 min)
5. Update documentation (15 min)
6. Verify & test (15 min)

## Risks & Mitigation

**Risk**: Breaking imports in existing code
**Mitigation**: This is a new package, no existing consumers

**Risk**: Circular dependencies
**Mitigation**: Patterns depends on core, not vice versa

**Risk**: Test failures after move
**Mitigation**: Run tests at each step, fix incrementally

## Success Criteria

- ✅ All 65 ReAct tests passing in `@agentforge/patterns`
- ✅ All 271 core tests still passing in `@agentforge/core`
- ✅ Clean package boundaries (no circular deps)
- ✅ Documentation updated
- ✅ Build succeeds for both packages

