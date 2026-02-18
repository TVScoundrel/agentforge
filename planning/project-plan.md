# Project Plan: AgentForge Framework

## Project Overview

**Objective:** Build and maintain AgentForge - a production-ready TypeScript framework for building autonomous AI agents with LangGraph and LangChain.

**Target Users:**
- Developers building AI agent applications
- Teams needing production-ready agent patterns and tools
- Organizations requiring type-safe, testable AI agent systems
- Developers seeking to leverage LangGraph/LangChain with better DX

**Desired Outcomes:**
- Production-ready framework with comprehensive agent patterns (ReAct, Plan-Execute, Reflection, Multi-Agent)
- 70+ built-in tools covering web, data, file, utility, and agent operations
- Full TypeScript support with runtime validation
- Comprehensive testing utilities and developer tooling
- Clear documentation and examples for rapid adoption
- Active npm packages with semantic versioning

**Business Value:**
- Accelerates AI agent development with ready-to-use patterns and tools
- Reduces bugs through type safety and comprehensive testing
- Enables rapid prototyping and production deployment
- Provides a foundation for building complex multi-agent systems
- Serves as a testing ground via the Playground (PTY AGI) project

## Technical Context

**Technology Stack:**
- **Language:** TypeScript 5.7+
- **Package Manager:** pnpm (workspace support)
- **Testing:** Vitest
- **Validation:** Zod 3.x
- **Agent Framework:** LangGraph (orchestration)
- **LLM Integration:** LangChain
- **Documentation:** VitePress (docs-site)
- **Build System:** tsup (dual ESM/CJS) for builds, TypeScript compiler (`tsc --noEmit`) for typechecking, pnpm workspaces

**Repository Structure:**
- **Monorepo:** Contains both AgentForge framework and Playground (PTY AGI)
- **Framework Packages:** 5 packages under `packages/`
  - `@agentforge/core` - Foundation (tools, registry, middleware, streaming, resources)
  - `@agentforge/patterns` - Agent patterns (ReAct, Plan-Execute, Reflection, Multi-Agent)
  - `@agentforge/tools` - 70+ ready-to-use tools
  - `@agentforge/testing` - Testing utilities, mocks, assertions
  - `@agentforge/cli` - Developer productivity CLI
- **Playground:** Real-world multi-agent system (PTY AGI) that uses AgentForge
- **Documentation:** `docs-site/` (public), `docs/` (internal), package READMEs

**Philosophy:**
- "We wrap, don't replace" - Built on top of LangGraph/LangChain
- Type-safe wrappers and production-ready patterns
- Comprehensive testing and developer experience
- Clear separation between framework and applications using it

## Constraints and Assumptions

**Constraints:**
- Must maintain backward compatibility for published packages
- Must follow semantic versioning for all releases
- Must maintain comprehensive test coverage (>90%)
- Must provide clear migration guides for breaking changes
- Must keep documentation synchronized with code
- Must support TypeScript 5.7+ and Node.js 18+

**Assumptions:**
- Framework users have basic TypeScript and LangChain knowledge
- Playground (PTY AGI) serves as both a real project and testing ground
- Published packages are consumed via npm
- Development happens in the monorepo with workspace dependencies
- Documentation site is deployed to GitHub Pages

**Current Status:**
- **Version:** 0.12.6 (all packages published to npm)
- **Active Development:** Relational Database Access Tool (in progress)
- **Published Packages:** All 5 framework packages live on npm
- **Documentation:** Live at https://tvscoundrel.github.io/agentforge/

## Architecture

### Monorepo Structure

```
agentforge/
├── packages/              # AgentForge Framework (5 packages)
│   ├── core/             # @agentforge/core - Foundation
│   │   ├── src/
│   │   │   ├── tools/           # Tool abstractions
│   │   │   ├── registry/        # Tool registry
│   │   │   ├── middleware/      # Middleware system
│   │   │   ├── streaming/       # Streaming support
│   │   │   └── resources/       # Resource management
│   │   └── package.json
│   ├── patterns/         # @agentforge/patterns - Agent patterns
│   │   ├── src/
│   │   │   ├── react/           # ReAct pattern
│   │   │   ├── plan-execute/    # Plan-Execute pattern
│   │   │   ├── reflection/      # Reflection pattern
│   │   │   └── multi-agent/     # Multi-Agent pattern
│   │   └── package.json
│   ├── tools/            # @agentforge/tools - 70+ tools
│   │   ├── src/
│   │   │   ├── web/             # Web tools
│   │   │   ├── data/            # Data tools (Neo4j, relational)
│   │   │   ├── file/            # File tools
│   │   │   ├── utility/         # Utility tools
│   │   │   └── agent/           # Agent tools
│   │   └── package.json
│   ├── testing/          # @agentforge/testing - Testing utilities
│   │   └── package.json
│   └── cli/              # @agentforge/cli - Developer CLI
│       └── package.json
├── playground/           # PTY AGI POC - Multi-agent system
│   ├── src/
│   │   ├── api/              # Express server & SSE streaming
│   │   ├── system/           # Supervisor & Aggregator
│   │   ├── agents/           # Specialist agents
│   │   ├── tools/            # Mock integrations
│   │   └── config/           # LLM configuration
│   └── package.json
├── docs/                 # Internal technical documentation
├── docs-site/            # VitePress documentation website
├── examples/             # Example applications
└── templates/            # Deployment templates
```

### Framework Architecture

**Core Abstractions:**
- **Tool System:** Base classes and interfaces for creating agent tools
- **Registry:** Central tool registration and discovery
- **Middleware:** Request/response pipeline for tools
- **Streaming:** Real-time response streaming support
- **Resources:** Lifecycle management for external resources

**Agent Patterns:**
- **ReAct:** Reasoning and Acting pattern
- **Plan-Execute:** Planning followed by execution
- **Reflection:** Self-reflection and improvement
- **Multi-Agent:** Orchestration of multiple agents

**Tool Categories:**
- **Web Tools:** HTTP requests, web scraping, API calls
- **Data Tools:** Neo4j, relational databases, data processing
- **File Tools:** File system operations
- **Utility Tools:** General-purpose utilities
- **Agent Tools:** Inter-agent communication

### Playground Architecture (PTY AGI)

**Purpose:** Real-world multi-agent system that uses AgentForge

**Components:**
- **Supervisor:** Routes requests to specialist agents
- **Aggregator:** Combines results from multiple agents
- **Specialist Agents:** HR, Security, Code, Legal agents
- **API Server:** Express with SSE streaming
- **Mock Tools:** GitHub, Slack, Zendesk integrations

**Key Features:**
- Parallel agent execution for independent tasks
- Real-time streaming via Server-Sent Events
- Human-in-the-loop via `askHuman` tool
- Demonstrates AgentForge patterns in production scenario

## Scope

### Framework Scope (In Scope)

**Core Package (@agentforge/core):**
- Tool abstractions and base classes
- Tool registry and discovery
- Middleware system for request/response pipeline
- Streaming support for real-time responses
- Resource lifecycle management
- Error handling and validation

**Patterns Package (@agentforge/patterns):**
- ReAct pattern implementation
- Plan-Execute pattern implementation
- Reflection pattern implementation
- Multi-Agent orchestration pattern
- Pattern composition and customization

**Tools Package (@agentforge/tools):**
- 70+ ready-to-use tools across categories
- Web tools (HTTP, scraping, APIs)
- Data tools (Neo4j, relational databases)
- File tools (file system operations)
- Utility tools (general-purpose)
- Agent tools (inter-agent communication)

**Testing Package (@agentforge/testing):**
- Testing utilities and helpers
- Mock implementations
- Assertions and matchers
- Test fixtures and data generators

**CLI Package (@agentforge/cli):**
- Project scaffolding
- Development server
- Build and deployment tools
- Code generation utilities

**Documentation:**
- User-facing documentation (docs-site)
- Internal technical documentation (docs)
- API reference
- Tutorials and guides
- Example applications

### Playground Scope (In Scope)

**PTY AGI Application:**
- Multi-agent orchestration system
- Specialist agents (HR, Security, Code, Legal)
- Real-time streaming API
- Mock tool integrations
- Human-in-the-loop support
- Serves as framework testing ground

### Out of Scope

**Framework:**
- LLM provider implementations (use LangChain)
- Vector database implementations (beyond Neo4j)
- Custom LLM fine-tuning
- Agent hosting/deployment infrastructure
- Commercial support or SLA

**Playground:**
- Production deployment to Paymentology infrastructure
- Real integrations (GitHub, Slack, Zendesk)
- Authentication and authorization
- Multi-tenancy support

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| LangGraph/LangChain breaking changes | High | Medium | Pin versions, monitor releases, maintain compatibility layer |
| TypeScript version incompatibilities | Medium | Low | Support TypeScript 5.7+, test across versions |
| npm package publishing issues | Medium | Low | Automated release process, semantic versioning |
| Documentation drift from code | Medium | Medium | Automated doc generation, regular reviews |
| Test coverage gaps | High | Medium | Enforce coverage thresholds, comprehensive test suite |
| Breaking changes in dependencies | Medium | Medium | Lock file management, dependency update strategy |
| Playground diverging from framework | Low | Low | Use workspace dependencies, regular integration testing |
| Community adoption challenges | Medium | High | Clear documentation, examples, active maintenance |

## Success Criteria

**Framework Quality:**
- [ ] All 5 packages published to npm with semantic versioning
- [ ] Test coverage >90% across all packages
- [ ] Zero critical security vulnerabilities
- [ ] All packages pass linting and type-checking
- [ ] Documentation site live and up-to-date
- [ ] All 4 agent patterns fully implemented and tested
- [ ] 70+ tools available and documented

**Developer Experience:**
- [ ] CLI provides scaffolding and development tools
- [ ] Clear examples for each pattern
- [ ] API documentation complete and accurate
- [ ] Migration guides for breaking changes
- [ ] Active issue tracking and resolution

**Playground Validation:**
- [ ] PTY AGI successfully uses all framework packages
- [ ] Real-time streaming works end-to-end
- [ ] Multi-agent orchestration demonstrates framework capabilities
- [ ] Serves as comprehensive integration test

**Community & Adoption:**
- [ ] Documentation site accessible and comprehensive
- [ ] Example applications demonstrate real-world usage
- [ ] Clear contribution guidelines
- [ ] Regular releases with changelog

