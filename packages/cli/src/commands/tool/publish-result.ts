import chalk from 'chalk';
import { exitWithCommandError, getErrorMessage } from '../../utils/command-errors.js';
import { logger } from '../../utils/logger.js';
import { publishPackage } from '../../utils/package-manager.js';
import type { ToolPublishOptions } from './publish-types.js';

export async function publishToolPackage(
  toolPath: string,
  options: ToolPublishOptions
): Promise<void> {
  logger.startSpinner(options.dryRun ? 'Running dry-run publish...' : 'Publishing to npm...');

  try {
    await publishPackage(toolPath, {
      tag: options.tag,
      access: 'public',
      dryRun: options.dryRun,
    });

    logger.succeedSpinner(
      options.dryRun
        ? 'Dry-run completed - no actual publishing occurred'
        : 'Published to npm'
    );
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    logger.failSpinner('Publishing failed');
    logPublishError(errorMessage);
    return exitWithCommandError(error, { logError: false });
  }
}

export function logPublishSummary(name: string, options: ToolPublishOptions): void {
  logger.newLine();

  if (options.dryRun) {
    logger.success(chalk.bold.green('✨ Dry-run completed successfully!'));
    logger.newLine();
    logger.info('No changes were made. Remove --dry-run to publish for real.');
    return;
  }

  logger.success(chalk.bold.green('✨ Tool published successfully!'));
  logger.newLine();
  logger.info(`Published ${chalk.cyan(name)} with tag ${chalk.cyan(options.tag || 'latest')}`);
  logger.info('Users can now install with: npm install ' + name);
}

function logPublishError(errorMessage: string): void {
  if (errorMessage.includes('ENEEDAUTH') || errorMessage.includes('E401')) {
    logger.error('Not authenticated with npm');
    logger.info('Run: npm login');
    return;
  }

  if (errorMessage.includes('E403')) {
    logger.error('Permission denied - you may not have access to publish this package');
    logger.info('Check package name and npm organization permissions');
    return;
  }

  if (errorMessage.includes('EPUBLISHCONFLICT') || errorMessage.includes('E409')) {
    logger.error('Version already published');
    logger.info('Update the version in package.json before publishing');
    return;
  }

  logger.error(errorMessage);
}
