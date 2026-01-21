import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { logger } from '../../utils/logger.js';
import { copyTemplate, getTemplatePath } from '../../utils/fs.js';

interface ReusableAgentCreateOptions {
  description?: string;
  author?: string;
}

export async function agentCreateReusableCommand(
  name: string,
  options: ReusableAgentCreateOptions
): Promise<void> {
  try {
    logger.header('📦 Create Reusable Agent');

    // Prompt for agent details
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Agent name (e.g., customer-support):',
        default: name,
        validate: (input: string) => {
          if (!input) return 'Agent name is required';
          if (!/^[a-z][a-z0-9-]*$/.test(input)) {
            return 'Agent name must be lowercase with hyphens (e.g., customer-support)';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Agent description:',
        default: options.description || `A reusable ${name} agent`,
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name:',
        default: options.author || '',
      },
    ]);

    logger.newLine();
    logger.info(`Creating reusable agent: ${chalk.cyan(answers.name)}`);
    logger.info(`Description: ${chalk.gray(answers.description)}`);
    logger.newLine();

    const cwd = process.cwd();
    const agentDir = path.join(cwd, answers.name);

    // Generate variable names
    const agentNameKebab = answers.name;
    const agentNamePascal = kebabToPascal(agentNameKebab);
    const agentNameCamel = kebabToCamel(agentNameKebab);
    const packageName = `@agentforge/${agentNameKebab}`;

    // Prepare replacements
    const replacements = {
      AGENT_NAME_KEBAB: agentNameKebab,
      AGENT_NAME_PASCAL: agentNamePascal,
      AGENT_NAME_CAMEL: agentNameCamel,
      AGENT_DESCRIPTION: answers.description,
      PACKAGE_NAME: packageName,
      AUTHOR: answers.author || 'Your Name',
    };

    // Copy template
    logger.startSpinner('Creating agent structure...');
    const templatePath = getTemplatePath('reusable-agent');
    await copyTemplate(templatePath, agentDir, replacements);
    logger.succeedSpinner('Agent structure created');

    // Move files from template root to src/
    logger.startSpinner('Organizing files...');
    const fs = await import('fs-extra');
    
    // Move index.ts and prompt-loader.ts to src/
    const srcDir = path.join(agentDir, 'src');
    await fs.ensureDir(srcDir);
    await fs.move(path.join(agentDir, 'index.ts'), path.join(srcDir, 'index.ts'));
    await fs.move(path.join(agentDir, 'prompt-loader.ts'), path.join(srcDir, 'prompt-loader.ts'));
    await fs.move(path.join(agentDir, 'index.test.ts'), path.join(srcDir, 'index.test.ts'));
    
    logger.succeedSpinner('Files organized');

    logger.newLine();
    logger.success(chalk.bold.green('✨ Reusable agent created successfully!'));
    logger.newLine();
    logger.header('📝 Next Steps');
    
    const nextSteps = [
      `cd ${chalk.cyan(answers.name)}`,
      `Install dependencies: ${chalk.cyan('pnpm install')}`,
      `Edit ${chalk.cyan('prompts/system.md')} to customize the agent prompt`,
      `Edit ${chalk.cyan('src/index.ts')} to add tools and configuration`,
      `Run tests: ${chalk.cyan('pnpm test')}`,
      `Build: ${chalk.cyan('pnpm build')}`,
    ];

    logger.list(nextSteps);

    logger.newLine();
    logger.info(chalk.gray('💡 Tip: See examples/reusable-agents/ for reference implementations'));
  } catch (error: any) {
    logger.error(`Failed to create reusable agent: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Convert kebab-case to PascalCase
 */
function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Convert kebab-case to camelCase
 */
function kebabToCamel(str: string): string {
  const pascal = kebabToPascal(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

