# Installation

This guide covers different ways to install and set up AgentForge.

## System Requirements

- **Node.js**: 18.x or higher
- **Package Manager**: pnpm (recommended), npm, or yarn
- **TypeScript**: 5.0 or higher
- **Operating System**: macOS, Linux, or Windows

## Quick Install

### Using the CLI (Recommended)

The easiest way to get started:

```bash
npx @agentforge/cli create my-agent
cd my-agent
pnpm install
```

This creates a new project with:
- Pre-configured TypeScript
- Example agent
- Environment setup
- Development scripts

### Manual Installation

For existing projects or custom setups:

```bash
# Core packages
pnpm add @agentforge/core @agentforge/patterns @agentforge/tools

# LangChain dependencies
pnpm add @langchain/core @langchain/openai

# Development dependencies
pnpm add -D typescript @types/node tsx
```

## Package Overview

### Core Packages

#### @agentforge/core
The foundation package with tools, middleware, and utilities.

```bash
pnpm add @agentforge/core
```

#### @agentforge/patterns
Pre-built agent patterns (ReAct, Plan-Execute, etc.).

```bash
pnpm add @agentforge/patterns
```

### Optional Packages

#### @agentforge/cli
Command-line tool for project management.

```bash
pnpm add -D @agentforge/cli
```

#### @agentforge/testing
Testing utilities and mock factories.

```bash
pnpm add -D @agentforge/testing
```

#### @agentforge/tools
Standard tools library (70 tools).

```bash
pnpm add @agentforge/tools
```

## LangChain Dependencies

AgentForge requires LangChain packages:

### Required

```bash
# Core LangChain
pnpm add @langchain/core

# LLM provider (choose one or more)
pnpm add @langchain/openai        # OpenAI
pnpm add @langchain/anthropic     # Anthropic
pnpm add @langchain/google-genai  # Google
```

### Optional

```bash
# Community tools
pnpm add @langchain/community

# Vector stores
pnpm add @langchain/pinecone
pnpm add @langchain/weaviate

# Document loaders
pnpm add langchain
```

## TypeScript Configuration

Create or update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Environment Setup

### Environment Variables

Create `.env` file:

```bash
# LLM Provider
OPENAI_API_KEY=your-openai-key
# or
ANTHROPIC_API_KEY=your-anthropic-key

# Optional: LangSmith (for tracing)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-key
LANGCHAIN_PROJECT=my-agent

# Optional: Custom configuration
NODE_ENV=development
LOG_LEVEL=info
```

### Loading Environment Variables

Install dotenv:

```bash
pnpm add dotenv
```

Load in your code:

```typescript
import 'dotenv/config';
```

## Verification

Verify your installation:

```typescript
// test.ts
import { toolBuilder } from '@agentforge/core';
import { createReActAgent } from '@agentforge/patterns';

console.log('✅ AgentForge installed successfully!');
```

Run:

```bash
npx tsx test.ts
```

## Next Steps

- [Getting Started](/guide/getting-started) - Create your first agent
- [Quick Start](/guide/quick-start) - Build a complete example
- [Core Concepts](/guide/concepts/tools) - Learn the fundamentals

