# Changelog

All notable changes to AgentForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-01-27

### Added
- **Agent Builder Utility** - New shared utility for consistent StateGraph creation across agent patterns
  - Located in `packages/patterns/src/shared/agent-builder.ts`
  - Provides `createAgentGraph()` function with standardized configuration
  - Eliminates boilerplate code in agent pattern implementations
  - Consistent error handling and state management

- **`implementSafe()` Method for ToolBuilder** - Automatic error handling for tools
  - New method on ToolBuilder that wraps tool implementation in try-catch
  - Automatically returns `{ success: boolean; data?: T; error?: string }` format
  - Eliminates manual error handling boilerplate in tool implementations
  - Type-safe error responses with full TypeScript support
  - Example:
    ```typescript
    const tool = toolBuilder()
      .name('read-file')
      .schema(z.object({ path: z.string() }))
      .implementSafe(async ({ path }) => {
        return await fs.readFile(path, 'utf-8');
      })
      .build();
    // Result: { success: true, data: "file content" }
    // Or on error: { success: false, error: "ENOENT: no such file..." }
    ```

### Changed
- **Refactored 14 Tools to Use `implementSafe()`** - Eliminated 116 lines of boilerplate code
  - **File Operations (8 tools)**: directoryList, directoryCreate, directoryDelete, fileSearch, fileReader, fileWriter, fileAppend, fileDelete
  - **Web Tools (1 tool)**: urlValidator (also updated UrlValidationResult interface)
  - **Data Tools (4 tools)**: jsonParser, jsonStringify, jsonQuery, jsonValidator
  - All tools now use consistent error handling pattern
  - Cleaner, more maintainable code focused on business logic

- **Consolidated Vitest Configurations** - Workspace-level test configuration
  - Created `vitest.workspace.ts` at repository root
  - Removed 4 duplicate package-level vitest configurations
  - Properly excludes CLI template tests (78 tests that shouldn't run in workspace)
  - All 935 tests passing (84 test files)

### Fixed
- **DRY Violations Eliminated** - Completed comprehensive DRY remediation plan
  - Phase 1: Removed ReAct pattern duplication (~2,300 lines)
  - Phase 2: Created shared utilities for error handling and state fields (~145 lines)
  - Phase 3: Advanced refactoring with builder utilities (~176 lines)
  - **Total: ~2,621 lines of duplicate code eliminated**
  - Improved maintainability and developer experience
  - Zero breaking changes for users

### Published
- All packages published to npm registry at version 0.7.0:
  - @agentforge/core@0.7.0
  - @agentforge/patterns@0.7.0
  - @agentforge/tools@0.7.0
  - @agentforge/testing@0.7.0
  - @agentforge/cli@0.7.0

## [0.6.4] - 2026-01-24

### Added
- **Comprehensive Structured Logging System** - Complete systematic implementation of hierarchical logging across the entire AgentForge framework
  - Created 15 dedicated loggers across patterns and core components using consistent naming convention: `agentforge:<package>:<module>:<component>`
  - Replaced 41 console.log/error calls with structured logging using appropriate log levels (DEBUG, INFO, WARN, ERROR)
  - Enhanced Logger interface with `isDebugEnabled()` and `isLevelEnabled()` methods for performance optimization
  - All 322 tests passing (Patterns: 204, Tools: 118) with zero breaking changes

**Pattern Logging:**
- **ReAct Pattern**: 3 loggers (reasoning, action, observation) - 8 instances migrated
- **Reflection Pattern**: 3 loggers (generator, reflector, reviser) - 11 instances migrated
- **Plan-Execute Pattern**: 3 loggers (planner, executor, replanner) - enhanced logging
- **Multi-Agent Pattern**: 1 logger (nodes) - 16 instances migrated

**Core Components:**
- **Monitoring/Alerts**: 4 console.log instances migrated to structured logging
- **Tool Registry/Lifecycle**: 2 console.error instances migrated to structured logging

**Documentation:**
- Created `DEBUGGING_GUIDE.md` - comprehensive debugging reference with pattern-specific sections
- Created `LOGGING_STANDARDS.md` - official logging standards and best practices
- Created `LOGGING_EXAMPLES.md` - concrete code examples for all patterns
- Updated all 4 pattern documentation files with structured logging sections
- Created `CONSOLE_LOGGING_AUDIT.md` - complete audit of all console.log usage
- Created `LOGGING_STRATEGY.md` - 5-phase implementation strategy (100% complete)

**Benefits:**
- Consistent, hierarchical logging across all patterns and core components
- Fine-grained control via LOG_LEVEL environment variable (DEBUG, INFO, WARN, ERROR)
- Performance-optimized with level checking to avoid unnecessary string operations
- Backward compatible - existing verbose parameters still work (deprecated but functional)
- Better debugging experience with pattern-specific log filtering

**Example Usage:**
```bash
# Enable debug logging for all patterns
LOG_LEVEL=DEBUG node your-agent.js

# Enable debug logging for specific pattern
LOG_LEVEL=DEBUG DEBUG=agentforge:patterns:react:* node your-agent.js

# Enable debug logging for specific component
LOG_LEVEL=DEBUG DEBUG=agentforge:patterns:react:reasoning node your-agent.js
```

### Fixed
- **Release Script Bug** - Fixed root package.json not being updated during releases
  - Added root `package.json` to PACKAGE_FILES array in `scripts/release.sh`
  - Ensures version consistency across all package files

### Published
- All packages published to npm registry at version 0.6.4:
  - @agentforge/core@0.6.4
  - @agentforge/patterns@0.6.4
  - @agentforge/tools@0.6.4
  - @agentforge/testing@0.6.4
  - @agentforge/cli@0.6.4

## [0.6.3] - 2026-01-23

### Added
- **Parallel Routing in Multi-Agent Pattern** - Route queries to multiple agents simultaneously for comprehensive answers
  - Enhanced `RoutingDecisionSchema` to support both `targetAgent` (single) and `targetAgents` (array) fields
  - Updated LLM-based routing to handle structured output and select multiple target agents
  - Modified supervisor node to create multiple `TaskAssignment` objects for parallel execution
  - Enhanced supervisor router to detect comma-separated agent IDs and return arrays for LangGraph parallel execution
  - Removed state update conflicts from worker nodes (`currentAgent`, `status`) to enable parallel execution
  - Simplified worker router to always return 'supervisor' for cleaner state management
  - Added comprehensive documentation with examples, execution flow diagrams, and best practices
  - Fully backward compatible - existing systems continue to work with single-agent routing

**Benefits:**
- Comprehensive answers combining insights from multiple specialists
- Faster execution through parallel processing instead of sequential routing
- Better coverage of complex queries requiring multiple perspectives
- Intelligent aggregation of results from multiple agents

**Example Use Cases:**
- Code + Security: "Are there security issues in the auth module?"
- Code + Documentation: "How does authentication work?"
- Legal + HR: "What are compliance requirements for employee data?"

### Published
- All packages published to npm registry at version 0.6.3:
  - @agentforge/core@0.6.3
  - @agentforge/patterns@0.6.3
  - @agentforge/tools@0.6.3
  - @agentforge/testing@0.6.3
  - @agentforge/cli@0.6.3

## [0.6.3] - 2026-01-23

### Added
- **Parallel Routing in Multi-Agent Pattern** - Route queries to multiple agents simultaneously for comprehensive answers
  - Enhanced `RoutingDecisionSchema` to support both `targetAgent` (single) and `targetAgents` (array) fields
  - Updated LLM-based routing to handle structured output and select multiple target agents
  - Modified supervisor node to create multiple `TaskAssignment` objects for parallel execution
  - Enhanced supervisor router to detect comma-separated agent IDs and return arrays for LangGraph parallel execution
  - Removed state update conflicts from worker nodes (`currentAgent`, `status`) to enable parallel execution
  - Simplified worker router to always return 'supervisor' for cleaner state management
  - Added comprehensive documentation with examples, execution flow diagrams, and best practices
  - Fully backward compatible - existing systems continue to work with single-agent routing

**Benefits:**
- Comprehensive answers combining insights from multiple specialists
- Faster execution through parallel processing instead of sequential routing
- Better coverage of complex queries requiring multiple perspectives
- Intelligent aggregation of results from multiple agents

**Example Use Cases:**
- Code + Security: "Are there security issues in the auth module?"
- Code + Documentation: "How does authentication work?"
- Legal + HR: "What are compliance requirements for employee data?"

### Published
- All packages published to npm registry at version 0.6.3:
  - @agentforge/core@0.6.3
  - @agentforge/patterns@0.6.3
  - @agentforge/tools@0.6.3
  - @agentforge/testing@0.6.3
  - @agentforge/cli@0.6.3

## [0.6.2] - 2026-01-23

### Fixed
- **Plan-Execute Pattern Interrupt Handling** - Fixed GraphInterrupt propagation in Plan-Execute pattern
  - Added GraphInterrupt detection and re-throw logic to executor node (`@agentforge/patterns`)
  - Ensures `askHuman` tool works correctly in Plan-Execute agents
  - Completes interrupt handling coverage across all agent patterns that execute tools
  - Now all patterns support human-in-the-loop workflows: ReAct, Multi-Agent, and Plan-Execute

### Published
- All packages published to npm registry at version 0.6.2:
  - @agentforge/core@0.6.2
  - @agentforge/patterns@0.6.2
  - @agentforge/tools@0.6.2
  - @agentforge/testing@0.6.2
  - @agentforge/cli@0.6.2

## [0.6.1] - 2026-01-22

### Fixed
- **askHuman Tool Interrupt Handling** - Fixed GraphInterrupt propagation for proper human-in-the-loop workflows
  - Fixed GraphInterrupt propagation in ReAct action nodes (`@agentforge/core`)
  - Fixed GraphInterrupt propagation in multi-agent worker nodes (`@agentforge/patterns`)
  - Added config parameter to `executeFn` for LangGraph runtime configuration support
  - Ensures `interrupt()` errors bubble up correctly through all execution layers
  - Added detailed code comments explaining GraphInterrupt handling

### Changed
- **Internal Logging** - Replaced console.log debug statements with structured logging
  - Implemented structured logging in askHuman tool with debug-level logs
  - Implemented structured logging in multi-agent utils with debug/error levels
  - Added LOG_LEVEL environment variable support (debug, info, warn, error)
  - Improves production observability and debugging capabilities

### Documentation
- **Logging API Documentation** - Added comprehensive documentation for existing logger API
  - Added `createLogger` and `LogLevel` documentation to Core API reference
  - Updated monitoring guide to show built-in logger as primary option
  - Updated deployment guide to show built-in logger as recommended option
  - Documented LOG_LEVEL environment variable usage
  - Showed Winston as alternative for advanced logging needs (file rotation, remote logging)

### Published
- All packages published to npm registry at version 0.6.1:
  - @agentforge/core@0.6.1
  - @agentforge/patterns@0.6.1
  - @agentforge/tools@0.6.1
  - @agentforge/testing@0.6.1
  - @agentforge/cli@0.6.1

## [0.6.0] - 2026-01-22

### Added

#### Tool-Enabled Supervisor (@agentforge/patterns)
- **Supervisor Tools for Multi-Agent Pattern** - Supervisors can now use tools during routing decisions
  - Added optional `tools` parameter to `SupervisorConfig` for tool-enabled routing
  - Added `maxToolRetries` parameter to control tool call retry attempts (default: 3)
  - Supervisors can gather additional information before routing tasks to workers
  - Enables human-in-the-loop workflows with `askHuman` tool in supervisor
  - Automatic tool call detection and execution in routing logic
  - Conversation history tracking across tool calls for context preservation
  - Full backward compatibility - tools are optional
  - 11 new unit tests for routing with tools
  - 3 new integration tests for system configuration
  - **Total Test Count**: 1046 tests passing (up from 1032)

#### Examples
- **New Multi-Agent Example** - `05-supervisor-with-askhuman.ts`
  - Demonstrates supervisor using `askHuman` tool for ambiguous requests
  - Shows clear vs. ambiguous request handling
  - Best practices for tool-enabled supervisors

### Changed

#### Documentation
- **Terminology Update** - Standardized on "vertical agents" terminology
  - Renamed "reusable agents" to "vertical agents" (industry-standard term)
  - Updated all documentation, examples, and navigation
  - Renamed `examples/reusable-agents/` → `examples/vertical-agents/`
  - Renamed docs guide: `reusable-agents.md` → `vertical-agents.md`
  - Updated CLI templates and references
  - Maintained backward compatibility with 'reusable-agent' keyword for discoverability
  - Improves clarity and aligns with common industry terminology

- **Multi-Agent Pattern Documentation** - Enhanced with tool-enabled supervisor section
  - Comprehensive examples and best practices
  - Updated both package docs and docs-site
  - New feature documentation: `docs/FEATURE_TOOL_ENABLED_SUPERVISOR.md`

- **Test Count Updates** - Updated test counts across all documentation
  - README.md: Updated badge and metrics to show 1046 tests
  - All documentation now reflects current test coverage

### Published
- All packages published to npm registry at version 0.6.0:
  - @agentforge/core@0.6.0
  - @agentforge/patterns@0.6.0 (includes tool-enabled supervisor)
  - @agentforge/tools@0.6.0
  - @agentforge/testing@0.6.0
  - @agentforge/cli@0.6.0

## [0.5.4] - 2026-01-21

### Added

#### Checkpointer Support (@agentforge/patterns)
- **Checkpointer Support Across All Patterns** - Enable state persistence and human-in-the-loop workflows
  - Added optional `checkpointer` parameter to all 4 agent patterns:
    - `createReActAgent()` - ReAct pattern with checkpointing
    - `createPlanExecuteAgent()` - Plan-Execute pattern with checkpointing
    - `createReflectionAgent()` - Reflection pattern with checkpointing
    - `createMultiAgentSystem()` - Multi-Agent pattern with checkpointing
  - Fully backward compatible - checkpointer is optional
  - Enables askHuman tool usage with all patterns
  - Enables conversation continuity and state persistence
  - Enables LangGraph interrupts for human-in-the-loop workflows
  - 4 new tests for checkpointer support (2 ReAct + 2 Multi-Agent)
  - Updated JSDoc examples showing checkpointer usage with MemorySaver
  - **Total Test Count**: 1032 tests passing (up from 1028)

### Changed

#### Documentation
- **Test Count Updates** - Updated test counts across all documentation
  - README.md: Updated badge and metrics to show 1032 tests
  - docs/ROADMAP.md: Updated test count to 1032 tests
  - All documentation now reflects current test coverage

### Published
- All packages published to npm registry at version 0.5.4:
  - @agentforge/core@0.5.4
  - @agentforge/patterns@0.5.4
  - @agentforge/tools@0.5.4
  - @agentforge/testing@0.5.4
  - @agentforge/cli@0.5.4

## [0.5.3] - 2026-01-21

### Fixed

#### CLI Template (@agentforge/cli)
- **Reusable Agent Template tsconfig.json** - Fixed incorrect TypeScript configuration
  - Removed invalid `extends` path to non-existent `tsconfig.base.json`
  - Added full standalone compiler options (templates should be self-contained)
  - Fixed `rootDir` from `./src` to `.` (template files are at root level)
  - Fixed `include` from `src/**/*` to `.` (no src directory in template)
  - Template now matches pattern used in other CLI templates (minimal, full, etc.)
  - Resolves TypeScript errors when opening template in IDE

### Published
- All packages published to npm registry at version 0.5.3:
  - @agentforge/core@0.5.3
  - @agentforge/patterns@0.5.3
  - @agentforge/tools@0.5.3
  - @agentforge/testing@0.5.3
  - @agentforge/cli@0.5.3

## [0.5.2] - 2026-01-21

### Added

#### Human-in-the-Loop Support (@agentforge/tools, @agentforge/core)
- **askHuman Tool** - New tool for human-in-the-loop workflows
  - Pauses agent execution to request human input or approval
  - Priority levels: low, normal, high, critical
  - Timeout handling with default responses
  - Suggested responses for UI integration
  - LangGraph interrupt integration
  - Full TypeScript support with Zod validation
  - 11 comprehensive unit tests

- **Interrupt Handling Utilities** (@agentforge/core)
  - `HumanRequest`, `HumanRequestPriority`, `HumanRequestStatus` types
  - Interrupt creation and type guard utilities
  - Thread status tracking
  - SSE event formatters for real-time communication
  - 19 unit tests for interrupt and streaming utilities

- **New Agent Tools Category** - Created dedicated category for agent interaction tools
  - Tool count increased from 69 to 70 tools
  - 5 categories: Web, Data, File, Utility, Agent

#### Reusable Agent Examples
- **Three Production-Ready Vertical Agents** - Complete examples in `examples/vertical-agents/`
  - Customer Support Agent (24 tests passing)
  - Code Review Agent (26 tests passing)
  - Data Analyst Agent (28 tests passing)
  - Each demonstrates factory function pattern, external prompts, tool injection, feature flags
  - Total: 78 comprehensive tests across all examples
- **Total Test Count**: 1028 tests passing across all packages (up from 897)

#### CLI Scaffolding (@agentforge/cli)
- **New Command: `agent:create-reusable`** - Scaffold production-ready reusable agents
  - Interactive prompts for agent name, description, and author
  - Complete template with factory function pattern
  - External prompt templates (`.md` files with `{{variable}}` placeholders)
  - Prompt loader utility for template rendering
  - Comprehensive test suite (14 test cases)
  - Configuration validation with Zod
  - Tool injection support and feature flags
  - Full documentation and examples
  - 5 CLI command tests

#### Documentation
- **Reusable Agents Guide** - Complete guide for building configurable agents
  - Factory function pattern
  - External prompt templates
  - Tool injection and feature flags
  - Configuration validation
  - Testing patterns and best practices
- **Main README for Reusable Agents** - Overview of all three example agents (341 lines)
- **Updated Examples README** - Added reusable agents section and learning path
- **CLI Documentation** - Detailed usage guide for `agent:create-reusable` command

### Changed
- Moved `HumanRequest` types from tools to core (shared framework types)
- Updated all documentation to reflect 70 tools
- Added `@langchain/langgraph` as peer dependency (optional) for tools package

### Fixed
- **Lockfile Update** - Updated `pnpm-lock.yaml` to include reusable agent example dependencies
  - Fixes CI deployment issue with `--frozen-lockfile` flag
  - Ensures reproducible builds in GitHub Actions

### Published
- All packages published to npm registry at version 0.5.2:
  - @agentforge/core@0.5.2
  - @agentforge/patterns@0.5.2
  - @agentforge/tools@0.5.2
  - @agentforge/testing@0.5.2
  - @agentforge/cli@0.5.2

## [0.5.1] - 2026-01-16

### Added

#### Multi-Agent Pattern Enhancements (@agentforge/patterns)
- **Streaming Support** - Added `stream()` method wrapper to Multi-Agent pattern
  - Ensures worker capabilities are injected into initial state when using streaming mode
  - Maintains consistency with `invoke()` method behavior
  - Enables real-time streaming of multi-agent workflows

- **Tool Usage Tracking** - Enhanced ReAct agent wrapper with tool tracking
  - Automatically extracts and logs tools used during ReAct agent execution
  - Includes `tools_used` array in task result metadata
  - Removes duplicate tool names for cleaner reporting
  - Adds verbose logging to show which tools were used by each worker

### Changed
- Updated all package versions to 0.5.1
- Improved observability of ReAct agents in Multi-Agent workflows

### Published
- All packages published to npm registry at version 0.5.1:
  - @agentforge/core@0.5.1
  - @agentforge/patterns@0.5.1 (includes streaming support and tool tracking)
  - @agentforge/tools@0.5.1
  - @agentforge/testing@0.5.1
  - @agentforge/cli@0.5.1

## [0.5.0] - 2026-01-15

### Added

#### Multi-Agent Pattern Enhancement (@agentforge/patterns)
- **Automatic ReAct Agent Integration** - Multi-Agent workers can now accept ReAct agents directly
  - New `agent` property in `WorkerConfig` for ReAct agent instances
  - Automatic detection and wrapping of ReAct agents via `isReActAgent()`
  - Seamless state conversion between Multi-Agent and ReAct formats
  - Priority system: `executeFn` > `agent` > default LLM execution
  - Eliminates boilerplate wrapper code (20+ lines → 1 line)
  - Full backward compatibility with existing `executeFn` approach
  - Enhanced error handling and verbose logging
  - New utility functions: `isReActAgent()` and `wrapReActAgent()`

#### Developer Experience
- **Release Automation** - Added comprehensive release tooling
  - `scripts/release.sh` - Automated version bump script
  - `scripts/publish.sh` - Automated npm publishing script
  - `RELEASE_CHECKLIST.md` - Complete release checklist
  - `.ai/RELEASE_PROCESS.md` - AI assistant release guide

### Changed
- Updated all package versions to 0.5.0
- Updated VitePress documentation site to display v0.5.0
- Updated CLI templates to use @agentforge/* ^0.5.0
- Improved `WorkerConfig` type definitions with comprehensive JSDoc

### Published
- All packages published to npm registry at version 0.5.0:
  - @agentforge/core@0.5.0
  - @agentforge/patterns@0.5.0 (includes ReAct agent integration)
  - @agentforge/tools@0.5.0
  - @agentforge/testing@0.5.0
  - @agentforge/cli@0.5.0

## [0.4.1] - 2026-01-15

### Added

#### Tool Compatibility (@agentforge/tools)
- **`invoke()` method alias** - Added `invoke()` as an alias to `execute()` for all tools
  - Provides compatibility with LangChain's tool interface
  - Both methods work identically - use whichever fits your framework
  - No breaking changes - `execute()` remains the primary method
  - Fully typed with TypeScript support

### Changed
- Updated all package versions to 0.4.1
- Updated VitePress documentation site to display v0.4.1
- Updated CLI templates to use @agentforge/* ^0.4.1

### Published
- All packages published to npm registry at version 0.4.1:
  - @agentforge/core@0.4.1
  - @agentforge/patterns@0.4.1
  - @agentforge/tools@0.4.1 (includes invoke() alias)
  - @agentforge/testing@0.4.1
  - @agentforge/cli@0.4.1

## [0.4.0] - 2026-01-09

### Added

#### Web Search Tool (@agentforge/tools)
- **New `webSearch` tool** - Intelligent web search with dual provider support
  - **DuckDuckGo provider** - Free, no API key required
  - **Serper provider** - Premium Google search results (optional, requires API key)
  - **Smart fallback mechanism** - Automatically falls back to alternative provider if primary returns no results
  - **Configurable timeout** - Default 30s, configurable from 1-60 seconds
  - **Retry logic** - Exponential backoff with 3 retries for transient failures
  - **Performance optimizations** - Efficient result parsing and processing
  - **Comprehensive testing** - 45 tests with 100% statement coverage, 92.5% branch coverage
  - **Full documentation** - README, JSDoc comments, and usage examples

#### Features
- Support for custom search queries with configurable result limits (1-50 results)
- Metadata tracking (response time, source provider, fallback usage)
- Environment variable support (`SERPER_API_KEY` for premium features)
- TypeScript type definitions for all inputs and outputs
- Zod schema validation for inputs

#### Documentation
- Updated tools README with webSearch documentation
- Added comparison table: DuckDuckGo vs Serper
- Created usage examples for both providers
- Added environment setup instructions

### Changed
- Tool count increased from 68 to 69 tools
- Updated all package versions to 0.4.0
- Updated VitePress documentation site to display v0.4.0
- Marked docs-site package as private (not published to npm)

### Fixed
- Updated pnpm lockfile to use `workspace:*` for internal dependencies
- Fixed GitHub Actions CI deployment issue with frozen lockfile

### Published
- All packages published to npm registry at version 0.4.0:
  - @agentforge/core@0.4.0
  - @agentforge/patterns@0.4.0
  - @agentforge/tools@0.4.0 (includes webSearch)
  - @agentforge/testing@0.4.0
  - @agentforge/cli@0.4.0

## [0.3.9] - 2026-01-09

### Added
- **Tool Relations**: Define relationships between tools to guide LLM workflows
  - `.requires(tools)` - Tools that must be called before this tool
  - `.suggests(tools)` - Tools that work well with this tool
  - `.conflicts(tools)` - Tools that conflict with this tool
  - `.follows(tools)` - Tools this typically follows in a workflow
  - `.precedes(tools)` - Tools this typically precedes in a workflow
  - Full TypeScript support with `ToolRelations` interface and `ToolRelationsSchema` validation
  - Helps LLMs make better decisions about tool selection and ordering

- **Minimal Prompt Mode**: Reduce token usage with native tool calling providers
  - New `minimal` option in `ToolRegistry.generatePrompt()`
  - Only includes supplementary context (relations, examples, notes, limitations)
  - Excludes basic tool definitions (name, description, parameters) sent via API
  - Reduces token usage by up to 67% when using OpenAI, Anthropic, Gemini, or Mistral
  - Backward compatible - opt-in via `minimal: true` flag

- **Enhanced Prompt Generation**: New options for `ToolRegistry.generatePrompt()`
  - `includeRelations` - Include tool relations in prompts
  - `minimal` - Enable minimal prompt mode for native tool calling

### Improved
- **Tool Builder API**: Added 5 new fluent methods for defining tool relations
- **Documentation**: Updated API docs and examples with tool relations and minimal mode
- **Type Safety**: Full TypeScript support for all new features with validation

### Tests
- Added 106 new tests for tool relations and minimal prompt mode
- All 516 tests passing across the core package

## [0.3.5] - 2026-01-08

### Fixed
- **CLI Templates**: Removed incorrect `.compile()` calls from all templates
  - `createReActAgent()` already returns a compiled graph
  - Fixed minimal, full, cli, and api templates
  - Users no longer need to call `.compile()` on pattern creation functions

## [0.3.4] - 2026-01-08

### Changed
- **Breaking Change**: Standardized on `model` parameter across all agent patterns
  - Changed all config interfaces to use `model` instead of `llm`
  - Affects: ReAct, Reflection, Plan-Execute, and Multi-Agent patterns
  - Updated all documentation and examples to use `model`
  - This provides a consistent, modern API across the framework

## [0.3.3] - 2026-01-08

### Added
- **CLI Templates**: Added environment validation to all templates (minimal, full, cli, api)
  - Validates required environment variables (OPENAI_API_KEY) before starting
  - Provides clear, helpful error messages when variables are missing
  - Includes step-by-step instructions on how to fix missing environment variables
  - Prevents cryptic OpenAI SDK errors when API key is not configured

### Improved
- **Documentation**: Enhanced quick-start guide with more explicit environment setup instructions
  - Added warning about setting up .env BEFORE running the agent
  - Clarified the importance of copying .env.example to .env
  - Added explanation of what happens if environment setup is skipped

## [0.3.2] - 2026-01-08

### Fixed
- **CLI Minimal Template**: Added missing `dotenv` package dependency
- **CLI Minimal Template**: Added missing `.env.example` file
- **CLI Minimal Template**: Added `import 'dotenv/config'` to load environment variables
- **CLI Minimal Template**: Updated README with environment setup instructions

## [0.3.1] - 2026-01-08

### Fixed
- **CLI Templates**: Fixed version references in CLI templates - `@agentforge/patterns` was incorrectly referencing `^0.2.0` instead of `^0.3.1`
- All template `package.json` files now correctly reference `^0.3.1` for all `@agentforge/*` packages

## [0.3.0] - 2026-01-08

### Added
- Initial public release with all core packages
- Complete documentation site
- CLI tool for project scaffolding
- 827 passing tests across all packages

## [0.2.0] - 2026-01-08

### Changed
- **BREAKING**: Updated to LangChain v1.x (from v0.3.x)
  - `@langchain/core@^1.1.0` (was `^0.3.x`)
  - `@langchain/langgraph@^1.0.0` (was `^0.2.x`)
  - `langchain@^1.2.0` (was `^0.3.x`)
  - `@langchain/openai@^1.2.0` (was `^0.3.x`)
- All packages now use consistent LangChain v1.x peer dependencies
- Templates updated to use latest LangChain versions

### Fixed
- Resolved peer dependency conflicts between packages
- Fixed `workspace:*` dependencies in published packages

## [0.1.9] - 2026-01-08

### Fixed
- **All Packages**: Replaced `workspace:*` dependencies with actual npm versions to fix installation issues
- Added `.npmrc` configuration for proper workspace dependency handling

## [0.1.8] - 2026-01-08

### Fixed
- **CLI**: Fixed template path resolution - was going up too many directory levels
- **CLI**: Replaced `workspace:*` dependencies with actual npm versions in all templates
- Repository URLs now use `git+https://` format to avoid npm warnings

## [0.1.6] - 2026-01-08

### Added
- Changelog and Contributing guide pages

### Fixed
- **CLI**: Fixed `__dirname` error in ES modules by using `import.meta.url` instead
- Template copying now works correctly when creating new projects

## [0.1.5] - 2026-01-08

### Added
- Complete documentation site with VitePress
- 34 documentation pages covering all aspects of the framework
- Interactive examples and tutorials
- Comprehensive API reference for all packages
- Verification checklist for documentation quality

### Changed
- Updated documentation site version display to v0.1.5

### Fixed
- Documentation site navigation and links

## [0.1.0] - 2026-01-07

### Added

#### Core Package (@agentforge/core)
- **Tool System**
  - `ToolBuilder` for creating type-safe tools with Zod validation
  - `ToolRegistry` for managing and discovering tools
  - `ToolExecutor` with retry logic and error handling
  - LangChain tool conversion utilities
  - 69+ built-in tools across 8 categories

- **Middleware System**
  - Composable middleware architecture
  - Built-in middleware: caching, rate limiting, validation, logging, metrics
  - Middleware composition utilities

- **Streaming Support**
  - SSE (Server-Sent Events) streaming
  - WebSocket streaming
  - Progress tracking and backpressure management
  - Stream transformers and utilities

- **Resource Management**
  - Resource lifecycle management
  - Connection pooling
  - Automatic cleanup and disposal
  - Health checks

- **Monitoring & Observability**
  - Metrics collection (counters, gauges, histograms)
  - Event tracking
  - Performance monitoring
  - Integration with monitoring services

#### Patterns Package (@agentforge/patterns)
- **ReAct Pattern**
  - Reasoning and acting loop
  - Tool selection and execution
  - Configurable max iterations

- **Plan-Execute Pattern**
  - Planning phase with task decomposition
  - Execution phase with progress tracking
  - Re-planning on failures

- **Reflection Pattern**
  - Self-critique and improvement
  - Iterative refinement
  - Quality scoring

- **Multi-Agent Pattern**
  - Agent coordination and communication
  - Supervisor and worker agents
  - Message passing and state sharing

#### CLI Package (@agentforge/cli)
- Project scaffolding with templates
- 13 commands for development workflow
- Interactive project creation
- Development server
- Build and deployment tools

#### Testing Package (@agentforge/testing)
- Mock factories for agents, tools, and LLMs
- Test helpers and utilities
- Fixtures for common test scenarios
- Integration testing support

#### Tools Package (@agentforge/tools)
- 69+ production-ready tools
- Categories: web, file system, data processing, API, database, math, text, utilities
- Full TypeScript support with Zod validation

### Documentation
- Complete getting started guide
- Core concepts documentation
- Pattern-specific guides
- API reference for all packages
- 6 example projects
- 5 step-by-step tutorials
- Deployment guides

### Developer Experience
- Full TypeScript support
- Comprehensive type definitions
- ESLint and Prettier configuration
- Vitest for testing
- pnpm workspace setup
- GitHub Actions CI/CD

## [Unreleased]

### Planned Features
- Additional agent patterns (Tree of Thoughts, Chain of Thought)
- More built-in tools
- Enhanced monitoring and observability
- Performance optimizations
- Additional deployment templates
- Plugin system
- Visual agent builder
- Agent marketplace

---

## Version History

- **0.7.0** (2026-01-27) - Agent builder utility, implementSafe() method, DRY remediation (~2,621 lines eliminated)
- **0.6.4** (2026-01-24) - Comprehensive structured logging system across all patterns and core components
- **0.6.3** (2026-01-23) - Parallel routing for multi-agent pattern - route to multiple agents simultaneously
- **0.6.2** (2026-01-23) - Fixed Plan-Execute pattern interrupt handling
- **0.6.1** (2026-01-22) - Fixed askHuman interrupt handling, added logging documentation
- **0.6.0** (2026-01-22) - Tool-enabled supervisors for multi-agent pattern, vertical agents terminology
- **0.5.4** (2026-01-21) - Checkpointer support for all patterns, enabling human-in-the-loop workflows
- **0.5.3** (2026-01-21) - Fixed vertical-agent template tsconfig.json
- **0.5.2** (2026-01-21) - Human-in-the-Loop support, vertical agent examples, and CLI scaffolding
- **0.5.1** (2026-01-16) - Multi-Agent streaming support and tool usage tracking
- **0.5.0** (2026-01-15) - Automatic ReAct agent integration for Multi-Agent pattern, release automation
- **0.4.1** (2026-01-15) - Added invoke() method alias for LangChain compatibility
- **0.4.0** (2026-01-09) - Added webSearch tool with DuckDuckGo and Serper providers
- **0.3.3** (2026-01-08) - Added environment validation to all CLI templates with helpful error messages
- **0.3.2** (2026-01-08) - Fixed minimal template missing dotenv configuration
- **0.3.1** (2026-01-08) - Fixed CLI template version references
- **0.3.0** (2026-01-08) - Initial public release with all core packages
- **0.2.0** (2026-01-08) - **BREAKING**: Updated to LangChain v1.x, fixed peer dependencies
- **0.1.9** (2026-01-08) - Fixed workspace:* dependencies in all packages
- **0.1.8** (2026-01-08) - CLI template path and dependency fixes
- **0.1.6** (2026-01-08) - CLI ES module fix, changelog and contributing pages
- **0.1.5** (2026-01-08) - Documentation updates
- **0.1.0** (2026-01-07) - Initial release

## Links

- [GitHub Repository](https://github.com/TVScoundrel/agentforge)
- [Documentation](https://tvscoundrel.github.io/agentforge/)
- [npm Package](https://www.npmjs.com/package/@agentforge/core)
- [Issues](https://github.com/TVScoundrel/agentforge/issues)

