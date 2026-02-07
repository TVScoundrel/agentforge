# @agentforge/cli

> CLI tool for AgentForge - scaffolding, development, testing, and deployment

[![npm version](https://img.shields.io/npm/v/@agentforge/cli)](https://www.npmjs.com/package/@agentforge/cli)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Coverage](https://img.shields.io/badge/coverage-98.11%25-brightgreen)](https://www.npmjs.com/package/@agentforge/cli)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

## 🎉 Status: Production Ready & Published

**156 tests passing** | **98.11% coverage** | **13 commands** | **4 project templates**

## 📦 Installation

```bash
# Global installation (recommended)
npm install -g @agentforge/cli

# Or use with npx (no installation needed)
npx @agentforge/cli create my-agent-project
```

## ✨ Features

- 🚀 **Project Scaffolding** - 4 templates (minimal, full, api, cli)
- 🛠️ **Development Tools** - Dev server, build, test commands
- 📦 **Deployment** - Deploy to Docker, Kubernetes, cloud platforms
- 🔧 **Code Generation** - Generate agents, tools, middleware
- ✅ **Validation** - Project structure and configuration validation
- 📊 **Diagnostics** - Health checks and issue detection
- 🔄 **Upgrades** - Dependency and framework upgrades
- 📝 **Configuration** - Manage project settings

## Commands

### Project Scaffolding

#### `create <project-name>`

Create a new AgentForge project with interactive setup.

```bash
agentforge create my-project

# With options
agentforge create my-project --template full --package-manager pnpm
```

**Options:**
- `-t, --template <template>` - Project template (minimal, full, api, cli) [default: minimal]
- `-p, --package-manager <pm>` - Package manager (npm, pnpm, yarn) [default: pnpm]
- `--no-install` - Skip dependency installation
- `--no-git` - Skip git initialization

### Development Commands

#### `dev`

Start development server with hot reload.

```bash
agentforge dev

# With options
agentforge dev --port 4000
```

**Options:**
- `-p, --port <port>` - Port number [default: 3000]
- `--no-open` - Do not open browser

#### `build`

Build for production.

```bash
agentforge build

# With options
agentforge build --no-minify --no-sourcemap
```

**Options:**
- `--no-minify` - Skip minification
- `--no-sourcemap` - Skip sourcemap generation

#### `test`

Run tests with coverage.

```bash
agentforge test

# With options
agentforge test --watch
agentforge test --ui
agentforge test --coverage
```

**Options:**
- `-w, --watch` - Watch mode
- `--ui` - Open test UI
- `--coverage` - Generate coverage report

#### `lint`

Lint and format code.

```bash
agentforge lint

# With options
agentforge lint --fix
```

**Options:**
- `--fix` - Auto-fix issues
- `--no-format` - Skip formatting

### Agent Management

#### `agent:create <name>`

Create a new agent.

```bash
agentforge agent:create myAgent

# With options
agentforge agent:create myAgent --pattern plan-execute
```

**Options:**
- `-p, --pattern <pattern>` - Agent pattern (react, plan-execute, reflection, multi-agent) [default: react]
- `--no-test` - Skip test generation

#### `agent:create-reusable <name>`

Create a new reusable agent using the production template.

This command scaffolds a complete reusable agent with:
- Factory function pattern
- External prompt templates (`.md` files)
- Tool injection support
- Feature flags
- Configuration validation with Zod
- Comprehensive test suite
- Full documentation

```bash
agentforge agent:create-reusable customer-support

# With options
agentforge agent:create-reusable data-analyst --description "Analyze data and generate insights" --author "Your Name"
```

**Options:**
- `-d, --description <description>` - Agent description
- `-a, --author <author>` - Author name

**What Gets Created:**
```
customer-support/
├── src/
│   ├── index.ts           # Agent factory function
│   └── index.test.ts      # Comprehensive tests
├── prompts/
│   └── system.md          # External prompt template
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

**Note:** The agent uses `loadPrompt` from `@agentforge/core` for secure prompt template loading with built-in injection protection.

**Next Steps After Creation:**
1. `cd customer-support`
2. `pnpm install`
3. Edit `prompts/system.md` to customize the prompt
4. Edit `src/index.ts` to add tools and configuration
5. `pnpm test` to run tests
6. `pnpm build` to build

**See Also:**
- [Vertical Agents Guide](../../docs-site/guide/advanced/vertical-agents.md)
- [Example Vertical Agents](../../examples/vertical-agents/)

#### `agent:list`

List all agents.

```bash
agentforge agent:list

# With verbose output
agentforge agent:list --verbose
```

**Options:**
- `-v, --verbose` - Show detailed information

#### `agent:test <name>`

Test a specific agent.

```bash
agentforge agent:test myAgent

# With watch mode
agentforge agent:test myAgent --watch
```

**Options:**
- `-w, --watch` - Watch mode

#### `agent:deploy <name>`

Deploy an agent.

```bash
agentforge agent:deploy myAgent

# With options
agentforge agent:deploy myAgent --environment staging --dry-run
```

**Options:**
- `-e, --environment <env>` - Deployment environment [default: production]
- `--dry-run` - Dry run without actual deployment

### Tool Management

#### `tool:create <name>`

Create a new tool.

```bash
agentforge tool:create myTool

# With options
agentforge tool:create myTool --category web
```

**Options:**
- `-c, --category <category>` - Tool category (web, data, file, utility) [default: utility]
- `--no-test` - Skip test generation

#### `tool:list`

List all tools.

```bash
agentforge tool:list

# Filter by category
agentforge tool:list --category web --verbose
```

**Options:**
- `-c, --category <category>` - Filter by category
- `-v, --verbose` - Show detailed information

#### `tool:test <name>`

Test a specific tool.

```bash
agentforge tool:test myTool

# With watch mode
agentforge tool:test myTool --watch
```

**Options:**
- `-w, --watch` - Watch mode

#### `tool:publish <name>`

Publish a tool to npm.

```bash
agentforge tool:publish myTool

# With options
agentforge tool:publish myTool --tag beta --dry-run
```

**Options:**
- `--tag <tag>` - npm tag [default: latest]
- `--dry-run` - Dry run without actual publishing

## 📖 Documentation

- 📚 **[Full Documentation](https://tvscoundrel.github.io/agentforge/)**
- 🚀 **[Quick Start](https://tvscoundrel.github.io/agentforge/guide/quick-start)**
- 🛠️ **[CLI API Reference](https://tvscoundrel.github.io/agentforge/api/cli)**
- 💡 **[Getting Started Tutorial](https://tvscoundrel.github.io/agentforge/tutorials/first-agent)**

## 🔗 Links

- [GitHub Repository](https://github.com/TVScoundrel/agentforge)
- [npm Package](https://www.npmjs.com/package/@agentforge/cli)
- [Changelog](https://tvscoundrel.github.io/agentforge/changelog.html) - See what's new before upgrading
- [Report Issues](https://github.com/TVScoundrel/agentforge/issues)

## 📚 Related Packages

- [@agentforge/core](https://www.npmjs.com/package/@agentforge/core) - Core abstractions
- [@agentforge/patterns](https://www.npmjs.com/package/@agentforge/patterns) - Agent patterns
- [@agentforge/tools](https://www.npmjs.com/package/@agentforge/tools) - Standard tools
- [@agentforge/testing](https://www.npmjs.com/package/@agentforge/testing) - Testing utilities

## License

MIT © 2026 Tom Van Schoor

