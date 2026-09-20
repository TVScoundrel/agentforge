# Codebase learning guide

Use this route when entering an unfamiliar part of AgentForge. It favors current source and tests over cached inventories that quickly become stale.

## 1. Establish the language and boundaries

Read:

1. [`README.md`](../README.md) for the product surface.
2. [`CONTEXT.md`](../CONTEXT.md) for canonical domain terms.
3. [Framework design](./FRAMEWORK_DESIGN.md) for package responsibilities.
4. Relevant records in [`docs/adr/`](./adr/) for decisions that constrain the area.
5. [`SECURITY.md`](../SECURITY.md) when the change touches model-controlled input, filesystem access, remote requests, Skills, examples, or multi-agent routing.

## 2. Pick the owning package

| Package | Start here when working on |
| --- | --- |
| `@agentforge/core` | Tools as a framework concept, LangChain/LangGraph adapters, resources, streaming, or monitoring |
| `@agentforge/patterns` | ReAct, Plan-Execute, Reflection, or Multi-Agent coordination |
| `@agentforge/tools` | File, web, data, agent, or utility operations |
| `@agentforge/skills` | Agent Skill discovery, trust, access, or activation |
| `@agentforge/testing` | Mocks, fixtures, runners, or test helpers |
| `@agentforge/cli` | CLI commands and project filesystem workflows |

Inspect the package rather than relying on a document's directory snapshot:

```bash
rg --files packages/<package>/src
rg --files packages/<package>/tests
sed -n '1,220p' packages/<package>/src/index.ts
```

The package entry point shows the supported public surface. Follow an export inward to its implementation, then locate tests that exercise it.

## 3. Trace one behavior end to end

For the behavior you are changing:

1. Find the public factory, class, or function.
2. Follow calls to the module that owns the behavior.
3. Read the closest public-interface tests.
4. Check package README or `docs-site/` documentation for user-visible promises.
5. Search GitHub Issues and merged pull requests when implementation history matters.

Useful searches:

```bash
rg 'export .*Name|export \{.*Name' packages/<package>/src
rg 'Name' packages/<package>/tests
rg 'Name' packages/<package>/README.md docs-site
```

## 4. Validate your understanding

Write down the observable behavior, owner, callers, and constraints before editing. Confirm those claims against tests and source. If terminology is unclear, use `CONTEXT.md`; if a proposed change contradicts an ADR, surface that conflict explicitly.

During implementation, start with the narrowest relevant command and expand validation in proportion to risk:

```bash
pnpm --filter @agentforge/<package> test --run
pnpm --filter @agentforge/<package> typecheck
pnpm --filter @agentforge/<package> lint
pnpm test
```

The current scripts in the root and package manifests are authoritative.

## 5. Leave durable knowledge in the right place

- Update user-visible behavior in the package README or `docs-site/`.
- Add domain vocabulary to `CONTEXT.md` only when a term has been resolved.
- Add an ADR only for a surprising, hard-to-reverse trade-off with real alternatives.
- Keep delivery evidence in the issue and pull request.

Avoid adding per-ticket completion reports to `docs/`; Git history already preserves them and they obscure maintained guidance.
