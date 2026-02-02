# AgentForge Copilot Instructions

**AgentForge** is a production-ready TypeScript framework for building autonomous agents with LangGraph. This is a **pnpm workspace monorepo** with 5 published npm packages.

## Architecture

```
@agentforge/patterns (agent implementations)
    ↓ depends on
@agentforge/core (tools, LangGraph utils, streaming, resources, monitoring)
    ↓ wraps
LangGraph + LangChain (external)
```

- **@agentforge/core**: Tool system (builder API, registry, metadata), LangGraph utilities (state management, checkpointing), middleware, streaming, resource management, monitoring
- **@agentforge/patterns**: 4 agent patterns - ReAct, Plan-Execute, Reflection, Multi-Agent (all use LangGraph StateGraph)
- **@agentforge/tools**: 74 production-ready tools across 5 categories (File System, Web, Code, Database, System)
- **@agentforge/testing**: Test utilities (mocks for LLM/tools, assertions, state builders, fixtures)
- **@agentforge/cli**: Project scaffolding, templates, development commands (156 tests, 98.11% coverage)

## Critical Workflows

### Development Commands (pnpm workspace)
```bash
# Root commands run across all packages
pnpm build              # Build all packages (tsup: esm+cjs)
pnpm dev                # Watch mode for all packages
pnpm test               # Run vitest workspace (943 tests)
pnpm test:coverage      # Coverage reports
pnpm lint / lint:fix    # ESLint all packages
pnpm typecheck          # TypeScript check all

# Per-package work (in packages/*/):
cd packages/core && pnpm build    # Build single package
pnpm -r --filter core build       # Or from root
```

### Build System
- **tsup** generates dual ESM/CJS builds (`dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`)
- **vitest.workspace.ts** consolidates test config for all packages
- Tests live in both `tests/*.test.ts` AND `src/**/__tests__/*.test.ts` (core, tools use both)

### Package Linking
```bash
# Local development with unpublished changes
pnpm install                           # Workspace auto-links packages
pnpm -r build                          # Always rebuild before testing cross-package
```

## Code Conventions

### Logging (CRITICAL - follow strictly)
Use hierarchical logger names for filtering. **Never use `console.log`**.

```typescript
// patterns package
import { createPatternLogger } from '@agentforge/patterns';
const logger = createPatternLogger('agentforge:patterns:react:action');

// core package  
import { createLogger } from '@agentforge/core';
const logger = createLogger('agentforge:core:tools:registry');

// Log levels: debug (detailed), info (milestones), warn (recoverable), error (failures)
logger.debug('Processing iteration', { iteration: 3, toolsExecuted: 1 });
logger.info('Agent invocation complete', { duration: 1234, success: true });
```

Format: `agentforge:<package>:<module>:<component>` (see docs/LOGGING_STANDARDS.md)

### Tool Creation (Fluent Builder API)
```typescript
import { createToolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const tool = createToolBuilder()
  .name('my-tool')                     // kebab-case
  .description('Clear description')
  .category(ToolCategory.FILE_SYSTEM)  // Use enum
  .tags(['file', 'read'])
  .schema(z.object({
    path: z.string().describe('Path to file')  // .describe() for prompt gen
  }))
  .implement(async ({ path }) => {
    // Implementation with proper error handling
  })
  .build();
```

### State Management (LangGraph)
All patterns use `Annotation.Root()` for LangGraph state:
```typescript
import { Annotation } from '@langchain/langgraph';

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,     // Append messages
    default: () => [],
  }),
  iterations: Annotation<number>({
    reducer: (_, y) => y,              // Replace value
    default: () => 0,
  }),
});
```

### TypeScript Configuration
- Base config: `tsconfig.base.json` (ES2022, NodeNext, strict mode)
- Each package extends base with package-specific overrides
- **Always use `.js` extensions in imports** (ESM requirement): `import { x } from './foo.js'`

## Known Issues & Patterns

### Testing Patterns
```typescript
import { describe, it, expect } from 'vitest';
import { createMockLLM, createMockTool, createStateBuilder } from '@agentforge/testing';

// Use testing package utilities
const mockLLM = createMockLLM({ responses: ['Test response'] });
const mockTool = createMockTool({ name: 'test', returns: 'result' });
const state = createStateBuilder().messages([...]).build();
```

### Common Pitfalls
- **DON'T** run `pnpm install` in individual packages (breaks workspace linking)
- **DON'T** use `console.log` - use logger (see docs/LOGGING_STANDARDS.md)
- **DO** rebuild packages after changes: `pnpm -r build` or individual `pnpm build`
- **DO** use `.js` in imports even for `.ts` files (ESM/NodeNext requirement)
- **DO** run tests from root (`pnpm test`) to use workspace config

## Key Files

- **Architecture**: docs/FRAMEWORK_DESIGN.md - Design decisions, component overview
- **Monorepo**: docs/MONOREPO_SETUP.md - Workspace structure, build system
- **Learning**: docs/CODEBASE_LEARNING_GUIDE.md - Structured onboarding
- **Logging**: docs/LOGGING_STANDARDS.md - Logger naming, levels, examples
- **Release Process**: RELEASE_CHECKLIST.md - Step-by-step release checklist
- **Examples**: `packages/*/examples/`, `examples/applications/` - Working implementations

## Optional AI Assistant Files (Local, Not Git-Tracked)

The `.ai/` folder may contain additional process documentation for AI assistants. **This folder is gitignored and may not exist in all clones.** If present, it contains:

- **`.ai/RELEASE_PROCESS.md`** - Detailed release process guide for AI assistants (when asked to "do a release")
  - Step-by-step instructions with script locations
  - Task management templates
  - Common mistakes to avoid
  - Quick checklists for validation
- **`.ai/PROJECT_OVERVIEW.md`** - High-level project context
- **`.ai/LOGGING_STRATEGY.md`** - Logging implementation strategy

**When referencing these files**: Always check if they exist first. If missing, fall back to the git-tracked documentation in `docs/` and `RELEASE_CHECKLIST.md`.

## External Dependencies

- **@langchain/core**: BaseMessage types, RunnableConfig
- **@langchain/langgraph**: StateGraph, Annotation, MemorySaver
- **zod**: Schema validation (all tool inputs use Zod schemas)
- **tsup**: Build tool (replaces tsc, handles dual ESM/CJS)
- **vitest**: Test runner (workspace mode)
