import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import { runScript, detectPackageManager, publishPackage } from '../../utils/package-manager.js';

interface ToolPublishOptions {
  tag?: string;
  dryRun?: boolean;
}

export async function toolPublishCommand(
  name: string,
  options: ToolPublishOptions
): Promise<void> {
  try {
    logger.header('📦 Publish Tool');

    logger.info(`Tool: ${chalk.cyan(name)}`);
    logger.info(`Tag: ${chalk.cyan(options.tag || 'latest')}`);
    logger.info(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
    logger.newLine();

    if (options.dryRun) {
      logger.warn('Dry run mode - no actual publishing will occur');
      logger.newLine();
    }

    const cwd = process.cwd();
    const packageManager = await detectPackageManager(cwd);

    // Run tests first
    logger.startSpinner('Running tests...');
    try {
      await runScript(cwd, 'test', packageManager);
      logger.succeedSpinner('Tests passed');
    } catch (error) {
      logger.failSpinner('Tests failed');
      logger.error('Cannot publish tool with failing tests');
      process.exit(1);
    }

    // Build the tool
    logger.startSpinner('Building tool...');
    try {
      await runScript(cwd, 'build', packageManager);
      logger.succeedSpinner('Build completed');
    } catch (error) {
      logger.failSpinner('Build failed');
      process.exit(1);
    }

    // Publish to npm
    logger.startSpinner(options.dryRun ? 'Running dry-run publish...' : 'Publishing to npm...');
    try {
      await publishPackage(cwd, {
        tag: options.tag,
        access: 'public',
        dryRun: options.dryRun,
      });

      if (options.dryRun) {
        logger.succeedSpinner('Dry-run completed - no actual publishing occurred');
      } else {
        logger.succeedSpinner('Published to npm');
      }
    } catch (error: any) {
      logger.failSpinner('Publishing failed');

      // Provide helpful error messages for common issues
      if (error.message.includes('ENEEDAUTH') || error.message.includes('E401')) {
        logger.error('Not authenticated with npm');
        logger.info('Run: npm login');
      } else if (error.message.includes('E403')) {
        logger.error('Permission denied - you may not have access to publish this package');
        logger.info('Check package name and npm organization permissions');
      } else if (error.message.includes('EPUBLISHCONFLICT') || error.message.includes('E409')) {
        logger.error('Version already published');
        logger.info('Update the version in package.json before publishing');
      } else {
        logger.error(error.message);
      }

      process.exit(1);
    }

    logger.newLine();

    if (options.dryRun) {
      logger.success(chalk.bold.green('✨ Dry-run completed successfully!'));
      logger.newLine();
      logger.info('No changes were made. Remove --dry-run to publish for real.');
    } else {
      logger.success(chalk.bold.green('✨ Tool published successfully!'));
      logger.newLine();
      logger.info(`Published ${chalk.cyan(name)} with tag ${chalk.cyan(options.tag || 'latest')}`);
      logger.info('Users can now install with: npm install ' + name);
    }
  } catch (error: any) {
    logger.failSpinner('Publishing failed');
    logger.error(error.message);
    process.exit(1);
  }
}

