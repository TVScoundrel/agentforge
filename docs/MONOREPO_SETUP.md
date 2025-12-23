# Monorepo Setup Guide

> Complete guide to the AgentForge monorepo structure and tooling

---

## Overview

AgentForge uses a **pnpm workspace** monorepo structure for managing multiple packages. This provides:

- ✅ Shared dependencies and tooling
- ✅ Consistent build and test processes
- ✅ Easy cross-package development
- ✅ Efficient disk usage and installation

---

## Directory Structure

```
agentforge/
├── packages/                    # All packages
│   ├── core/                   # @agentforge/core
│   ├── patterns/               # @agentforge/patterns (future)
│   ├── tools/                  # @agentforge/tools (future)
│   ├── testing/                # @agentforge/testing (future)
│   └── cli/                    # @agentforge/cli (future)
├── docs/                       # Documentation
│   ├── FRAMEWORK_DESIGN.md
│   ├── ROADMAP.md
│   ├── TOOL_REGISTRY_SPEC.md
│   ├── MONOREPO_SETUP.md
│   └── DIAGRAMS.md
├── node_modules/               # Shared dependencies
├── pnpm-workspace.yaml         # Workspace configuration
├── package.json                # Root package
├── tsconfig.json               # Shared TypeScript config
├── vitest.config.ts            # Shared test config
├── eslint.config.js            # Shared lint config
├── .prettierrc                 # Shared format config
├── .gitignore                  # Git ignore rules
└── README.md                   # Main README
```

---

## Package Structure

Each package follows a consistent structure:

```
packages/core/
├── src/                        # Source code
│   ├── tools/                 # Feature directories
│   │   └── index.ts
│   └── index.ts               # Main entry point
├── tests/                      # Tests
│   └── *.test.ts
├── dist/                       # Build output (gitignored)
│   ├── index.js               # ESM build
│   ├── index.cjs              # CommonJS build
│   ├── index.d.ts             # TypeScript declarations
│   └── index.d.cts            # CommonJS declarations
├── package.json                # Package configuration
├── tsconfig.json               # Package TypeScript config
└── README.md                   # Package README
```

---

## Configuration Files

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
```

Defines which directories are workspace packages.

### Root package.json

```json
{
  "name": "agentforge",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r dev",
    "test": "vitest",
    "typecheck": "pnpm -r typecheck",
    "lint": "eslint packages --ext .ts",
    "clean": "pnpm -r clean && rm -rf node_modules"
  }
}
```

- `private: true` - Not published to npm
- `pnpm -r` - Run command in all packages recursively

### Package package.json

```json
{
  "name": "@agentforge/core",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

- Dual ESM/CommonJS support
- TypeScript declarations
- Modern exports field

---

## Build System

### tsup Configuration

Each package uses **tsup** for fast, zero-config bundling:

```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch"
  }
}
```

**Features**:
- ✅ ESM + CommonJS output
- ✅ TypeScript declarations (.d.ts)
- ✅ Source maps
- ✅ Watch mode for development
- ✅ Fast builds with esbuild

### TypeScript Configuration

**Root tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true
  }
}
```

**Package tsconfig.json**:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
```

---

## Testing

### Vitest Configuration

**Root vitest.config.ts**:
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd agentforge

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Daily Development

```bash
# Start watch mode for all packages
pnpm dev

# Run tests in watch mode
pnpm test --watch

# Type check
pnpm typecheck

# Lint and fix
pnpm lint:fix

# Format code
pnpm format
```

### Adding a New Package

1. Create package directory:
```bash
mkdir -p packages/new-package/src
```

2. Create `package.json`:
```json
{
  "name": "@agentforge/new-package",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch"
  }
}
```

3. Create `tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
```

4. Install dependencies:
```bash
pnpm install
```

---

## Scripts Reference

### Root Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build all packages |
| `pnpm dev` | Watch mode for all packages |
| `pnpm test` | Run all tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:ui` | Run tests with UI |
| `pnpm typecheck` | Type check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm lint:fix` | Lint and fix all packages |
| `pnpm format` | Format all code |
| `pnpm clean` | Clean all build artifacts |

### Package Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build this package |
| `pnpm dev` | Watch mode for this package |
| `pnpm test` | Run tests for this package |
| `pnpm typecheck` | Type check this package |
| `pnpm clean` | Clean build artifacts |

---

## Dependencies

### Shared Dev Dependencies (Root)

- `typescript` - TypeScript compiler
- `tsup` - Build tool
- `vitest` - Test runner
- `eslint` - Linter
- `prettier` - Formatter

### Package Dependencies

Each package declares its own runtime dependencies:

```json
{
  "dependencies": {
    "@langchain/core": "^0.1.0",
    "zod": "^3.0.0"
  }
}
```

---

## Best Practices

1. **Always run commands from root** - Use `pnpm -r` for recursive operations
2. **Keep packages focused** - Each package should have a single responsibility
3. **Share configurations** - Extend root configs in packages
4. **Test everything** - Maintain >80% coverage
5. **Document changes** - Update relevant docs when adding features

---

## Troubleshooting

### Build Issues

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Type Issues

```bash
# Regenerate TypeScript declarations
pnpm -r build
```

### Dependency Issues

```bash
# Reinstall all dependencies
rm -rf node_modules packages/*/node_modules
pnpm install
```

---

## Next Steps

- See [FRAMEWORK_DESIGN.md](./FRAMEWORK_DESIGN.md) for architecture
- See [ROADMAP.md](./ROADMAP.md) for development plan
- See [TOOL_REGISTRY_SPEC.md](./TOOL_REGISTRY_SPEC.md) for tool system details

