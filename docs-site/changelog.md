# Changelog

All notable changes to AgentForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- **0.1.5** (2026-01-08) - Documentation updates
- **0.1.0** (2026-01-07) - Initial release

## Links

- [GitHub Repository](https://github.com/TVScoundrel/agentforge)
- [Documentation](https://tvscoundrel.github.io/agentforge/)
- [npm Package](https://www.npmjs.com/package/@agentforge/core)
- [Issues](https://github.com/TVScoundrel/agentforge/issues)

