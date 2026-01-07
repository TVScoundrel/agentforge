import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

export type PackageManager = 'npm' | 'pnpm' | 'yarn';

export async function detectPackageManager(cwd: string = process.cwd()): Promise<PackageManager> {
  // Check for lock files
  if (await fs.pathExists(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (await fs.pathExists(path.join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  if (await fs.pathExists(path.join(cwd, 'package-lock.json'))) {
    return 'npm';
  }

  // Check if package managers are available
  try {
    await execa('pnpm', ['--version']);
    return 'pnpm';
  } catch {
    // pnpm not available
  }

  try {
    await execa('yarn', ['--version']);
    return 'yarn';
  } catch {
    // yarn not available
  }

  return 'npm';
}

export async function installDependencies(
  cwd: string,
  packageManager: PackageManager = 'pnpm'
): Promise<void> {
  const commands: Record<PackageManager, string[]> = {
    npm: ['install'],
    pnpm: ['install'],
    yarn: ['install'],
  };

  await execa(packageManager, commands[packageManager], {
    cwd,
    stdio: 'inherit',
  });
}

export async function addDependency(
  cwd: string,
  dependency: string,
  options: {
    dev?: boolean;
    packageManager?: PackageManager;
  } = {}
): Promise<void> {
  const pm = options.packageManager || (await detectPackageManager(cwd));
  const isDev = options.dev || false;

  const commands: Record<PackageManager, string[]> = {
    npm: ['install', isDev ? '--save-dev' : '--save', dependency],
    pnpm: ['add', isDev ? '-D' : '', dependency].filter(Boolean),
    yarn: ['add', isDev ? '--dev' : '', dependency].filter(Boolean),
  };

  await execa(pm, commands[pm], {
    cwd,
    stdio: 'inherit',
  });
}

export async function runScript(
  cwd: string,
  script: string,
  packageManager: PackageManager = 'pnpm'
): Promise<void> {
  const commands: Record<PackageManager, string[]> = {
    npm: ['run', script],
    pnpm: ['run', script],
    yarn: ['run', script],
  };

  await execa(packageManager, commands[packageManager], {
    cwd,
    stdio: 'inherit',
  });
}

export function getInstallCommand(packageManager: PackageManager): string {
  const commands: Record<PackageManager, string> = {
    npm: 'npm install',
    pnpm: 'pnpm install',
    yarn: 'yarn install',
  };

  return commands[packageManager];
}

export function getRunCommand(packageManager: PackageManager, script: string): string {
  const commands: Record<PackageManager, string> = {
    npm: `npm run ${script}`,
    pnpm: `pnpm ${script}`,
    yarn: `yarn ${script}`,
  };

  return commands[packageManager];
}

