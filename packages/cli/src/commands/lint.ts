import { logger } from '../utils/logger.js';
import { runScript, detectPackageManager } from '../utils/package-manager.js';

interface LintOptions {
  fix?: boolean;
  format?: boolean;
}

export async function lintCommand(options: LintOptions): Promise<void> {
  try {
    logger.header('🔍 Linting Code');

    const cwd = process.cwd();
    const packageManager = await detectPackageManager(cwd);

    logger.info(`Auto-fix: ${options.fix ? 'Yes' : 'No'}`);
    logger.info(`Format: ${options.format !== false ? 'Yes' : 'No'}`);
    logger.newLine();

    // Run linter
    logger.startSpinner('Running linter...');
    try {
      await runScript(cwd, options.fix ? 'lint:fix' : 'lint', packageManager);
      logger.succeedSpinner('Linting completed');
    } catch (error) {
      logger.failSpinner('Linting found issues');
      if (!options.fix) {
        logger.info('Run with --fix to automatically fix issues');
      }
    }

    // Run formatter
    if (options.format !== false) {
      logger.startSpinner('Formatting code...');
      try {
        await runScript(cwd, 'format', packageManager);
        logger.succeedSpinner('Formatting completed');
      } catch (error) {
        logger.failSpinner('Formatting failed');
      }
    }

    logger.newLine();
    logger.success('✨ Code quality check completed!');
  } catch (error: any) {
    logger.error(error.message);
    process.exit(1);
  }
}

