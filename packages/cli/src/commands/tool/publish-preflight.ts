import { exitWithCommandError } from '../../utils/command-errors.js';
import { logger } from '../../utils/logger.js';
import { runScript } from '../../utils/package-manager.js';
import type { ToolPathInfo } from './publish-types.js';

type PackageManagerName = Parameters<typeof runScript>[2];

export async function runPublishPreflight(
  toolPath: string,
  packageManager: PackageManagerName,
  toolInfo: ToolPathInfo
): Promise<void> {
  await runOptionalScript({
    enabled: toolInfo.hasTestScript,
    skipMessage: '⚠️  Skipping tests (no test script found)',
    startMessage: 'Running tests...',
    successMessage: 'Tests passed',
    scriptName: 'test',
    toolPath,
    packageManager,
    failureOptions: {
      spinnerFailureText: 'Tests failed',
      message: 'Cannot publish tool with failing tests',
    },
  });

  await runOptionalScript({
    enabled: toolInfo.hasBuildScript,
    skipMessage: '⚠️  Skipping build (no build script found)',
    startMessage: 'Building tool...',
    successMessage: 'Build completed',
    scriptName: 'build',
    toolPath,
    packageManager,
    failureOptions: {
      spinnerFailureText: 'Build failed',
    },
  });
}

interface RunOptionalScriptOptions {
  enabled: boolean;
  skipMessage: string;
  startMessage: string;
  successMessage: string;
  scriptName: 'test' | 'build';
  toolPath: string;
  packageManager: PackageManagerName;
  failureOptions: {
    spinnerFailureText: string;
    message?: string;
  };
}

async function runOptionalScript(options: RunOptionalScriptOptions): Promise<void> {
  if (!options.enabled) {
    logger.info(options.skipMessage);
    return;
  }

  logger.startSpinner(options.startMessage);

  try {
    await runScript(options.toolPath, options.scriptName, options.packageManager);
    logger.succeedSpinner(options.successMessage);
  } catch (error: unknown) {
    return exitWithCommandError(error, options.failureOptions);
  }
}
