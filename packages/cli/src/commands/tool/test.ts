import path from 'path';
import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import { runScript, detectPackageManager } from '../../utils/package-manager.js';
import { pathExists } from '../../utils/fs.js';

interface ToolTestOptions {
  watch?: boolean;
}

export async function toolTestCommand(
  name: string,
  options: ToolTestOptions
): Promise<void> {
  try {
    logger.header('🧪 Test Tool');

    const cwd = process.cwd();
    const testFile = path.join(cwd, 'tests', 'tools', `${name}.test.ts`);

    // Check if test file exists
    if (!(await pathExists(testFile))) {
      logger.error(`Test file not found: ${testFile}`);
      logger.info(`Create tests with: ${chalk.cyan(`agentforge tool:create ${name} --test`)}`);
      process.exit(1);
    }

    logger.info(`Testing tool: ${chalk.cyan(name)}`);
    logger.info(`Watch mode: ${options.watch ? 'Yes' : 'No'}`);
    logger.newLine();

    const packageManager = await detectPackageManager(cwd);

    logger.startSpinner('Running tests...');

    // Run tests for specific file
    const testCommand = options.watch ? 'test:watch' : 'test';
    process.env.TEST_FILE = testFile;

    await runScript(cwd, testCommand, packageManager);

    logger.succeedSpinner('Tests completed');
  } catch (error: any) {
    logger.failSpinner('Tests failed');
    logger.error(error.message);
    process.exit(1);
  }
}

