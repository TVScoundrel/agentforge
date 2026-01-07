import path from 'path';
import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import { promptAgentSetup } from '../../utils/prompts.js';
import { writeFile, ensureDir } from '../../utils/fs.js';

interface AgentCreateOptions {
  pattern?: 'react' | 'plan-execute' | 'reflection' | 'multi-agent';
  test?: boolean;
}

export async function agentCreateCommand(
  name: string,
  options: AgentCreateOptions
): Promise<void> {
  try {
    logger.header('🤖 Create Agent');

    // Prompt for agent setup
    const answers = await promptAgentSetup({
      name,
      pattern: options.pattern,
      generateTests: options.test,
    });

    logger.newLine();
    logger.info(`Creating agent: ${chalk.cyan(answers.name)}`);
    logger.info(`Pattern: ${chalk.cyan(answers.pattern)}`);
    logger.newLine();

    const cwd = process.cwd();
    const agentDir = path.join(cwd, 'src', 'agents');
    const agentFile = path.join(agentDir, `${answers.name}.ts`);

    // Create agent file
    logger.startSpinner('Creating agent file...');
    await ensureDir(agentDir);

    const agentContent = generateAgentContent(answers.name, answers.pattern, answers.description);
    await writeFile(agentFile, agentContent);

    logger.succeedSpinner('Agent file created');

    // Create test file
    if (answers.generateTests) {
      logger.startSpinner('Creating test file...');
      const testDir = path.join(cwd, 'tests', 'agents');
      const testFile = path.join(testDir, `${answers.name}.test.ts`);
      await ensureDir(testDir);

      const testContent = generateTestContent(answers.name, answers.pattern);
      await writeFile(testFile, testContent);

      logger.succeedSpinner('Test file created');
    }

    logger.newLine();
    logger.success(chalk.bold.green('✨ Agent created successfully!'));
    logger.newLine();
    logger.header('📝 Next Steps');
    logger.list([
      `Edit ${chalk.cyan(`src/agents/${answers.name}.ts`)} to customize your agent`,
      answers.generateTests
        ? `Run ${chalk.cyan(`pnpm test tests/agents/${answers.name}.test.ts`)} to test your agent`
        : '',
    ].filter(Boolean));
  } catch (error: any) {
    logger.error(`Failed to create agent: ${error.message}`);
    process.exit(1);
  }
}

function generateAgentContent(
  name: string,
  pattern: string,
  description?: string
): string {
  const patterns: Record<string, string> = {
    'react': `import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

/**
 * ${description || `${name} agent using ReAct pattern`}
 */
export async function create${capitalize(name)}Agent() {
  const model = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  const agent = createReActAgent({
    model,
    tools: [],
    // Add your configuration here
  });

  return agent;
}
`,
    'plan-execute': `import { createPlanExecuteAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

/**
 * ${description || `${name} agent using Plan-Execute pattern`}
 */
export async function create${capitalize(name)}Agent() {
  const model = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  const agent = createPlanExecuteAgent({
    model,
    tools: [],
    // Add your configuration here
  });

  return agent;
}
`,
    'reflection': `import { createReflectionAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

/**
 * ${description || `${name} agent using Reflection pattern`}
 */
export async function create${capitalize(name)}Agent() {
  const model = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  const agent = createReflectionAgent({
    model,
    // Add your configuration here
  });

  return agent;
}
`,
    'multi-agent': `import { createMultiAgentSystem } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

/**
 * ${description || `${name} multi-agent system`}
 */
export async function create${capitalize(name)}System() {
  const model = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  const system = createMultiAgentSystem({
    model,
    workers: [],
    // Add your configuration here
  });

  return system;
}
`,
  };

  return patterns[pattern] || patterns['react'];
}

function generateTestContent(name: string, pattern: string): string {
  return `import { describe, it, expect } from 'vitest';
import { create${capitalize(name)}${pattern === 'multi-agent' ? 'System' : 'Agent'} } from '../../src/agents/${name}.js';

describe('${capitalize(name)} ${pattern === 'multi-agent' ? 'System' : 'Agent'}', () => {
  it('should create agent successfully', async () => {
    const agent = await create${capitalize(name)}${pattern === 'multi-agent' ? 'System' : 'Agent'}();
    expect(agent).toBeDefined();
  });

  // Add more tests here
});
`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

