import inquirer from 'inquirer';
import type { PackageManager } from './package-manager.js';

export interface ProjectPromptAnswers {
  projectName: string;
  template: 'minimal' | 'full' | 'api' | 'cli';
  packageManager: PackageManager;
  installDependencies: boolean;
  initGit: boolean;
  author?: string;
  description?: string;
}

export async function promptProjectSetup(defaults: Partial<ProjectPromptAnswers> = {}): Promise<ProjectPromptAnswers> {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: defaults.projectName || 'my-agent',
      validate: (input: string) => {
        if (!input) return 'Project name is required';
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Project name must contain only lowercase letters, numbers, and hyphens';
        }
        return true;
      },
    },
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: [
        { name: 'Minimal Starter - Basic ReAct agent', value: 'minimal' },
        { name: 'Full-Featured App - Multi-agent system with all features', value: 'full' },
        { name: 'API Service - Express/Fastify API with agents', value: 'api' },
        { name: 'CLI Tool - Command-line agent application', value: 'cli' },
      ],
      default: defaults.template || 'minimal',
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      choices: ['pnpm', 'npm', 'yarn'],
      default: defaults.packageManager || 'pnpm',
    },
    {
      type: 'confirm',
      name: 'installDependencies',
      message: 'Install dependencies?',
      default: defaults.installDependencies !== false,
    },
    {
      type: 'confirm',
      name: 'initGit',
      message: 'Initialize git repository?',
      default: defaults.initGit !== false,
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author name (optional):',
      default: defaults.author,
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description (optional):',
      default: defaults.description,
    },
  ]);
}

export interface AgentPromptAnswers {
  name: string;
  pattern: 'react' | 'plan-execute' | 'reflection' | 'multi-agent';
  description?: string;
  generateTests: boolean;
}

export async function promptAgentSetup(defaults: Partial<AgentPromptAnswers> = {}): Promise<AgentPromptAnswers> {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Agent name:',
      default: defaults.name,
      validate: (input: string) => {
        if (!input) return 'Agent name is required';
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(input)) {
          return 'Agent name must start with a letter and contain only letters and numbers';
        }
        return true;
      },
    },
    {
      type: 'list',
      name: 'pattern',
      message: 'Agent pattern:',
      choices: [
        { name: 'ReAct - Reasoning and Acting', value: 'react' },
        { name: 'Plan-Execute - Planning and Execution', value: 'plan-execute' },
        { name: 'Reflection - Generate, Reflect, Revise', value: 'reflection' },
        { name: 'Multi-Agent - Supervisor and Workers', value: 'multi-agent' },
      ],
      default: defaults.pattern || 'react',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Agent description (optional):',
      default: defaults.description,
    },
    {
      type: 'confirm',
      name: 'generateTests',
      message: 'Generate tests?',
      default: defaults.generateTests !== false,
    },
  ]);
}

export interface ToolPromptAnswers {
  name: string;
  category: 'web' | 'data' | 'file' | 'utility';
  description: string;
  structure: 'single' | 'multi';
  generateTests: boolean;
}

export async function promptToolSetup(defaults: Partial<ToolPromptAnswers> = {}): Promise<ToolPromptAnswers> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Tool name:',
      default: defaults.name,
      when: () => !defaults.name,
      validate: (input: string) => {
        if (!input) return 'Tool name is required';
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(input)) {
          return 'Tool name must start with a letter and contain only letters and numbers';
        }
        return true;
      },
    },
    {
      type: 'list',
      name: 'category',
      message: 'Tool category:',
      choices: [
        { name: 'Web - HTTP, scraping, parsing', value: 'web' },
        { name: 'Data - JSON, CSV, XML processing', value: 'data' },
        { name: 'File - File operations', value: 'file' },
        { name: 'Utility - General utilities', value: 'utility' },
      ],
      default: defaults.category || 'utility',
      when: () => !defaults.category,
    },
    {
      type: 'input',
      name: 'description',
      message: 'Tool description:',
      default: defaults.description,
      when: () => !defaults.description,
      validate: (input: string) => {
        if (!input) return 'Tool description is required';
        return true;
      },
    },
    {
      type: 'list',
      name: 'structure',
      message: 'Tool structure:',
      choices: [
        {
          name: 'Single file - Simple tools (<150 lines, single responsibility)',
          value: 'single'
        },
        {
          name: 'Multi-file - Complex tools (multiple providers, >150 lines)',
          value: 'multi'
        },
      ],
      default: defaults.structure || 'single',
      when: () => !defaults.structure,
    },
    {
      type: 'confirm',
      name: 'generateTests',
      message: 'Generate tests?',
      default: defaults.generateTests !== false,
      when: () => defaults.generateTests === undefined,
    },
  ]);

  // Merge defaults with answers (for skipped prompts)
  return {
    name: defaults.name || answers.name,
    category: defaults.category || answers.category,
    description: defaults.description || answers.description,
    structure: defaults.structure || answers.structure,
    generateTests: defaults.generateTests !== undefined ? defaults.generateTests : answers.generateTests,
  };
}

