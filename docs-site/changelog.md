# Changelog

All notable changes to AgentForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.2] - 2026-01-21

### Added

#### Reusable Agent Examples
- **Three Production-Ready Reusable Agents** - Complete examples in `examples/reusable-agents/`
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

## [Unreleased]

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

### Changed
- Moved `HumanRequest` types from tools to core (shared framework types)
- Updated all documentation to reflect 70 tools
- Added `@langchain/langgraph` as peer dependency (optional) for tools package

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

- **0.5.2** (2026-01-21) - Reusable agent examples and CLI scaffolding
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

