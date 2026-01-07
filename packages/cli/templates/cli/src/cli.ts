#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { chatCommand } from './commands/chat.js';
import { analyzeCommand } from './commands/analyze.js';

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

