# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Features

- ✅ ReAct agent pattern with tool support
- ✅ Example tool implementation
- ✅ Logging and error handling
- ✅ Environment configuration
- ✅ Test suite with Vitest
- ✅ TypeScript support
- ✅ Hot reload development

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- OpenAI API key

### Installation

```bash
pnpm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your-api-key-here
```

### Development

```bash
# Run in development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck

# Lint code
pnpm lint
```

## Project Structure

```
{{PROJECT_NAME}}/
├── src/
│   ├── index.ts              # Main entry point
│   └── tools/
│       └── example.ts        # Example tool
├── tests/
│   └── example.test.ts       # Example tests
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Adding Tools

Create a new tool in `src/tools/`:

```typescript
import { z } from 'zod';
import { createTool } from '@agentforge/core';

export const myTool = createTool()
  .name('my_tool')
  .description('Description of what the tool does')
  .category('utility')
  .schema(
    z.object({
      input: z.string().describe('Input parameter'),
    })
  )
  .implement(async ({ input }) => {
    // Tool implementation
    return `Result: ${input}`;
  })
  .build();
```

Then register it in `src/index.ts`:

```typescript
import { myTool } from './tools/my-tool.js';

const agent = createReActAgent({
  model,
  tools: [exampleTool, myTool],
  // ...
});
```

## Testing

Write tests in the `tests/` directory:

```typescript
import { describe, it, expect } from 'vitest';
import { myTool } from '../src/tools/my-tool.js';

describe('My Tool', () => {
  it('should work correctly', async () => {
    const result = await myTool.invoke({ input: 'test' });
    expect(result).toBeDefined();
  });
});
```

## Deployment

See the [deployment guides](../../templates/deployment/) for deploying to:
- AWS (Lambda, ECS, EKS)
- Google Cloud (Cloud Run, GKE)
- Azure (Container Apps, AKS)

## Learn More

- [AgentForge Documentation](../../docs/)
- [Agent Patterns Guide](../../docs/guides/patterns/)
- [Tool Development Guide](../../docs/guides/tools/)
- [Middleware Guide](../../docs/guides/middleware-guide.md)

## License

MIT

