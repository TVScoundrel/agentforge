# Changelog

All notable changes to AgentForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
  - 68+ built-in tools across 8 categories

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
- 68+ production-ready tools
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

