# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
pnpm install
```

### Development

```bash
# Run in development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint code
pnpm lint
```

## Project Structure

```
{{PROJECT_NAME}}/
├── src/
│   └── index.ts          # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Next Steps

1. Add your tools in `src/tools/`
2. Customize the agent in `src/index.ts`
3. Add tests in `tests/`
4. Deploy using the deployment guides in AgentForge docs

## Learn More

- [AgentForge Documentation](../../docs/)
- [Agent Patterns Guide](../../docs/guides/patterns/)
- [Tool Development Guide](../../docs/guides/tools/)

## License

MIT

