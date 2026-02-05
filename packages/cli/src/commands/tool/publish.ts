import path from 'path';
import fs from 'fs-extra';
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

    // Resolve tool path from name argument and get available scripts
    const { toolPath, hasTestScript, hasBuildScript } = await resolveToolPath(name);
    const packageManager = await detectPackageManager(toolPath);

    // Run tests first (only if test script exists)
    if (hasTestScript) {
      logger.startSpinner('Running tests...');
      try {
        await runScript(toolPath, 'test', packageManager);
        logger.succeedSpinner('Tests passed');
      } catch (error) {
        logger.failSpinner('Tests failed');
        logger.error('Cannot publish tool with failing tests');
        process.exit(1);
      }
    } else {
      logger.info('⚠️  Skipping tests (no test script found)');
    }

    // Build the tool (only if build script exists)
    if (hasBuildScript) {
      logger.startSpinner('Building tool...');
      try {
        await runScript(toolPath, 'build', packageManager);
        logger.succeedSpinner('Build completed');
      } catch (error) {
        logger.failSpinner('Build failed');
        process.exit(1);
      }
    } else {
      logger.info('⚠️  Skipping build (no build script found)');
    }

    // Publish to npm
    logger.startSpinner(options.dryRun ? 'Running dry-run publish...' : 'Publishing to npm...');
    try {
      await publishPackage(toolPath, {
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

interface ToolPathInfo {
  toolPath: string;
  hasTestScript: boolean;
  hasBuildScript: boolean;
}

/**
 * Resolve tool path from name argument
 * Tries multiple strategies:
 * 1. If name is a path (contains / or \), use it directly
 * 2. Check if current directory's package.json name matches
 * 3. Look for tool in common locations (./tools/name, ./packages/name, ./name)
 */
async function resolveToolPath(name: string): Promise<ToolPathInfo> {
  const cwd = process.cwd();

  // Strategy 1: If name looks like a path, use it directly
  // Note: Scoped packages like @scope/name should NOT be treated as paths
  const isScopedPackage = /^@[^/]+\/[^/]+$/.test(name);
  const isPath = !isScopedPackage && (name.includes('/') || name.includes('\\'));

  if (isPath) {
    const absolutePath = path.isAbsolute(name) ? name : path.resolve(cwd, name);
    return await validateToolPath(absolutePath, name);
  }

  // Strategy 2: Check if current directory's package.json matches the name
  const cwdPackageJsonPath = path.join(cwd, 'package.json');
  if (await fs.pathExists(cwdPackageJsonPath)) {
    const cwdPackageJson = await fs.readJson(cwdPackageJsonPath);
    if (cwdPackageJson.name === name || cwdPackageJson.name === `@agentforge/${name}`) {
      return await validateToolPath(cwd, name);
    }
  }

  // Strategy 3: Look for tool in common locations
  // For scoped packages (@scope/name), try both the full scoped path and just the package name
  // Most repos store scoped packages in unscoped folders (e.g., packages/my-tool not packages/@scope/my-tool)
  const unscopedName = isScopedPackage ? name.split('/')[1] : name;

  const possiblePaths = [
    path.join(cwd, 'tools', name),
    path.join(cwd, 'packages', name),
    path.join(cwd, name),
  ];

  // For scoped packages, also try unscoped paths
  if (isScopedPackage) {
    possiblePaths.push(
      path.join(cwd, 'tools', unscopedName),
      path.join(cwd, 'packages', unscopedName),
      path.join(cwd, unscopedName)
    );
  }

  for (const possiblePath of possiblePaths) {
    if (await fs.pathExists(possiblePath)) {
      const packageJsonPath = path.join(possiblePath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        return await validateToolPath(possiblePath, name);
      }
    }
  }

  // If we get here, we couldn't find the tool
  logger.error(`Could not find tool package: ${chalk.cyan(name)}`);
  logger.newLine();
  logger.info('Tried the following locations:');
  logger.list([
    `Current directory (${cwd})`,
    ...possiblePaths.map(p => path.relative(cwd, p) || '.'),
  ]);
  logger.newLine();
  logger.info('Make sure you are either:');
  logger.list([
    'In the tool package directory with matching package.json name',
    'Providing a path to the tool package directory',
    'Have the tool in a standard location (./tools/<name>, ./packages/<name>)',
  ]);
  process.exit(1);
}

/**
 * Validate that a tool path exists and has required files
 * Returns information about available scripts
 */
async function validateToolPath(toolPath: string, expectedName: string): Promise<ToolPathInfo> {
  // Check if directory exists
  if (!(await fs.pathExists(toolPath))) {
    logger.error(`Tool directory not found: ${toolPath}`);
    process.exit(1);
  }

  // Check if package.json exists
  const packageJsonPath = path.join(toolPath, 'package.json');
  if (!(await fs.pathExists(packageJsonPath))) {
    logger.error(`package.json not found in: ${toolPath}`);
    logger.info('Tool packages must have a package.json file');
    process.exit(1);
  }

  // Read and validate package.json
  let packageJson: any;
  try {
    packageJson = await fs.readJson(packageJsonPath);
  } catch (error: any) {
    logger.error(`Failed to read package.json: ${error.message}`);
    process.exit(1);
  }

  // Validate package name
  if (!packageJson.name) {
    logger.error('package.json must have a "name" field');
    process.exit(1);
  }

  // Warn if package name doesn't match expected name (but don't fail)
  // This allows for scoped packages like @agentforge/tool-name
  const packageName = packageJson.name;
  const nameMatches =
    packageName === expectedName ||
    packageName === `@agentforge/${expectedName}` ||
    packageName.endsWith(`/${expectedName}`);

  if (!nameMatches) {
    logger.warn(`Package name mismatch: expected ${chalk.cyan(expectedName)}, found ${chalk.cyan(packageName)}`);
    logger.info(`Publishing package: ${chalk.cyan(packageName)}`);
    logger.newLine();
  }

  // Check for available scripts
  const hasTestScript = !!packageJson.scripts?.test;
  const hasBuildScript = !!packageJson.scripts?.build;

  return {
    toolPath,
    hasTestScript,
    hasBuildScript,
  };
}

