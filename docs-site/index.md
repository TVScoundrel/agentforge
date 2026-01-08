---
layout: home

hero:
  name: AgentForge
  text: Production-Ready AI Agent Framework
  tagline: Build powerful AI agents with TypeScript, LangGraph, and battle-tested patterns
  image:
    src: /logo.svg
    alt: AgentForge
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/TVScoundrel/agentforge
    - theme: alt
      text: API Reference
      link: /api/core

features:
  - icon: 🛠️
    title: Rich Tool System
    details: Comprehensive tool builder with metadata, validation, and LangChain integration. 68+ standard tools included.
  
  - icon: 🎯
    title: Agent Patterns
    details: Production-ready patterns - ReAct, Plan-Execute, Reflection, and Multi-Agent coordination.
  
  - icon: 🔌
    title: Middleware System
    details: Composable middleware for caching, rate limiting, validation, logging, and more.
  
  - icon: 📊
    title: Streaming & Real-time
    details: Built-in support for SSE, WebSocket, progress tracking, and backpressure management.
  
  - icon: 🧪
    title: Testing Utilities
    details: Mock factories, test helpers, fixtures, and integration testing tools.
  
  - icon: 🚀
    title: Production Ready
    details: Health checks, monitoring, resource management, and deployment templates.
  
  - icon: 📦
    title: TypeScript First
    details: Full type safety with Zod validation and comprehensive type definitions.
  
  - icon: 🎨
    title: Developer Experience
    details: CLI tool, project templates, interactive docs, and extensive examples.
  
  - icon: 🔄
    title: LangGraph Integration
    details: Built on LangGraph - leverage the full power of LangChain ecosystem.
---

## Quick Start

```bash
# Create a new project
npx @agentforge/cli create my-agent

# Navigate to project
cd my-agent

# Install dependencies
pnpm install

# Run your first agent
pnpm dev
```

## Example: ReAct Agent

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { calculator, webSearch } from '@agentforge/tools';

const agent = createReActAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [calculator, webSearch],
  maxIterations: 5
});

const result = await agent.invoke({
  messages: [{
    role: 'user',
    content: 'What is the population of Tokyo multiplied by 2?'
  }]
});

console.log(result.messages[result.messages.length - 1].content);
```

## Why AgentForge?

### 🎯 **Production-Ready Patterns**
Don't reinvent the wheel. Use battle-tested agent patterns that work in production.

### 🛠️ **Comprehensive Tooling**
From CLI to testing utilities, everything you need to build, test, and deploy agents.

### 📚 **Extensive Documentation**
Interactive tutorials, API reference, and real-world examples to get you started quickly.

### 🔒 **Type Safety**
Full TypeScript support with Zod validation ensures your agents are reliable and maintainable.

### 🚀 **Scalable**
Built-in resource management, monitoring, and deployment templates for production workloads.

## What's Included?

- **@agentforge/core** - Tool system, middleware, streaming, and utilities
- **@agentforge/patterns** - ReAct, Plan-Execute, Reflection, Multi-Agent patterns
- **@agentforge/cli** - Project scaffolding and development tools
- **@agentforge/testing** - Mock factories, test helpers, and fixtures
- **@agentforge/tools** - 68+ production-ready tools for common tasks

## Community

- [GitHub Discussions](https://github.com/TVScoundrel/agentforge/discussions)
- [Discord Server](https://discord.gg/U9twuFu4PQ)
- [Twitter](https://twitter.com/agentforge)

## License

MIT © 2026 AgentForge Team

