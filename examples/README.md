# AgentForge Examples

This directory contains real-world examples and integrations demonstrating how to use AgentForge in production applications.

## 📁 Directory Structure

```
examples/
├── applications/          # Complete application examples
│   ├── research-assistant/    # AI research assistant
│   ├── code-reviewer/         # Code review assistant
│   ├── data-analyst/          # Data analysis agent
│   └── customer-support/      # Customer support bot
└── integrations/          # Framework integration examples
    ├── express-api/           # Express.js REST API
    └── nextjs-app/            # Next.js full-stack app
```

## 🚀 Applications

### Research Assistant
**Pattern**: ReAct  
**Use Case**: Research and information gathering

An AI-powered research assistant that searches the web, analyzes sources, and generates comprehensive research reports.

**Features**:
- Web search and scraping
- Multi-source analysis
- Summarization
- Comprehensive reporting

**Run**:
```bash
pnpm tsx examples/applications/research-assistant/src/index.ts "your research topic"
```

[View Documentation](./applications/research-assistant/README.md)

---

### Code Reviewer
**Pattern**: Reflection  
**Use Case**: Code quality analysis

An AI code reviewer that analyzes code quality, identifies issues, and suggests improvements using self-reflection for thorough analysis.

**Features**:
- Complexity analysis
- Best practices checking
- Bug detection
- Security review
- Improvement suggestions

**Run**:
```bash
pnpm tsx examples/applications/code-reviewer/src/index.ts <file-path>
```

[View Documentation](./applications/code-reviewer/README.md)

---

### Data Analyst
**Pattern**: Plan-Execute  
**Use Case**: Data analysis and insights

An AI data analyst that processes CSV/JSON data, performs statistical analysis, and generates insights.

**Features**:
- Data profiling
- Statistical analysis
- Pattern detection
- Insight generation
- Question answering

**Run**:
```bash
pnpm tsx examples/applications/data-analyst/src/index.ts <file-path> [question]
```

[View Documentation](./applications/data-analyst/README.md)

---

### Customer Support Bot
**Pattern**: Multi-Agent  
**Use Case**: Customer service automation

An AI customer support system with FAQ handling, ticket management, and intelligent routing using multiple specialized agents.

**Features**:
- FAQ database
- Ticket creation
- Sentiment analysis
- Auto-escalation
- Order tracking
- Interactive chat

**Run**:
```bash
pnpm tsx examples/applications/customer-support/src/index.ts
```

[View Documentation](./applications/customer-support/README.md)

---

## 🔌 Integrations

### Express.js REST API
**Framework**: Express.js  
**Type**: Backend API

A production-ready Express.js REST API with AgentForge integration, featuring streaming, rate limiting, and security.

**Features**:
- RESTful endpoints
- Streaming responses (SSE)
- Rate limiting
- Security headers
- Conversation management
- Health checks

**Run**:
```bash
pnpm tsx examples/integrations/express-api/src/server.ts
```

**Endpoints**:
- `POST /api/agent/invoke` - Invoke agent
- `POST /api/agent/stream` - Stream response
- `POST /api/chat/message` - Chat message
- `GET /health` - Health check

[View Documentation](./integrations/express-api/README.md)

---

### Next.js Full-Stack App
**Framework**: Next.js 14+  
**Type**: Full-stack application

A complete Next.js App Router integration with server-side agent execution, streaming, and a chat UI.

**Features**:
- App Router (Next.js 14+)
- Server Components
- API Routes
- Streaming responses
- Chat interface
- Type-safe

**Setup**:
```bash
npx create-next-app@latest my-agent-app
# Follow the guide in the README
```

[View Documentation](./integrations/nextjs-app/README.md)

---

## 🎯 Pattern Usage Guide

| Example | Pattern | Best For |
|---------|---------|----------|
| Research Assistant | ReAct | Tool-heavy tasks, research |
| Code Reviewer | Reflection | Quality analysis, self-improvement |
| Data Analyst | Plan-Execute | Structured workflows, multi-step tasks |
| Customer Support | Multi-Agent | Specialized roles, routing |

## 📚 Learning Path

### Beginner
1. Start with the **Research Assistant** to understand ReAct pattern
2. Try the **Express.js integration** for API basics
3. Explore the **Next.js integration** for full-stack apps

### Intermediate
1. Study the **Code Reviewer** to learn Reflection pattern
2. Analyze the **Data Analyst** for Plan-Execute pattern
3. Build custom tools based on the examples

### Advanced
1. Examine the **Customer Support Bot** for Multi-Agent systems
2. Combine patterns for complex applications
3. Optimize for production deployment

## 🛠️ Prerequisites

All examples require:
- Node.js 18+
- pnpm (recommended) or npm
- OpenAI API key

## ⚙️ Configuration

Create a `.env` file in the repository root:

```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4  # Optional, defaults to gpt-4
```

## 🚀 Quick Start

```bash
# Install dependencies (from repository root)
pnpm install

# Run any example
pnpm tsx examples/<category>/<example>/src/index.ts [args]

# Examples:
pnpm tsx examples/applications/research-assistant/src/index.ts "AI in healthcare"
pnpm tsx examples/applications/code-reviewer/src/index.ts packages/core/src/tools/builder.ts
pnpm tsx examples/applications/data-analyst/src/index.ts data/sales.csv
pnpm tsx examples/applications/customer-support/src/index.ts
pnpm tsx examples/integrations/express-api/src/server.ts
```

## 📖 Documentation

Each example includes:
- Comprehensive README
- Inline code comments
- Usage examples
- Customization guide
- Production considerations

## 🤝 Contributing

Want to add an example? Great! Please:
1. Follow the existing structure
2. Include comprehensive documentation
3. Add usage examples
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT © 2026 Tom Van Schoor

---

## Need Help?

- 📚 [AgentForge Documentation](../docs-site/)
- 💬 [GitHub Discussions](https://github.com/your-org/agentforge/discussions)
- 🐛 [Report Issues](https://github.com/your-org/agentforge/issues)

