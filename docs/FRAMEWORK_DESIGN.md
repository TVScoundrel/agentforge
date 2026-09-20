# AgentForge framework design

AgentForge is a TypeScript monorepo of reusable building blocks for constructing and operating agents consistently. The public architecture is organized by responsibility rather than by a single framework runtime.

## Package map

```text
Applications
    │
    ├── @agentforge/patterns  orchestration patterns
    ├── @agentforge/tools     operations agents can invoke
    └── @agentforge/skills    discoverable instruction bundles
             │
             └── @agentforge/core  shared Tool, LangChain, LangGraph,
                                   resource, streaming, and monitoring primitives

@agentforge/testing supports tests across the packages.
@agentforge/cli provides project and component workflows.
```

### `@agentforge/core`

Owns framework primitives used across packages:

- Tool construction, metadata, execution, composition, and registries
- LangChain conversion and LangGraph state utilities
- prompt loading
- resources and lifecycle management
- streaming and monitoring

Core should remain independent of provider-specific Tool implementations and higher-level agent patterns.

### `@agentforge/patterns`

Owns reusable coordination models:

- ReAct
- Plan-Execute
- Reflection
- Multi-Agent

Patterns assemble graphs from public Core contracts. Their public factories are the compatibility boundary; internal nodes, routing, and schemas stay private unless callers genuinely need them.

### `@agentforge/tools`

Owns concrete operations in the agent, file, relational-data, Neo4j, utility, and web areas. Tools expose model-facing schemas and safe result envelopes while keeping provider clients and lifecycle details private.

Model-controlled workflows should prefer the model-safe Tool presets described in [`SECURITY.md`](../SECURITY.md). Standalone unrestricted factories are for trusted operator-controlled automation.

### `@agentforge/skills`

Owns Agent Skill discovery, trust policy, prompt presentation, activation, and supporting-resource access. Skill discovery, Agent Skill access, and Skill activation are distinct concepts; use the definitions in [`CONTEXT.md`](../CONTEXT.md).

### `@agentforge/testing`

Owns mocks, fixtures, state builders, runners, and assertion helpers for testing agents through public interfaces.

### `@agentforge/cli`

Owns command parsing and filesystem workflows for AgentForge projects. Commands should delegate reusable behavior to small internal modules rather than duplicating package runtime logic.

## Design principles

### Public facades, private depth

Public factories, registries, and package entry points should provide stable interfaces. Provider mechanics, traversal, session ownership, routing, and other detailed behavior belong behind private modules with focused responsibilities.

### Observable tests

Tests should exercise public interfaces wherever practical. Private modules may change as the implementation deepens; observable behavior, public types, and documented compatibility are the contract.

### Explicit ownership

Resource owners also own cleanup. Pools, sessions, transactions, streams, and registries should make lifecycle boundaries visible and deterministic.

### Safe model-facing defaults

Inputs influenced by a model or remote user cross a trust boundary. Model-facing presets enforce confinement and policy; privileged capabilities remain explicit for trusted automation.

### Domain language

Use [`CONTEXT.md`](../CONTEXT.md) for canonical terms. A Multi-Agent System's Worker topology is fixed at compilation; the rationale is recorded in [ADR-0001](./adr/0001-fix-worker-topology-at-compilation.md).

## Sources of truth

- Public behavior: package entry points, exported types, and tests
- Workspace commands and dependencies: `package.json`, package manifests, and `pnpm-workspace.yaml`
- Domain vocabulary: `CONTEXT.md`
- Hard-to-reverse architectural decisions: `docs/adr/`
- Active work and delivery history: GitHub Issues and pull requests
- User documentation: `docs-site/` and package READMEs

Avoid copying discoverable directory listings, dependency versions, test counts, or delivery status into architecture documentation; those caches become stale quickly.
