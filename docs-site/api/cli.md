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

- `--template <name>` - Project template (minimal, full, api-service)
- `--package-manager <pm>` - Package manager (pnpm, npm, yarn)
- `--skip-install` - Skip dependency installation
- `--skip-git` - Skip git initialization

#### Examples

```bash
# Create minimal project
agentforge create my-agent

# Create with specific template
agentforge create my-api --template api-service

# Create without installing dependencies
agentforge create my-agent --skip-install
```

### dev

Start development server with hot reload.

```bash
agentforge dev [options]
```

#### Options

- `--port <number>` - Server port (default: 3000)
- `--host <string>` - Server host (default: localhost)
- `--watch` - Watch for file changes

#### Examples

```bash
# Start dev server
agentforge dev

# Custom port
agentforge dev --port 8080
```

### build

Build project for production.

```bash
agentforge build [options]
```

#### Options

- `--outDir <path>` - Output directory (default: dist)
- `--minify` - Minify output
- `--sourcemap` - Generate source maps

#### Examples

```bash
# Build for production
agentforge build

# Build with source maps
agentforge build --sourcemap
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

### generate

Generate code from templates.

```bash
agentforge generate <type> <name> [options]
```

#### Types

- `agent` - Generate agent
- `tool` - Generate custom tool
- `middleware` - Generate middleware
- `pattern` - Generate custom pattern

#### Examples

```bash
# Generate agent
agentforge generate agent research-agent

# Generate tool
agentforge generate tool web-search

# Generate middleware
agentforge generate middleware auth
```

### deploy

Deploy to various platforms.

```bash
agentforge deploy <platform> [options]
```

#### Platforms

- `docker` - Build Docker image
- `kubernetes` - Deploy to Kubernetes
- `vercel` - Deploy to Vercel
- `aws` - Deploy to AWS Lambda

#### Examples

```bash
# Build Docker image
agentforge deploy docker

# Deploy to Kubernetes
agentforge deploy kubernetes --namespace production
```

### info

Display project information.

```bash
agentforge info
```

Shows:
- Project name and version
- Installed packages
- Configuration
- Environment

### upgrade

Upgrade AgentForge packages.

```bash
agentforge upgrade [options]
```

#### Options

- `--latest` - Upgrade to latest versions
- `--interactive` - Interactive upgrade

#### Examples

```bash
# Upgrade all packages
agentforge upgrade

# Interactive upgrade
agentforge upgrade --interactive
```

## Configuration

### agentforge.config.ts

Create `agentforge.config.ts` in your project root:

```typescript
import { defineConfig } from '@agentforge/cli';

export default defineConfig({
  // Build configuration
  build: {
    outDir: 'dist',
    minify: true,
    sourcemap: true
  },

  // Development server
  dev: {
    port: 3000,
    host: 'localhost',
    watch: true
  },

  // Testing
  test: {
    coverage: true,
    ui: false
  },

  // Deployment
  deploy: {
    docker: {
      registry: 'docker.io',
      tag: 'latest'
    }
  }
});
```

## Environment Variables

The CLI respects these environment variables:

- `AGENTFORGE_CONFIG` - Path to config file
- `NODE_ENV` - Environment (development, production)
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

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

# Deploy
agentforge deploy docker
```

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

## API

The CLI can also be used programmatically:

```typescript
import { CLI } from '@agentforge/cli';

const cli = new CLI();

await cli.create('my-agent', {
  template: 'minimal',
  skipInstall: false
});

await cli.build({
  outDir: 'dist',
  minify: true
});
```

