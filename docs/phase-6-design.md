# Phase 6: Developer Experience - Design Document

**Duration**: 14 days  
**Status**: 🚧 In Progress  
**Goal**: Create world-class developer experience with CLI tools, testing utilities, standard tools, documentation, and templates

---

## Overview

Phase 6 focuses on making AgentForge the most developer-friendly agent framework by providing:
- **CLI Tool** (`@agentforge/cli`) - Project scaffolding and management
- **Testing Utilities** (`@agentforge/testing`) - Comprehensive testing helpers
- **Standard Tools** (`@agentforge/tools`) - Pre-built, production-ready tools
- **Documentation Site** - Interactive docs with examples
- **Project Templates** - Quick-start templates for common use cases

---

## Phase 6.1: CLI Tool (`@agentforge/cli`)

**Duration**: 4 days  
**Tests**: 28 tests

### Package Structure

```
packages/cli/
├── src/
│   ├── commands/
│   │   ├── create.ts          # Project scaffolding
│   │   ├── dev.ts              # Development server
│   │   ├── build.ts            # Production build
│   │   ├── test.ts             # Test runner
│   │   ├── lint.ts             # Linter
│   │   ├── agent/
│   │   │   ├── create.ts       # Create agent
│   │   │   ├── list.ts         # List agents
│   │   │   ├── test.ts         # Test agent
│   │   │   └── deploy.ts       # Deploy agent
│   │   └── tool/
│   │       ├── create.ts       # Create tool
│   │       ├── list.ts         # List tools
│   │       ├── test.ts         # Test tool
│   │       └── publish.ts      # Publish tool
│   ├── templates/
│   │   ├── project/            # Project templates
│   │   ├── agent/              # Agent templates
│   │   └── tool/               # Tool templates
│   ├── utils/
│   │   ├── prompts.ts          # Interactive prompts
│   │   ├── logger.ts           # CLI logger
│   │   ├── git.ts              # Git utilities
│   │   └── package-manager.ts  # npm/pnpm/yarn detection
│   └── index.ts
├── bin/
│   └── agentforge.js           # CLI entry point
├── package.json
└── tsconfig.json
```

### 6.1.1 Project Scaffolding (8 tests)

**Command**: `agentforge create <project-name>`

**Features**:
- Interactive project setup wizard
- Template selection (minimal, full-featured, api-service, cli-tool)
- Package manager detection (npm, pnpm, yarn)
- Dependency installation
- Git initialization
- TypeScript configuration
- Environment file creation

**Templates**:
1. **Minimal Starter** - Basic ReAct agent
2. **Full-Featured App** - Multi-agent system with all features
3. **API Service** - Express/Fastify API with agents
4. **CLI Tool** - Command-line agent application

**Tests**:
- Template rendering
- Dependency installation
- Git initialization
- Package manager detection
- Interactive prompts
- Error handling
- File creation
- Configuration generation

### 6.1.2 Development Commands (8 tests)

**Commands**:
- `agentforge dev` - Start development server with hot reload
- `agentforge build` - Build for production
- `agentforge test` - Run tests with coverage
- `agentforge lint` - Lint and format code

**Features**:
- Hot reload with file watching
- TypeScript compilation
- Environment variable loading
- Error reporting
- Build optimization
- Test coverage reporting
- Auto-fix linting issues

**Tests**:
- Dev server startup
- Hot reload functionality
- Build process
- Test execution
- Lint execution
- Error handling
- Configuration loading
- Watch mode

### 6.1.3 Agent Management (6 tests)

**Commands**:
- `agentforge agent:create <name>` - Create new agent
- `agentforge agent:list` - List all agents
- `agentforge agent:test <name>` - Test specific agent
- `agentforge agent:deploy <name>` - Deploy agent

**Features**:
- Agent template selection (ReAct, Plan-Execute, Reflection, Multi-Agent)
- Interactive configuration
- Test generation
- Deployment configuration
- Agent registry

**Tests**:
- Agent creation
- Template rendering
- Agent listing
- Agent testing
- Deployment configuration
- Error handling

### 6.1.4 Tool Management (6 tests)

**Commands**:
- `agentforge tool:create <name>` - Create new tool
- `agentforge tool:list` - List all tools
- `agentforge tool:test <name>` - Test specific tool
- `agentforge tool:publish <name>` - Publish tool to registry

**Features**:
- Tool template generation
- Schema definition wizard
- Test generation
- Documentation generation
- Publishing to npm

**Tests**:
- Tool creation
- Template rendering
- Tool listing
- Tool testing
- Publishing process
- Error handling

---

## Phase 6.2: Testing Utilities (`@agentforge/testing`)

**Duration**: 3 days  
**Tests**: 24 tests

### Package Structure

```
packages/testing/
├── src/
│   ├── helpers/
│   │   ├── mock-llm.ts         # Mock LLM factory
│   │   ├── mock-tool.ts        # Mock tool factory
│   │   ├── state-builder.ts    # State builders
│   │   └── assertions.ts       # Custom assertions
│   ├── fixtures/
│   │   ├── agents.ts           # Sample agents
│   │   ├── tools.ts            # Sample tools
│   │   ├── conversations.ts    # Sample conversations
│   │   └── data.ts             # Sample data
│   ├── runners/
│   │   ├── agent-runner.ts     # Agent test runner
│   │   ├── conversation.ts     # Conversation simulator
│   │   ├── performance.ts      # Performance testing
│   │   └── snapshot.ts         # Snapshot testing
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 6.2.1 Test Helpers (10 tests)

**Mock LLM Factory**:
```typescript
createMockLLM(options?: {
  responses?: string[];
  delay?: number;
  error?: Error;
  streaming?: boolean;
}): BaseChatModel
```

**Mock Tool Factory**:
```typescript
createMockTool(options: {
  name: string;
  description: string;
  schema: z.ZodSchema;
  response?: any;
  delay?: number;
  error?: Error;
}): Tool
```

**State Builders**:
```typescript
buildReActState(overrides?: Partial<ReActState>): ReActState
buildPlanExecuteState(overrides?: Partial<PlanExecuteState>): PlanExecuteState
buildReflectionState(overrides?: Partial<ReflectionState>): ReflectionState
buildMultiAgentState(overrides?: Partial<MultiAgentState>): MultiAgentState
```

**Assertion Helpers**:
```typescript
expectAgentToRespond(agent: CompiledGraph, input: string): Promise<void>
expectToolToBeCalled(tool: Tool, times?: number): void
expectStateToMatch(state: any, expected: Partial<any>): void
expectStreamToEmit(stream: AsyncIterable, events: string[]): Promise<void>
```

**Tests**:
- Mock LLM creation and responses
- Mock tool creation and execution
- State builder functionality
- Custom assertions
- Streaming mock support
- Error simulation
- Delay simulation
- Response sequencing
- Type safety
- Integration with Vitest

### 6.2.2 Test Fixtures (6 tests)

**Sample Agents**:
- Simple ReAct agent
- Plan-Execute agent
- Reflection agent
- Multi-agent system

**Sample Tools**:
- Calculator tool
- Search tool
- File tool
- API tool

**Sample Conversations**:
- Single-turn conversation
- Multi-turn conversation
- Error handling conversation
- Tool usage conversation

**Sample Data**:
- User messages
- Agent responses
- Tool results
- State snapshots

**Tests**:
- Fixture loading
- Fixture validation
- Fixture customization
- Fixture serialization
- Fixture composition
- Error handling

### 6.2.3 Integration Testing (8 tests)

**Agent Test Runner**:
```typescript
runAgentTest(agent: CompiledGraph, options: {
  input: string;
  expectedOutput?: string | RegExp;
  expectedTools?: string[];
  maxSteps?: number;
  timeout?: number;
}): Promise<TestResult>
```

**Conversation Simulator**:
```typescript
simulateConversation(agent: CompiledGraph, turns: ConversationTurn[]): Promise<ConversationResult>
```

**Performance Testing**:
```typescript
measurePerformance(fn: () => Promise<void>, options?: {
  iterations?: number;
  warmup?: number;
}): Promise<PerformanceMetrics>
```

**Snapshot Testing**:
```typescript
expectAgentSnapshot(agent: CompiledGraph, input: string): Promise<void>
updateSnapshots(): void
```

**Tests**:
- Agent test runner execution
- Conversation simulation
- Performance measurement
- Snapshot creation and comparison
- Timeout handling
- Error reporting
- Metrics collection
- Test isolation

---

## Phase 6.3: Standard Tools (`@agentforge/tools`)

**Duration**: 3 days
**Tests**: 28 tests

### Package Structure

```
packages/tools/
├── src/
│   ├── web/
│   │   ├── http-client.ts      # HTTP requests
│   │   ├── scraper.ts          # Web scraping
│   │   ├── html-parser.ts      # HTML parsing
│   │   └── url-validator.ts    # URL validation
│   ├── data/
│   │   ├── json.ts             # JSON processing
│   │   ├── csv.ts              # CSV parsing
│   │   ├── xml.ts              # XML parsing
│   │   └── transformer.ts      # Data transformation
│   ├── file/
│   │   ├── reader.ts           # File reading
│   │   ├── writer.ts           # File writing
│   │   ├── scanner.ts          # Directory scanning
│   │   └── archive.ts          # Archive handling
│   ├── utility/
│   │   ├── calculator.ts       # Math operations
│   │   ├── datetime.ts         # Date/time utilities
│   │   ├── string.ts           # String utilities
│   │   └── validator.ts        # Validation utilities
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 6.3.1 Web Tools (8 tests)

**HTTP Client**:
```typescript
createHttpTool(options?: {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
}): Tool
```

**Web Scraper**:
```typescript
createScraperTool(options?: {
  userAgent?: string;
  timeout?: number;
  maxRetries?: number;
}): Tool
```

**HTML Parser**:
```typescript
createHtmlParserTool(): Tool
```

**URL Validator**:
```typescript
createUrlValidatorTool(): Tool
```

**Tests**:
- HTTP GET/POST/PUT/DELETE requests
- Web scraping with cheerio
- HTML parsing and extraction
- URL validation
- Error handling
- Timeout handling
- Retry logic
- Response parsing

### 6.3.2 Data Tools (8 tests)

**JSON Processor**:
```typescript
createJsonTool(): Tool
```

**CSV Parser**:
```typescript
createCsvTool(options?: {
  delimiter?: string;
  headers?: boolean;
}): Tool
```

**XML Parser**:
```typescript
createXmlTool(): Tool
```

**Data Transformer**:
```typescript
createTransformerTool(): Tool
```

**Tests**:
- JSON parsing and stringification
- CSV parsing and generation
- XML parsing and generation
- Data transformation (map, filter, reduce)
- Schema validation
- Error handling
- Large file handling
- Streaming support

### 6.3.3 File Tools (6 tests)

**File Reader/Writer**:
```typescript
createFileReaderTool(): Tool
createFileWriterTool(): Tool
```

**Directory Scanner**:
```typescript
createDirectoryScannerTool(options?: {
  recursive?: boolean;
  pattern?: string;
}): Tool
```

**File Search**:
```typescript
createFileSearchTool(): Tool
```

**Archive Handler**:
```typescript
createArchiveTool(): Tool
```

**Tests**:
- File reading and writing
- Directory scanning
- File search with patterns
- Archive creation and extraction
- Permission handling
- Error handling

### 6.3.4 Utility Tools (6 tests)

**Calculator**:
```typescript
createCalculatorTool(): Tool
```

**Date/Time Utilities**:
```typescript
createDateTimeTool(): Tool
```

**String Utilities**:
```typescript
createStringTool(): Tool
```

**Validation Utilities**:
```typescript
createValidatorTool(): Tool
```

**Tests**:
- Math operations
- Date/time parsing and formatting
- String manipulation
- Validation (email, phone, etc.)
- Error handling
- Type safety

---

## Phase 6.4: Documentation & Tutorials

**Duration**: 2 days

### 6.4.1 Documentation Site

**Technology Stack**:
- VitePress or Docusaurus
- TypeScript
- Vue/React components
- Algolia search

**Structure**:
```
docs-site/
├── .vitepress/
│   ├── config.ts
│   └── theme/
├── guide/
│   ├── getting-started.md
│   ├── installation.md
│   ├── quick-start.md
│   └── concepts/
├── api/
│   ├── core.md
│   ├── patterns.md
│   ├── cli.md
│   ├── testing.md
│   └── tools.md
├── examples/
│   ├── react-agent.md
│   ├── plan-execute.md
│   ├── reflection.md
│   └── multi-agent.md
├── tutorials/
│   ├── first-agent.md
│   ├── custom-tools.md
│   ├── production-deployment.md
│   └── advanced-patterns.md
└── index.md
```

**Features**:
- Interactive code examples
- Live playground
- API reference with TypeScript types
- Search functionality
- Dark/light mode
- Mobile responsive
- Copy-to-clipboard
- Syntax highlighting

### 6.4.2 Interactive Tutorials

**Getting Started Tutorial** (5 min):
1. Installation
2. Create first project
3. Run example agent
4. Customize agent
5. Deploy to production

**Building Your First Agent** (15 min):
1. Understanding agent patterns
2. Creating a ReAct agent
3. Adding custom tools
4. Testing the agent
5. Handling errors
6. Adding middleware

**Advanced Patterns** (20 min):
1. Plan-Execute pattern
2. Reflection pattern
3. Multi-agent coordination
4. Custom patterns
5. Performance optimization

**Production Deployment** (15 min):
1. Environment configuration
2. Docker deployment
3. Kubernetes deployment
4. Monitoring and observability
5. Scaling strategies

### 6.4.3 Video Tutorials

**Quick Start** (5 min):
- Installation and setup
- First agent creation
- Running and testing

**Deep Dive** (30 min):
- Framework architecture
- All agent patterns
- Tool system
- Middleware system
- Production features

**Best Practices** (15 min):
- Code organization
- Error handling
- Testing strategies
- Performance optimization
- Security considerations

**Troubleshooting** (10 min):
- Common errors
- Debugging techniques
- Performance issues
- Deployment problems

---

## Phase 6.5: Project Templates & Examples

**Duration**: 2 days

### 6.5.1 Project Templates

**Minimal Starter**:
```
template-minimal/
├── src/
│   ├── agent.ts
│   ├── tools.ts
│   └── index.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

**Full-Featured App**:
```
template-full/
├── src/
│   ├── agents/
│   ├── tools/
│   ├── middleware/
│   ├── config/
│   └── index.ts
├── tests/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

**API Service**:
```
template-api/
├── src/
│   ├── routes/
│   ├── agents/
│   ├── middleware/
│   └── server.ts
├── tests/
├── .env.example
├── package.json
└── README.md
```

**CLI Tool**:
```
template-cli/
├── src/
│   ├── commands/
│   ├── agents/
│   └── cli.ts
├── bin/
├── package.json
└── README.md
```

### 6.5.2 Example Applications

**Research Assistant**:
- Multi-step research workflow
- Web scraping and data extraction
- Report generation
- Citation management

**Code Reviewer**:
- Code analysis
- Best practices checking
- Security scanning
- Automated suggestions

**Data Analyst**:
- Data loading and cleaning
- Statistical analysis
- Visualization generation
- Report creation

**Customer Support Bot**:
- Multi-agent coordination
- Knowledge base integration
- Ticket management
- Escalation handling

### 6.5.3 Integration Examples

**Express.js Integration**:
```typescript
import express from 'express';
import { createReActAgent } from '@agentforge/patterns';

const app = express();
const agent = createReActAgent({ /* ... */ });

app.post('/chat', async (req, res) => {
  const result = await agent.invoke({ input: req.body.message });
  res.json(result);
});
```

**Next.js Integration**:
```typescript
// app/api/chat/route.ts
import { createReActAgent } from '@agentforge/patterns';

const agent = createReActAgent({ /* ... */ });

export async function POST(request: Request) {
  const { message } = await request.json();
  const result = await agent.invoke({ input: message });
  return Response.json(result);
}
```

**Fastify Integration**:
```typescript
import Fastify from 'fastify';
import { createReActAgent } from '@agentforge/patterns';

const fastify = Fastify();
const agent = createReActAgent({ /* ... */ });

fastify.post('/chat', async (request, reply) => {
  const result = await agent.invoke({ input: request.body.message });
  return result;
});
```

**NestJS Integration**:
```typescript
import { Injectable } from '@nestjs/common';
import { createReActAgent } from '@agentforge/patterns';

@Injectable()
export class AgentService {
  private agent = createReActAgent({ /* ... */ });

  async chat(message: string) {
    return this.agent.invoke({ input: message });
  }
}
```

---

## Success Metrics

### Phase 6.1 (CLI)
- ✅ Project creation in <30 seconds
- ✅ All templates working out-of-the-box
- ✅ Hot reload in <1 second
- ✅ 28 tests passing

### Phase 6.2 (Testing)
- ✅ Easy mock creation
- ✅ Comprehensive fixtures
- ✅ Fast test execution
- ✅ 24 tests passing

### Phase 6.3 (Tools)
- ✅ 20+ production-ready tools
- ✅ Full TypeScript support
- ✅ Comprehensive documentation
- ✅ 28 tests passing

### Phase 6.4 (Documentation)
- ✅ Interactive examples
- ✅ Fast search (<100ms)
- ✅ Mobile responsive
- ✅ Video tutorials

### Phase 6.5 (Templates)
- ✅ 4+ project templates
- ✅ 4+ example applications
- ✅ 4+ integration examples
- ✅ All templates tested

---

## Deliverables

- `@agentforge/cli` v0.1.0 with full project management
- `@agentforge/testing` v0.1.0 with comprehensive test utilities
- `@agentforge/tools` v0.1.0 with 20+ standard tools
- 80+ tests (28 CLI + 24 testing + 28 tools)
- Interactive documentation site
- 4+ project templates
- 4+ example applications
- 4+ integration examples
- Video tutorials
- 1500+ lines of documentation

---

## Implementation Order

1. **Week 1** (Days 1-7):
   - Day 1-2: Phase 6.1.1 & 6.1.2 (CLI scaffolding and dev commands)
   - Day 3-4: Phase 6.1.3 & 6.1.4 (Agent and tool management)
   - Day 5-7: Phase 6.2 (Testing utilities)

2. **Week 2** (Days 8-14):
   - Day 8-10: Phase 6.3 (Standard tools)
   - Day 11-12: Phase 6.4 (Documentation site)
   - Day 13-14: Phase 6.5 (Templates and examples)

---

## Dependencies

### External Packages

**CLI**:
- `commander` - CLI framework
- `inquirer` - Interactive prompts
- `chalk` - Terminal colors
- `ora` - Spinners
- `execa` - Process execution
- `fs-extra` - File system utilities

**Testing**:
- `vitest` - Test framework
- `@vitest/ui` - Test UI
- `c8` - Coverage

**Tools**:
- `axios` - HTTP client
- `cheerio` - HTML parsing
- `csv-parse` - CSV parsing
- `fast-xml-parser` - XML parsing
- `archiver` - Archive creation
- `unzipper` - Archive extraction

**Documentation**:
- `vitepress` - Documentation site
- `@algolia/client-search` - Search
- `shiki` - Syntax highlighting

---

## Notes

- All packages will be published to npm
- CLI will be available as `npx @agentforge/cli` or `agentforge`
- Testing utilities will integrate seamlessly with Vitest
- Standard tools will be tree-shakeable
- Documentation site will be hosted on Vercel/Netlify
- Templates will be available via `agentforge create`
- All code will have 100% TypeScript coverage
- All packages will support ESM and CJS


