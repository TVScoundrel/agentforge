import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectPackageManager,
  getInstallCommand,
  getRunCommand,
  installDependencies,
  addDependency,
  runScript,
  publishPackage,
  type PackageManager,
} from '../../src/utils/package-manager.js';
import fs from 'fs-extra';
import { execa } from 'execa';

vi.mock('fs-extra');
vi.mock('execa');

describe('Package Manager Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectPackageManager', () => {
    it('should detect pnpm from lock file', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (path: any) => {
        return path.includes('pnpm-lock.yaml');
      });

      const pm = await detectPackageManager('/test');
      expect(pm).toBe('pnpm');
    });

    it('should detect yarn from lock file', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (path: any) => {
        return path.includes('yarn.lock');
      });

      const pm = await detectPackageManager('/test');
      expect(pm).toBe('yarn');
    });

    it('should detect npm from lock file', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (path: any) => {
        return path.includes('package-lock.json');
      });

      const pm = await detectPackageManager('/test');
      expect(pm).toBe('npm');
    });

    it('should detect pnpm from availability', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '8.0.0' } as any);

      const pm = await detectPackageManager('/test');
      expect(pm).toBe('pnpm');
    });

    it('should detect yarn from availability', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(execa)
        .mockRejectedValueOnce(new Error('pnpm not found'))
        .mockResolvedValueOnce({ stdout: '1.22.0' } as any);

      const pm = await detectPackageManager('/test');
      expect(pm).toBe('yarn');
    });

    it('should default to npm', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(execa).mockRejectedValue(new Error('not found'));

      const pm = await detectPackageManager('/test');
      expect(pm).toBe('npm');
    });
  });

  describe('getInstallCommand', () => {
    it('should return npm install command', () => {
      expect(getInstallCommand('npm')).toBe('npm install');
    });

    it('should return pnpm install command', () => {
      expect(getInstallCommand('pnpm')).toBe('pnpm install');
    });

    it('should return yarn install command', () => {
      expect(getInstallCommand('yarn')).toBe('yarn install');
    });
  });

  describe('getRunCommand', () => {
    it('should return npm run command', () => {
      expect(getRunCommand('npm', 'build')).toBe('npm run build');
    });

    it('should return pnpm run command', () => {
      expect(getRunCommand('pnpm', 'build')).toBe('pnpm build');
    });

    it('should return yarn run command', () => {
      expect(getRunCommand('yarn', 'build')).toBe('yarn build');
    });
  });

  describe('installDependencies', () => {
    it('should install dependencies with npm', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await installDependencies('/test', 'npm');

      expect(execa).toHaveBeenCalledWith('npm', ['install'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should install dependencies with pnpm', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await installDependencies('/test', 'pnpm');

      expect(execa).toHaveBeenCalledWith('pnpm', ['install'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should install dependencies with yarn', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await installDependencies('/test', 'yarn');

      expect(execa).toHaveBeenCalledWith('yarn', ['install'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should default to pnpm', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await installDependencies('/test');

      expect(execa).toHaveBeenCalledWith('pnpm', ['install'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });
  });

  describe('addDependency', () => {
    it('should add production dependency with npm', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(execa).mockResolvedValue({} as any);

      await addDependency('/test', 'lodash', { packageManager: 'npm' });

      expect(execa).toHaveBeenCalledWith('npm', ['install', '--save', 'lodash'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should add dev dependency with npm', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(execa).mockResolvedValue({} as any);

      await addDependency('/test', 'vitest', { packageManager: 'npm', dev: true });

      expect(execa).toHaveBeenCalledWith('npm', ['install', '--save-dev', 'vitest'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should add production dependency with pnpm', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(execa).mockResolvedValue({} as any);

      await addDependency('/test', 'lodash', { packageManager: 'pnpm' });

      expect(execa).toHaveBeenCalledWith('pnpm', ['add', 'lodash'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should add dev dependency with pnpm', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(execa).mockResolvedValue({} as any);

      await addDependency('/test', 'vitest', { packageManager: 'pnpm', dev: true });

      expect(execa).toHaveBeenCalledWith('pnpm', ['add', '-D', 'vitest'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should add production dependency with yarn', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(execa).mockResolvedValue({} as any);

      await addDependency('/test', 'lodash', { packageManager: 'yarn' });

      expect(execa).toHaveBeenCalledWith('yarn', ['add', 'lodash'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should add dev dependency with yarn', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(execa).mockResolvedValue({} as any);

      await addDependency('/test', 'vitest', { packageManager: 'yarn', dev: true });

      expect(execa).toHaveBeenCalledWith('yarn', ['add', '--dev', 'vitest'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should auto-detect package manager', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (path: any) => {
        return path.includes('pnpm-lock.yaml');
      });
      vi.mocked(execa).mockResolvedValue({} as any);

      await addDependency('/test', 'lodash');

      expect(execa).toHaveBeenCalledWith('pnpm', ['add', 'lodash'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });
  });

  describe('runScript', () => {
    it('should run script with npm', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await runScript('/test', 'build', 'npm');

      expect(execa).toHaveBeenCalledWith('npm', ['run', 'build'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should run script with pnpm', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await runScript('/test', 'build', 'pnpm');

      expect(execa).toHaveBeenCalledWith('pnpm', ['run', 'build'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should run script with yarn', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await runScript('/test', 'test', 'yarn');

      expect(execa).toHaveBeenCalledWith('yarn', ['run', 'test'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should default to pnpm', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await runScript('/test', 'lint');

      expect(execa).toHaveBeenCalledWith('pnpm', ['run', 'lint'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });
  });

  describe('publishPackage', () => {
    it('should publish with default options', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await publishPackage('/test');

      expect(execa).toHaveBeenCalledWith('npm', ['publish', '--access', 'public', '--tag', 'latest'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should publish with custom tag', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await publishPackage('/test', { tag: 'beta' });

      expect(execa).toHaveBeenCalledWith('npm', ['publish', '--access', 'public', '--tag', 'beta'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should publish with restricted access', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await publishPackage('/test', { access: 'restricted' });

      expect(execa).toHaveBeenCalledWith('npm', ['publish', '--access', 'restricted', '--tag', 'latest'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should run dry-run publish', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await publishPackage('/test', { dryRun: true });

      expect(execa).toHaveBeenCalledWith('npm', ['publish', '--access', 'public', '--tag', 'latest', '--dry-run'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });

    it('should publish with all options', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);

      await publishPackage('/test', {
        tag: 'next',
        access: 'restricted',
        dryRun: true,
      });

      expect(execa).toHaveBeenCalledWith('npm', ['publish', '--access', 'restricted', '--tag', 'next', '--dry-run'], {
        cwd: '/test',
        stdio: 'inherit',
      });
    });
  });
});

