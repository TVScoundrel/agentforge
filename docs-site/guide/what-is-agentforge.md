# What is AgentForge?

AgentForge is a production-ready AI agent framework built on top of LangGraph and LangChain. It provides a comprehensive toolkit for building, testing, and deploying AI agents with TypeScript.

## Philosophy

AgentForge follows a simple philosophy: **We wrap, don't replace**. Instead of creating yet another agent framework from scratch, we build on the solid foundation of LangGraph and LangChain, providing:

- **Type-safe wrappers** around LangGraph primitives
- **Production-ready patterns** that work out of the box
- **Developer experience** tools to accelerate development
- **Battle-tested utilities** for common tasks

## Key Features

### 🛠️ Tool Registry & Auto-Prompt Generation
AgentForge's **killer feature** - a centralized tool registry that automatically generates LLM-ready prompts:

- **Register Once, Use Everywhere** - Define tools with rich metadata (categories, tags, examples)
- **Auto-Generate Prompts** - Automatically create formatted tool descriptions for LLMs
- **Smart Querying** - Search by name, category, or tags
- **Seamless Integration** - Convert to LangChain tools with one method call
- **68+ Standard Tools** - Production-ready tools included out of the box

```typescript
const registry = new ToolRegistry();

// Mix custom tools with 68+ standard tools
import { calculator, httpGet, fileReader } from '@agentforge/tools';
registry.registerMany([myTool, calculator, httpGet, fileReader]);

// Automatically generate LLM-ready prompts
const prompt = registry.generatePrompt({
  includeExamples: true,
  groupByCategory: true
});

// Use with any agent
const agent = createReActAgent({
  model: llm,
  tools: registry.toLangChainTools(),
  systemPrompt: prompt // Auto-generated!
});

// Create specialized registries for different agents
const webScraperRegistry = new ToolRegistry();
const dataAnalystRegistry = new ToolRegistry();
// Each agent gets its own focused toolset!
```

### 🎯 Agent Patterns
Four production-ready patterns:
- **ReAct** - Reasoning and acting in cycles
- **Plan-Execute** - Planning then executing steps
- **Reflection** - Self-critique and improvement
- **Multi-Agent** - Coordinated agent systems

### 🔌 Middleware System
Composable middleware for:
- Caching and rate limiting
- Validation and error handling
- Logging and tracing
- Metrics and monitoring
- Retry and timeout logic

### 📊 Streaming & Real-time
- Server-Sent Events (SSE)
- WebSocket support
- Progress tracking
- Backpressure management

### 🧪 Testing Utilities
- Mock LLM and tools
- Test helpers and assertions
- Sample conversations and fixtures
- Integration testing tools

### 🚀 Production Features
- Health checks and monitoring
- Resource management
- Connection pooling
- Circuit breakers
- Deployment templates

## Architecture

AgentForge is organized into five packages:

### @agentforge/core
The foundation package containing:
- **Tool Registry** - Centralized tool management with auto-prompt generation
- **Tool Builder** - Fluent API for creating tools with rich metadata
- LangGraph utilities
- Middleware system
- Streaming utilities
- Resource management
- Monitoring tools

### @agentforge/patterns
Pre-built agent patterns:
- ReAct pattern
- Plan-Execute pattern
- Reflection pattern
- Multi-Agent coordination

### @agentforge/cli
Command-line tool for:
- Project scaffolding
- Development server
- Code generation
- Deployment

### @agentforge/testing
Testing utilities:
- Mock factories
- Test helpers
- Fixtures
- Integration testing

### @agentforge/tools
Standard tools library:
- Web tools (HTTP, scraping, parsing)
- Data tools (JSON, CSV, XML)
- File tools (read, write, search)
- Utility tools (date, string, math, validation)

## When to Use AgentForge

AgentForge is ideal when you need:

✅ **Production-ready agents** - Not just prototypes
✅ **Type safety** - Full TypeScript support
✅ **Proven patterns** - Battle-tested architectures
✅ **Smart tool management** - Auto-generate prompts, no manual prompt engineering
✅ **Developer experience** - CLI, testing, docs
✅ **LangChain ecosystem** - Leverage existing tools

## When NOT to Use AgentForge

AgentForge might not be the best fit if:

❌ You need a framework-agnostic solution  
❌ You're building simple chatbots (use LangChain directly)  
❌ You want to avoid the LangChain ecosystem  
❌ You need Python (AgentForge is TypeScript-only)  

## Comparison with Alternatives

### vs. LangChain/LangGraph Directly
- ✅ Higher-level abstractions
- ✅ Production-ready patterns
- ✅ Better TypeScript support
- ✅ **Auto-prompt generation** - No manual tool description writing
- ✅ More comprehensive tooling
- ❌ Less flexibility for custom patterns

### vs. AutoGPT/BabyAGI
- ✅ More structured and maintainable
- ✅ Better production features
- ✅ Type safety
- ❌ Less autonomous

### vs. CrewAI
- ✅ TypeScript instead of Python
- ✅ Built on LangGraph
- ✅ More comprehensive middleware
- ❌ Smaller community (newer)

## Next Steps

Ready to get started? Check out:

- [Installation Guide](/guide/installation)
- [Quick Start](/guide/quick-start)
- [Your First Agent](/tutorials/first-agent)

