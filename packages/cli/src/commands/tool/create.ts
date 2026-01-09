import path from 'path';
import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import { promptToolSetup } from '../../utils/prompts.js';
import { writeFile, ensureDir, copyTemplate, getTemplatePath } from '../../utils/fs.js';

interface ToolCreateOptions {
  category?: 'web' | 'data' | 'file' | 'utility';
  structure?: 'single' | 'multi';
  description?: string;
  test?: boolean;
}

export async function toolCreateCommand(
  name: string,
  options: ToolCreateOptions
): Promise<void> {
  try {
    logger.header('🔧 Create Tool');

    // Prompt for tool setup
    const answers = await promptToolSetup({
      name,
      category: options.category,
      structure: options.structure,
      description: options.description,
      generateTests: options.test,
    });

    logger.newLine();
    logger.info(`Creating tool: ${chalk.cyan(answers.name)}`);
    logger.info(`Category: ${chalk.cyan(answers.category)}`);
    logger.info(`Structure: ${chalk.cyan(answers.structure)}`);
    logger.newLine();

    const cwd = process.cwd();

    if (answers.structure === 'multi') {
      // Multi-file structure
      await createMultiFileTool(cwd, answers);
    } else {
      // Single-file structure (existing behavior)
      await createSingleFileTool(cwd, answers);
    }

    logger.newLine();
    logger.success(chalk.bold.green('✨ Tool created successfully!'));
    logger.newLine();
    logger.header('📝 Next Steps');

    const nextSteps = answers.structure === 'multi'
      ? [
          `Edit ${chalk.cyan(`src/tools/${answers.name}/index.ts`)} to implement your tool`,
          `Add providers in ${chalk.cyan(`src/tools/${answers.name}/providers/`)}`,
          `Define types in ${chalk.cyan(`src/tools/${answers.name}/types.ts`)}`,
          answers.generateTests
            ? `Run ${chalk.cyan(`pnpm test ${answers.name}`)} to test your tool`
            : '',
          `Register the tool in your agent's tool registry`,
        ]
      : [
          `Edit ${chalk.cyan(`src/tools/${answers.name}.ts`)} to implement your tool`,
          answers.generateTests
            ? `Run ${chalk.cyan(`pnpm test tests/tools/${answers.name}.test.ts`)} to test your tool`
            : '',
          `Register the tool in your agent's tool registry`,
        ];

    logger.list(nextSteps.filter(Boolean));
  } catch (error: any) {
    logger.error(`Failed to create tool: ${error.message}`);
    process.exit(1);
  }
}

function generateToolContent(
  name: string,
  category: string,
  description: string
): string {
  return `import { z } from 'zod';
import { createTool } from '@agentforge/core';

/**
 * ${description}
 * Category: ${category}
 */
export const ${name}Tool = createTool()
  .name('${name}')
  .description('${description}')
  .category('${category}')
  .schema(
    z.object({
      // Define your input schema here
      input: z.string().describe('Input parameter'),
    })
  )
  .implement(async ({ input }) => {
    // Implement your tool logic here
    return \`Processed: \${input}\`;
  })
  .build();
`;
}

function generateTestContent(name: string): string {
  return `import { describe, it, expect } from 'vitest';
import { ${name}Tool } from '../../src/tools/${name}.js';

describe('${capitalize(name)} Tool', () => {
  it('should have correct metadata', () => {
    expect(${name}Tool.name).toBe('${name}');
    expect(${name}Tool.description).toBeDefined();
  });

  it('should execute successfully', async () => {
    const result = await ${name}Tool.invoke({
      input: 'test',
    });

    expect(result).toBeDefined();
  });

  // Add more tests here
});
`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Create a single-file tool (existing behavior)
 */
async function createSingleFileTool(
  cwd: string,
  answers: { name: string; category: string; description: string; generateTests: boolean }
): Promise<void> {
  const toolDir = path.join(cwd, 'src', 'tools');
  const toolFile = path.join(toolDir, `${answers.name}.ts`);

  // Create tool file
  logger.startSpinner('Creating tool file...');
  await ensureDir(toolDir);

  const toolContent = generateToolContent(answers.name, answers.category, answers.description);
  await writeFile(toolFile, toolContent);

  logger.succeedSpinner('Tool file created');

  // Create test file
  if (answers.generateTests) {
    logger.startSpinner('Creating test file...');
    const testDir = path.join(cwd, 'tests', 'tools');
    const testFile = path.join(testDir, `${answers.name}.test.ts`);
    await ensureDir(testDir);

    const testContent = generateTestContent(answers.name);
    await writeFile(testFile, testContent);

    logger.succeedSpinner('Test file created');
  }
}

/**
 * Create a multi-file tool using template
 */
async function createMultiFileTool(
  cwd: string,
  answers: { name: string; category: string; description: string; generateTests: boolean }
): Promise<void> {
  const toolDir = path.join(cwd, 'src', 'tools', answers.name);

  // Create tool directory from template
  logger.startSpinner('Creating tool directory structure...');
  await ensureDir(toolDir);

  const templatePath = getTemplatePath('tool-multi');

  // Prepare replacements
  const replacements = {
    TOOL_NAME: answers.name,
    TOOL_NAME_PASCAL: capitalize(answers.name),
    TOOL_NAME_CAMEL: answers.name.charAt(0).toLowerCase() + answers.name.slice(1),
    TOOL_DESCRIPTION: answers.description,
    TOOL_CATEGORY: answers.category,
  };

  await copyTemplate(templatePath, toolDir, replacements);

  logger.succeedSpinner('Tool directory structure created');

  // Remove test files if not needed
  if (!answers.generateTests) {
    logger.startSpinner('Cleaning up test files...');
    const fs = await import('fs-extra');
    const testDir = path.join(toolDir, '__tests__');
    await fs.remove(testDir);
    logger.succeedSpinner('Test files removed');
  }
}

