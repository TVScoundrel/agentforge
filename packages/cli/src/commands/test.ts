import { logger } from '../utils/logger.js';
import { runScript, detectPackageManager } from '../utils/package-manager.js';

interface TestOptions {
  watch?: boolean;
  ui?: boolean;
  coverage?: boolean;
}

export async function testCommand(options: TestOptions): Promise<void> {
  try {
    logger.header('🧪 Running Tests');

    const cwd = process.cwd();
    const packageManager = await detectPackageManager(cwd);

    logger.info(`Watch mode: ${options.watch ? 'Yes' : 'No'}`);
    logger.info(`UI: ${options.ui ? 'Yes' : 'No'}`);
    logger.info(`Coverage: ${options.coverage ? 'Yes' : 'No'}`);
    logger.newLine();

    logger.startSpinner('Running tests...');

    // Determine which test script to run
    let script = 'test';
    if (options.ui) {
      script = 'test:ui';
    } else if (options.coverage) {
      script = 'test:coverage';
    } else if (options.watch) {
      script = 'test:watch';
    }

    await runScript(cwd, script, packageManager);

    logger.succeedSpinner('Tests completed');
  } catch (error: any) {
    logger.failSpinner('Tests failed');
    logger.error(error.message);
    process.exit(1);
  }
}

