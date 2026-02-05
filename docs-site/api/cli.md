# @agentforge/cli

Command-line tool for project management and development.

## Installation

```bash
# Global installation
pnpm add -g @agentforge/cli

# Or use with npx
npx @agentforge/cli <command>
```

## Commands

### create

Create a new AgentForge project.

```bash
agentforge create <project-name> [options]
```

#### Options

- `--template <name>` - Project template (minimal, full, api, cli)
- `--package-manager <pm>` - Package manager (pnpm, npm, yarn)
- `--no-install` - Skip dependency installation
- `--no-git` - Skip git initialization

#### Examples

```bash
# Create minimal project
agentforge create my-agent

# Create with specific template
agentforge create my-api --template api

# Create CLI project
agentforge create my-cli --template cli

# Create without installing dependencies
agentforge create my-agent --no-install
```

### dev

Start development server with hot reload.

```bash
agentforge dev [options]
```

#### Options

- `-p, --port <number>` - Server port (default: 3000)
- `--no-open` - Do not open browser automatically

#### Examples

```bash
# Start dev server
agentforge dev

# Custom port
agentforge dev --port 8080

# Don't open browser
agentforge dev --no-open
```

### build

Build project for production.

```bash
agentforge build [options]
```

#### Options

- `--no-minify` - Skip minification
- `--no-sourcemap` - Skip sourcemap generation

#### Examples

```bash
# Build for production (with minification and sourcemaps)
agentforge build

# Build without minification
agentforge build --no-minify

# Build without sourcemaps
agentforge build --no-sourcemap
```

### test

Run tests.

```bash
agentforge test [options]
```

#### Options

- `--watch` - Watch mode
- `--coverage` - Generate coverage report
- `--ui` - Open Vitest UI

#### Examples

```bash
# Run tests
agentforge test

# Watch mode with coverage
agentforge test --watch --coverage
```

### agent

Manage agents in your project.

```bash
agentforge agent <command> [options]
```

#### Commands

- `create <name>` - Create a new agent
- `create-reusable <name>` - Create a reusable agent (production template)
- `list` - List all agents
- `test <name>` - Test a specific agent
- `deploy <name>` - Deploy an agent (not yet implemented)

#### Examples

```bash
# Create a new agent
agentforge agent create research-agent

# Create with specific pattern
agentforge agent create my-agent --pattern plan-execute

# Create reusable agent
agentforge agent create-reusable my-agent --description "A reusable agent"

# List all agents
agentforge agent list

# Test an agent
agentforge agent test research-agent
```

### tool

Manage tools in your project.

```bash
agentforge tool <command> [options]
```

#### Commands

- `create <name>` - Create a new tool
- `list` - List all tools
- `test <name>` - Test a specific tool
- `publish <name>` - Publish a tool to npm

#### Examples

```bash
# Create a new tool
agentforge tool create web-search

# Create with category
agentforge tool create my-tool --category web

# List all tools
agentforge tool list

# Test a tool
agentforge tool test web-search

# Publish a tool
agentforge tool publish my-tool --tag latest
```

### agent deploy

Deploy an agent (currently not implemented - use manual deployment).

```bash
agentforge agent deploy <name> [options]
```

#### Options

- `--environment <env>` - Deployment environment (default: production)
- `--dry-run` - Dry run without actual deployment

#### Note

Automated agent deployment is not yet implemented. Please use one of the following deployment methods:

**1. Docker Deployment:**
- See `templates/deployment/docker/` for Dockerfile and docker-compose.yml
- Run: `docker build -t my-agent . && docker run my-agent`

**2. Kubernetes Deployment:**
- See `templates/deployment/kubernetes/` for manifests
- Run: `kubectl apply -f templates/deployment/kubernetes/`

**3. Serverless Deployment:**
- AWS Lambda: Use SAM or Serverless Framework
- Vercel: Use `vercel deploy`
- Google Cloud Run: Use `gcloud run deploy`

**4. Manual Deployment:**
1. Build: `npm run build`
2. Test: `npm test`
3. Deploy to your platform of choice

For detailed deployment guides, see the [deployment documentation](https://tvscoundrel.github.io/agentforge/guide/advanced/deployment).

## Environment Variables

The CLI respects these environment variables:

- `NODE_ENV` - Environment (development, production)
- `PORT` - Development server port (for dev command)
- `NO_MINIFY` - Skip minification (for build command)
- `NO_SOURCEMAP` - Skip sourcemap generation (for build command)

## Examples

### Complete Workflow

```bash
# Create project
agentforge create my-agent

# Navigate to project
cd my-agent

# Start development
agentforge dev

# Run tests
agentforge test --watch

# Build for production
agentforge build
```

For deployment, see the [deployment guide](https://tvscoundrel.github.io/agentforge/guide/advanced/deployment) for platform-specific instructions (Docker, Kubernetes, Serverless, etc.).

## Troubleshooting

### Command Not Found

If `agentforge` command is not found:

```bash
# Install globally
pnpm add -g @agentforge/cli

# Or use npx
npx @agentforge/cli <command>
```

### Permission Errors

On Unix systems, you may need to use `sudo`:

```bash
sudo pnpm add -g @agentforge/cli
```

## Programmatic API

The CLI can also be used programmatically:

```typescript
import { program, run } from '@agentforge/cli';

// Run the CLI programmatically
await run();

// Or access the Commander.js program instance directly
// to add custom commands or modify behavior
program
  .command('custom')
  .description('Custom command')
  .action(() => {
    console.log('Custom command executed');
  });
```

