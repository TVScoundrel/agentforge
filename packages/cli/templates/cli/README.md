# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

A command-line interface powered by AgentForge agents.

## Features

- ✅ Interactive chat command
- ✅ File analysis command
- ✅ Commander.js CLI framework
- ✅ Colored output (chalk)
- ✅ Spinners and progress (ora)
- ✅ Interactive prompts (inquirer)
- ✅ ReAct agent integration

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
# Run in development mode
pnpm dev chat

# Build for production
pnpm build

# Run built CLI
pnpm start chat
```

## Commands

### Chat
Start an interactive chat session with the AI:

```bash
{{PROJECT_NAME}} chat

# Use a different model
{{PROJECT_NAME}} chat --model gpt-3.5-turbo
```

### Analyze
Analyze a file using AI:

```bash
{{PROJECT_NAME}} analyze myfile.txt

# Save results to a file
{{PROJECT_NAME}} analyze myfile.txt --output analysis.txt
```

## Project Structure

```
{{PROJECT_NAME}}/
├── src/
│   ├── cli.ts                # CLI entry point
│   └── commands/
│       ├── chat.ts           # Chat command
│       └── analyze.ts        # Analyze command
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Adding Commands

Create a new command file in `src/commands/`:

```typescript
import chalk from 'chalk';
import ora from 'ora';

interface MyCommandOptions {
  option?: string;
}

export async function myCommand(options: MyCommandOptions) {
  console.log(chalk.cyan('Running my command...'));
  
  const spinner = ora('Processing...').start();
  
  try {
    // Command logic here
    spinner.succeed('Done!');
  } catch (error: any) {
    spinner.fail('Failed');
    console.error(chalk.red('Error:'), error.message);
  }
}
```

Then register it in `src/cli.ts`:

```typescript
import { myCommand } from './commands/my-command.js';

program
  .command('my-command')
  .description('Description of my command')
  .option('-o, --option <value>', 'Option description')
  .action(myCommand);
```

## Building for Distribution

```bash
# Build
pnpm build

# Link globally for testing
npm link

# Now you can run from anywhere
{{PROJECT_NAME}} chat
```

## Publishing

```bash
# Update version in package.json
npm version patch

# Publish to npm
npm publish
```

## Learn More

- [AgentForge Documentation](../../docs/)
- [Commander.js Documentation](https://github.com/tj/commander.js)
- [CLI Best Practices](../../docs/guides/cli-best-practices.md)

## License

MIT

