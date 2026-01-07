# @agentforge/cli

> CLI tool for AgentForge - scaffolding, development, and deployment

## Installation

```bash
# Global installation
npm install -g @agentforge/cli

# Or use with npx
npx @agentforge/cli create my-agent-project
```

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

## License

MIT

