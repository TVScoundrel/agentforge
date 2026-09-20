# Monorepo setup

AgentForge uses a pnpm workspace. The root manifest is the source of truth for shared commands, while each package owns its package-specific scripts and dependencies.

## Requirements

- Node.js 18 or newer
- pnpm compatible with the version declared by the root `packageManager` field

Install dependencies from the repository root:

```bash
pnpm install
```

Do not install dependencies independently inside package directories; workspace packages rely on pnpm linking.

## Workspace layout

```text
packages/
  cli/       command-line workflows
  core/      shared framework primitives
  patterns/  ReAct, Plan-Execute, Reflection, and Multi-Agent patterns
  skills/    Agent Skill discovery, trust, and activation
  testing/   agent-testing utilities
  tools/     concrete Tool implementations

docs-site/   user-facing documentation site
examples/    runnable and reusable examples
playground/  development playground
scripts/     repository validation and release helpers
```

Read `pnpm-workspace.yaml` for the complete workspace-package list. Read package manifests rather than duplicating their dependency or export maps in documentation.

## Common commands

Run commands from the repository root:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
```

Useful targeted forms:

```bash
pnpm --filter @agentforge/core test --run
pnpm --filter @agentforge/patterns typecheck
pnpm --filter @agentforge/tools lint
```

Integration tests are separate from the default suite:

```bash
pnpm test:integration
```

Use the exact scripts in the relevant `package.json`; package capabilities and validation paths evolve independently.

## TypeScript and packaging

The repository uses strict TypeScript with NodeNext module resolution. Source imports include the emitted `.js` extension even when the source file is TypeScript:

```ts
import { createTool } from './create-tool.js';
```

Packages build distributable ESM, CommonJS, and declaration output with tsup. Public imports must be reachable through the package entry point or an intentional export-map path; internal source paths are not compatibility contracts.

## Development workflow

1. Start from an issue with explicit acceptance criteria.
2. Create a feature branch.
3. Make the smallest coherent change through public seams.
4. Run focused tests while iterating.
5. Run package type checking and linting.
6. Run the relevant repository-level validation before delivery.
7. Push the branch and open a pull request that references the issue.

See [`docs/agents/issue-tracker.md`](./agents/issue-tracker.md) for tracker operations. The root `release:validate` script is the executable source of truth for release validation.

## Where documentation belongs

- User guides and API references: `docs-site/`
- Package-specific behavior and examples: beside the package
- Contributor architecture and repository policy: `docs/`
- Domain vocabulary: `CONTEXT.md`
- Durable architectural trade-offs: `docs/adr/`
- Active and completed delivery records: GitHub Issues and pull requests
