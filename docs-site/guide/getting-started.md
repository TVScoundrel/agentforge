# Getting Started

Welcome to AgentForge! This guide will help you get up and running in minutes.

## Prerequisites

Before you begin, make sure you have:

- **Node.js** 18.x or higher
- **pnpm** 8.x or higher (recommended) or npm/yarn
- **TypeScript** knowledge (basic understanding)
- **OpenAI API key** (or other LLM provider)

## Installation

### Option 1: Using the CLI (Recommended)

The fastest way to get started is using the AgentForge CLI:

```bash
# Create a new project
npx @agentforge/cli create my-agent

# Navigate to the project
cd my-agent

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### Option 2: Manual Installation

If you prefer to set up manually:

```bash
# Create a new directory
mkdir my-agent && cd my-agent

# Initialize package.json
pnpm init

# Install AgentForge packages
pnpm add @agentforge/core @agentforge/patterns
pnpm add -D typescript @types/node tsx

# Install LangChain dependencies
pnpm add @langchain/core @langchain/openai

# Initialize TypeScript
npx tsc --init
```

## Project Structure

A typical AgentForge project looks like this:

```
my-agent/
├── src/
│   ├── agent.ts          # Agent definition
│   ├── tools.ts          # Custom tools
│   └── index.ts          # Entry point
├── .env                  # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## Your First Agent

Let's create a simple ReAct agent that can answer questions and perform calculations.

### 1. Create the Agent

Create `src/agent.ts`:

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { calculator } from '@agentforge/tools';

export const agent = createReActAgent({
  llm: new ChatOpenAI({
    model: 'gpt-4',
    temperature: 0
  }),
  tools: [calculator],
  maxIterations: 5
});
```

### 2. Create the Entry Point

Create `src/index.ts`:

```typescript
import { agent } from './agent.js';

async function main() {
  const result = await agent.invoke({
    messages: [{
      role: 'user',
      content: 'What is 25 * 4 + 10?'
    }]
  });

  console.log('Agent response:', result.messages[result.messages.length - 1].content);
}

main().catch(console.error);
```

### 3. Set Up Environment

Create `.env`:

```bash
OPENAI_API_KEY=your-api-key-here
```

### 4. Run Your Agent

```bash
# Using tsx (recommended for development)
npx tsx src/index.ts

# Or compile and run
npx tsc
node dist/index.js
```

## What's Next?

Now that you have a basic agent running, explore:

- **[Quick Start Guide](/guide/quick-start)** - Build more complex agents
- **[Core Concepts](/guide/concepts/tools)** - Understand the fundamentals
- **[Agent Patterns](/guide/patterns/react)** - Learn different patterns
- **[Custom Tools](/tutorials/custom-tools)** - Create your own tools
- **[Examples](/examples/react-agent)** - See real-world examples

## Common Issues

### Module Resolution Errors

If you see module resolution errors, make sure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true
  }
}
```

### API Key Not Found

Make sure you've:
1. Created a `.env` file
2. Added `OPENAI_API_KEY=your-key`
3. Loaded environment variables (use `dotenv` if needed)

### Type Errors

AgentForge requires TypeScript 5.0+. Update if needed:

```bash
pnpm add -D typescript@latest
```

## Getting Help

- **[GitHub Discussions](https://github.com/TVScoundrel/agentforge/discussions)** - Ask questions
- **[Discord](https://discord.gg/agentforge)** - Chat with the community
- **[Examples](https://github.com/TVScoundrel/agentforge/tree/main/examples)** - Browse code examples

