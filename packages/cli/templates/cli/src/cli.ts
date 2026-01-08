#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { chatCommand } from './commands/chat.js';
import { analyzeCommand } from './commands/analyze.js';

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const missingVars: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    missingVars.push('OPENAI_API_KEY');
  }

  if (missingVars.length > 0) {
    console.error(chalk.red('❌ Error: Missing required environment variables\n'));
    console.error('Missing variables:');
    missingVars.forEach((varName) => {
      console.error(chalk.yellow(`  - ${varName}`));
    });
    console.error(chalk.cyan('\n📝 To fix this:'));
    console.error('  1. Copy .env.example to .env:');
    console.error(chalk.gray('     cp .env.example .env'));
    console.error('  2. Edit .env and add your API keys');
    console.error('  3. Run the application again\n');
    process.exit(1);
  }
}

// Validate environment before starting
validateEnvironment();

const program = new Command();

program
  .name('{{PROJECT_NAME}}')
  .description('{{PROJECT_DESCRIPTION}}')
  .version('0.1.0');

// Chat command
program
  .command('chat')
  .description('Start an interactive chat session')
  .option('-m, --model <model>', 'LLM model to use', 'gpt-4')
  .action(chatCommand);

// Analyze command
program
  .command('analyze <file>')
  .description('Analyze a file using AI')
  .option('-o, --output <file>', 'Output file for results')
  .action(analyzeCommand);

// Parse arguments
program.parse();

