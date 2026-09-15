import path from 'path';
import chalk from 'chalk';
import { exitWithCommandError } from '../utils/command-errors.js';
import { pathExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { detectPackageManager, runScript } from '../utils/package-manager.js';

export interface NamedTestOptions {
  watch?: boolean;
}

export interface NamedTestConvention {
  noun: string;
  testDirectory: string;
  creationHint: string;
}

export async function runNamedTestCommand(
  name: string,
  options: NamedTestOptions,
  convention: NamedTestConvention
): Promise<void> {
  try {
    logger.header(`🧪 Test ${convention.noun}`);

    const cwd = process.cwd();
    const testFile = path.join(cwd, 'tests', convention.testDirectory, `${name}.test.ts`);

    if (!(await pathExists(testFile))) {
      logger.error(`Test file not found: ${testFile}`);
      logger.info(`Create tests with: ${chalk.cyan(convention.creationHint)}`);
      return exitWithCommandError(`Test file not found: ${testFile}`, { logError: false });
    }

    logger.info(`Testing ${convention.noun.toLowerCase()}: ${chalk.cyan(name)}`);
    logger.info(`Watch mode: ${options.watch ? 'Yes' : 'No'}`);
    logger.newLine();

    const packageManager = await detectPackageManager(cwd);

    logger.startSpinner('Running tests...');

    const testCommand = options.watch ? 'test:watch' : 'test';
    process.env.TEST_FILE = testFile;

    await runScript(cwd, testCommand, packageManager);

    logger.succeedSpinner('Tests completed');
  } catch (error: unknown) {
    return exitWithCommandError(error, { spinnerFailureText: 'Tests failed' });
  }
}
