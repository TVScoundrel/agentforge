# @agentforge/skills

> Composable skill system for building modular AI agents in TypeScript, part of the AgentForge framework.

[![npm version](https://img.shields.io/npm/v/@agentforge/skills)](https://www.npmjs.com/package/@agentforge/skills)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

## Installation

```bash
npm install @agentforge/skills
# or
pnpm add @agentforge/skills
# or
yarn add @agentforge/skills
```

> **Note:** Requires `@agentforge/core` as a peer dependency.

## Overview

`@agentforge/skills` provides Agent Skill discovery, registration, access, and trust policy enforcement for AgentForge agents. Within Agent Skill access, Skill activation loads trusted instructions while resource access loads supporting files. It implements the [Agent Skills Specification](https://agentskills.io) for composable, modular agent capabilities.

Full source code and API will be available after ST-07002 (Move Skills Source Files). See the [AgentForge docs](https://tvscoundrel.github.io/agentforge/) for usage guides and tutorials.

## Agent Skill Access

Access Agent Skill instructions and supporting resources through the Tools bound
to a `SkillRegistry`:

```typescript
import { SkillRegistry } from '@agentforge/skills';

const registry = new SkillRegistry({
  enabled: true,
  skillRoots: [{ path: '.agentskills', trust: 'workspace' }],
});

const [activateSkill, readSkillResource] = registry.toActivationTools();
```

`resolveResourcePath` remains exported for compatibility, but it is deprecated
and planned for removal in the next major release. Use the
`read-skill-resource` Tool for Agent Skill resource access instead.

## License

MIT — see [LICENSE](../../LICENSE) for details.
