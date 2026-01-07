import path from 'path';
import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import { promptToolSetup } from '../../utils/prompts.js';
import { writeFile, ensureDir } from '../../utils/fs.js';

interface ToolCreateOptions {
  category?: 'web' | 'data' | 'file' | 'utility';
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
      generateTests: options.test,
    });

    logger.newLine();
    logger.info(`Creating tool: ${chalk.cyan(answers.name)}`);
    logger.info(`Category: ${chalk.cyan(answers.category)}`);
    logger.newLine();

    const cwd = process.cwd();
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

    logger.newLine();
    logger.success(chalk.bold.green('✨ Tool created successfully!'));
    logger.newLine();
    logger.header('📝 Next Steps');
    logger.list([
      `Edit ${chalk.cyan(`src/tools/${answers.name}.ts`)} to implement your tool`,
      answers.generateTests
        ? `Run ${chalk.cyan(`pnpm test tests/tools/${answers.name}.test.ts`)} to test your tool`
        : '',
      `Register the tool in your agent's tool registry`,
    ].filter(Boolean));
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

