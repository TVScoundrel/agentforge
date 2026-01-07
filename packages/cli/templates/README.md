# AgentForge Project Templates

This directory contains project templates for the `agentforge create` command.

## Available Templates

### 1. Minimal (`minimal/`)

A minimal starter template with just the essentials.

**Features:**
- Basic ReAct agent setup
- TypeScript configuration
- Build and test scripts
- Minimal dependencies

**Best for:**
- Quick prototypes
- Learning AgentForge
- Simple agent applications

**Usage:**
```bash
agentforge create my-project --template minimal
```

---

### 2. Full (`full/`)

A full-featured template with tools, tests, and best practices.

**Features:**
- ReAct agent with example tool
- Comprehensive test suite
- Environment configuration
- Logging and error handling
- Example tool implementation
- Test coverage setup

**Best for:**
- Production applications
- Complex agent systems
- Projects requiring multiple tools

**Usage:**
```bash
agentforge create my-project --template full
```

---

### 3. API (`api/`)

A REST API service template with Express.js.

**Features:**
- Express.js server
- Agent API endpoints
- Health check endpoint
- CORS support
- Request logging
- Error handling middleware

**Best for:**
- Web services
- API backends
- Microservices
- Integration with frontend apps

**Usage:**
```bash
agentforge create my-api --template api
```

**Endpoints:**
- `GET /health` - Health check
- `POST /api/agent/chat` - Chat with agent

---

### 4. CLI (`cli/`)

A command-line interface template with Commander.js.

**Features:**
- Interactive chat command
- File analysis command
- Colored output (chalk)
- Spinners and progress (ora)
- Interactive prompts (inquirer)
- Commander.js framework

**Best for:**
- Command-line tools
- Developer utilities
- Automation scripts
- Interactive applications

**Usage:**
```bash
agentforge create my-cli --template cli
```

**Commands:**
- `chat` - Interactive chat session
- `analyze <file>` - Analyze files with AI

---

## Template Structure

Each template includes:

```
template-name/
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .gitignore           # Git ignore rules
├── .env.example         # Environment variables (if needed)
├── README.md            # Template-specific documentation
├── src/                 # Source code
│   └── ...
└── tests/               # Test files (if applicable)
    └── ...
```

## Template Variables

Templates use the following placeholders that are replaced during project creation:

- `{{PROJECT_NAME}}` - Project name
- `{{PROJECT_DESCRIPTION}}` - Project description
- `{{AUTHOR_NAME}}` - Author name (from git config)
- `{{AUTHOR_EMAIL}}` - Author email (from git config)

## Creating Custom Templates

To create a custom template:

1. Create a new directory in `templates/`
2. Add all necessary files with template variables
3. Include a `README.md` with usage instructions
4. Test the template with `agentforge create`

## Template Comparison

| Feature | Minimal | Full | API | CLI |
|---------|---------|------|-----|-----|
| Agent Setup | ✅ | ✅ | ✅ | ✅ |
| Example Tools | ❌ | ✅ | ❌ | ❌ |
| Tests | ❌ | ✅ | ❌ | ❌ |
| Environment Config | ❌ | ✅ | ✅ | ✅ |
| Express Server | ❌ | ❌ | ✅ | ❌ |
| CLI Framework | ❌ | ❌ | ❌ | ✅ |
| Interactive Prompts | ❌ | ❌ | ❌ | ✅ |
| API Endpoints | ❌ | ❌ | ✅ | ❌ |
| Logging | ❌ | ✅ | ✅ | ✅ |

## License

MIT

