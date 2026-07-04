import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import { exitWithCommandError } from '../../utils/command-errors.js';
import type { ToolPackageJson, ToolPathInfo } from './publish-types.js';

export async function resolveToolPath(name: string): Promise<ToolPathInfo> {
  const cwd = process.cwd();
  const isScopedPackage = /^@[^/]+\/[^/]+$/.test(name);
  const isPath = !isScopedPackage && (name.includes('/') || name.includes('\\'));

  if (isPath) {
    const absolutePath = path.isAbsolute(name) ? name : path.resolve(cwd, name);
    return validateToolPath(absolutePath, name);
  }

  const cwdPackageJsonPath = path.join(cwd, 'package.json');
  if (await fs.pathExists(cwdPackageJsonPath)) {
    const cwdPackageJson = (await fs.readJson(cwdPackageJsonPath)) as ToolPackageJson;
    if (cwdPackageJson.name === name || cwdPackageJson.name === `@agentforge/${name}`) {
      return validateToolPath(cwd, name);
    }
  }

  const possiblePaths = buildPossiblePaths(cwd, name, isScopedPackage);

  for (const possiblePath of possiblePaths) {
    if (await fs.pathExists(possiblePath)) {
      const packageJsonPath = path.join(possiblePath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        return validateToolPath(possiblePath, name);
      }
    }
  }

  logger.error(`Could not find tool package: ${chalk.cyan(name)}`);
  logger.newLine();
  logger.info('Tried the following locations:');
  logger.list([
    `Current directory (${cwd})`,
    ...possiblePaths.map((possiblePath) => path.relative(cwd, possiblePath) || '.'),
  ]);
  logger.newLine();
  logger.info('Make sure you are either:');
  logger.list([
    'In the tool package directory with matching package.json name',
    'Providing a path to the tool package directory',
    'Have the tool in a standard location (./tools/<name>, ./packages/<name>)',
  ]);
  return exitWithCommandError(`Could not find tool package: ${name}`, { logError: false });
}

function buildPossiblePaths(cwd: string, name: string, isScopedPackage: boolean): string[] {
  const possiblePaths = [
    path.join(cwd, 'tools', name),
    path.join(cwd, 'packages', name),
    path.join(cwd, name),
  ];

  if (isScopedPackage) {
    const unscopedName = name.split('/')[1];
    possiblePaths.push(
      path.join(cwd, 'tools', unscopedName),
      path.join(cwd, 'packages', unscopedName),
      path.join(cwd, unscopedName)
    );
  }

  return possiblePaths;
}

async function validateToolPath(toolPath: string, expectedName: string): Promise<ToolPathInfo> {
  if (!(await fs.pathExists(toolPath))) {
    return exitWithCommandError(`Tool directory not found: ${toolPath}`);
  }

  const packageJsonPath = path.join(toolPath, 'package.json');
  if (!(await fs.pathExists(packageJsonPath))) {
    logger.info('Tool packages must have a package.json file');
    return exitWithCommandError(`package.json not found in: ${toolPath}`);
  }

  let packageJson: ToolPackageJson;
  try {
    packageJson = (await fs.readJson(packageJsonPath)) as ToolPackageJson;
  } catch (error: unknown) {
    return exitWithCommandError(error, { prefix: 'Failed to read package.json' });
  }

  if (!packageJson.name) {
    return exitWithCommandError('package.json must have a "name" field');
  }

  logPackageNameMismatch(expectedName, packageJson.name);

  return {
    toolPath,
    hasTestScript: !!packageJson.scripts?.test,
    hasBuildScript: !!packageJson.scripts?.build,
  };
}

function logPackageNameMismatch(expectedName: string, packageName: string): void {
  const nameMatches =
    packageName === expectedName ||
    packageName === `@agentforge/${expectedName}` ||
    packageName.endsWith(`/${expectedName}`);

  if (!nameMatches) {
    logger.warn(`Package name mismatch: expected ${chalk.cyan(expectedName)}, found ${chalk.cyan(packageName)}`);
    logger.info(`Publishing package: ${chalk.cyan(packageName)}`);
    logger.newLine();
  }
}
