# Repository documentation

This directory contains maintained contributor guidance, architectural decisions, and security references. User-facing guides and API documentation live in [`docs-site/`](../docs-site/), while package-specific material lives beside the package it describes.

## Contributor guides

- [Framework design](./FRAMEWORK_DESIGN.md): package responsibilities and architectural boundaries.
- [Monorepo setup](./MONOREPO_SETUP.md): workspace layout, commands, and validation workflow.
- [Codebase learning guide](./CODEBASE_LEARNING_GUIDE.md): a practical route through an unfamiliar area of the repository.
- [Logging standards](./LOGGING_STANDARDS.md): logger names, levels, fields, and examples.

## Domain and engineering process

- [`CONTEXT.md`](../CONTEXT.md): canonical domain vocabulary.
- [`docs/adr/`](./adr/): accepted decisions that are costly to reverse and surprising without context.
- [`docs/agents/`](./agents/): issue-tracker, triage-label, and domain-document conventions used by engineering agents.

Current work is tracked in [GitHub Issues](https://github.com/TVScoundrel/agentforge/issues). Completed delivery history belongs in closed issues, merged pull requests, and Git history rather than permanent story reports in this directory.

## Security

- [`SECURITY.md`](../SECURITY.md): repository-wide trust-boundary policy.
- [SQL injection prevention](./sql-injection-prevention-best-practices.md): relational-tool guidance.

## Maintenance rule

Keep durable guidance here. Read package manifests, scripts, and the source tree directly for facts that are cheap to discover and likely to change. Record a decision as an ADR only when it represents a meaningful, hard-to-reverse trade-off.
