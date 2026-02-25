import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create.js';
import { devCommand } from './commands/dev.js';
import { buildCommand } from './commands/build.js';
import { testCommand } from './commands/test.js';
import { lintCommand } from './commands/lint.js';
import { agentCreateCommand } from './commands/agent/create.js';
import { agentCreateReusableCommand } from './commands/agent/create-reusable.js';
import { agentListCommand } from './commands/agent/list.js';
import { agentTestCommand } from './commands/agent/test.js';
import { agentDeployCommand } from './commands/agent/deploy.js';
import { toolCreateCommand } from './commands/tool/create.js';
import { toolListCommand } from './commands/tool/list.js';
import { toolTestCommand } from './commands/tool/test.js';
import { toolPublishCommand } from './commands/tool/publish.js';

const program = new Command();

program
  .name('agentforge')
  .description('CLI tool for AgentForge - scaffolding and development')
  .version('0.1.0');

// Project scaffolding
program
  .command('create <project-name>')
  .description('Create a new AgentForge project')
  .option('-t, --template <template>', 'Project template (minimal, full, api, cli)', 'minimal')
  .option('-p, --package-manager <pm>', 'Package manager (npm, pnpm, yarn)', 'pnpm')
  .option('--no-install', 'Skip dependency installation')
  .option('--no-git', 'Skip git initialization')
  .action(createCommand);

// Development commands
program
  .command('dev')
  .description('Start development server with hot reload')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('--no-open', 'Do not open browser')
  .action(devCommand);

program
  .command('build')
  .description('Build for production')
  .option('--no-minify', 'Skip minification')
  .option('--no-sourcemap', 'Skip sourcemap generation')
  .action(buildCommand);

program
  .command('test')
  .description('Run tests with coverage')
  .option('-w, --watch', 'Watch mode')
  .option('--ui', 'Open test UI')
  .option('--coverage', 'Generate coverage report')
  .action(testCommand);

program
  .command('lint')
  .description('Lint and format code')
  .option('--fix', 'Auto-fix issues')
  .option('--no-format', 'Skip formatting')
  .action(lintCommand);

// Agent management
const agent = program.command('agent').description('Manage agents');

agent
  .command('create <name>')
  .description('Create a new agent')
  .option('-p, --pattern <pattern>', 'Agent pattern (react, plan-execute, reflection, multi-agent)', 'react')
  .option('--no-test', 'Skip test generation')
  .action(agentCreateCommand);

agent
  .command('create-reusable <name>')
  .description('Create a new reusable agent (production template)')
  .option('-d, --description <description>', 'Agent description')
  .option('-a, --author <author>', 'Author name')
  .action(agentCreateReusableCommand);

agent
  .command('list')
  .description('List all agents')
  .option('-v, --verbose', 'Show detailed information')
  .action(agentListCommand);

agent
  .command('test <name>')
  .description('Test a specific agent')
  .option('-w, --watch', 'Watch mode')
  .action(agentTestCommand);

agent
  .command('deploy <name>')
  .description('Deploy an agent')
  .option('-e, --environment <env>', 'Deployment environment', 'production')
  .option('--dry-run', 'Dry run without actual deployment')
  .action(agentDeployCommand);

// Tool management
const tool = program.command('tool').description('Manage tools');

tool
  .command('create <name>')
  .description('Create a new tool')
  .option('-c, --category <category>', 'Tool category (web, data, file, utility)', 'utility')
  .option('-s, --structure <structure>', 'Tool structure (single, multi)', 'single')
  .option('-d, --description <description>', 'Tool description')
  .option('--no-test', 'Skip test generation')
  .action(toolCreateCommand);

tool
  .command('list')
  .description('List all tools')
  .option('-c, --category <category>', 'Filter by category')
  .option('-v, --verbose', 'Show detailed information')
  .action(toolListCommand);

tool
  .command('test <name>')
  .description('Test a specific tool')
  .option('-w, --watch', 'Watch mode')
  .action(toolTestCommand);

tool
  .command('publish <name>')
  .description('Publish a tool to npm')
  .option('--tag <tag>', 'npm tag', 'latest')
  .option('--dry-run', 'Dry run without actual publishing')
  .action(toolPublishCommand);

// Error handling
program.exitOverride();

export async function run() {
  try {
    await program.parseAsync(process.argv);
  } catch (error: any) {
    if (error.code !== 'commander.help' && error.code !== 'commander.version') {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  }
}

// Export for testing
export { program };

