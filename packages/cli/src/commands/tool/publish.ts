import chalk from 'chalk';
import { exitWithCommandError } from '../../utils/command-errors.js';
import { logger } from '../../utils/logger.js';
import { detectPackageManager } from '../../utils/package-manager.js';
import { resolveToolPath } from './publish-path.js';
import { runPublishPreflight } from './publish-preflight.js';
import { publishToolPackage, logPublishSummary } from './publish-result.js';
import type { ToolPublishOptions } from './publish-types.js';

export async function toolPublishCommand(
  name: string,
  options: ToolPublishOptions
): Promise<void> {
  try {
    logPublishHeader(name, options);

    const toolInfo = await resolveToolPath(name);
    const packageManager = await detectPackageManager(toolInfo.toolPath);

    await runPublishPreflight(toolInfo.toolPath, packageManager, toolInfo);
    await publishToolPackage(toolInfo.toolPath, options);
    logPublishSummary(name, options);
  } catch (error: unknown) {
    return exitWithCommandError(error, { spinnerFailureText: 'Publishing failed' });
  }
}

function logPublishHeader(name: string, options: ToolPublishOptions): void {
  logger.header('📦 Publish Tool');
  logger.info(`Tool: ${chalk.cyan(name)}`);
  logger.info(`Tag: ${chalk.cyan(options.tag || 'latest')}`);
  logger.info(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
  logger.newLine();

  if (options.dryRun) {
    logger.warn('Dry run mode - no actual publishing will occur');
    logger.newLine();
  }
}
