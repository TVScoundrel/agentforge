import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toolPublishCommand } from '../../../src/commands/tool/publish.js';
import * as packageManager from '../../../src/utils/package-manager.js';
import * as logger from '../../../src/utils/logger.js';
import fs from 'fs-extra';

vi.mock('../../../src/utils/package-manager.js');
vi.mock('../../../src/utils/logger.js');
vi.mock('fs-extra');

describe('tool:publish command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Default mocks for fs operations
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(fs.readJson).mockResolvedValue({
      name: 'myTool',
      version: '1.0.0',
      scripts: {
        test: 'vitest',
        build: 'tsup',
      },
    });
  });

  it('should publish tool successfully', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();
    vi.mocked(packageManager.publishPackage).mockResolvedValue();

    await toolPublishCommand('myTool', {});

    expect(packageManager.runScript).toHaveBeenCalledWith(expect.any(String), 'test', 'pnpm');
    expect(packageManager.runScript).toHaveBeenCalledWith(expect.any(String), 'build', 'pnpm');
    expect(packageManager.publishPackage).toHaveBeenCalledWith(expect.any(String), {
      tag: undefined,
      access: 'public',
      dryRun: undefined,
    });
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Tests passed');
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Build completed');
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Published to npm');
    expect(logger.logger.success).toHaveBeenCalled();
  });

  it('should publish with custom tag', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('npm');
    vi.mocked(packageManager.runScript).mockResolvedValue();
    vi.mocked(packageManager.publishPackage).mockResolvedValue();

    await toolPublishCommand('myTool', { tag: 'beta' });

    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('beta'));
    expect(packageManager.publishPackage).toHaveBeenCalledWith(expect.any(String), {
      tag: 'beta',
      access: 'public',
      dryRun: undefined,
    });
  });

  it('should run in dry-run mode', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();
    vi.mocked(packageManager.publishPackage).mockResolvedValue();

    await toolPublishCommand('myTool', { dryRun: true });

    expect(logger.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Dry run'));
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Tests passed');
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Build completed');
    expect(packageManager.publishPackage).toHaveBeenCalledWith(expect.any(String), {
      tag: undefined,
      access: 'public',
      dryRun: true,
    });
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Dry-run completed - no actual publishing occurred');
  });

  it('should fail when tests fail', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockRejectedValueOnce(new Error('Tests failed'));

    await toolPublishCommand('failingTool', {});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Tests failed');
    expect(logger.logger.error).toHaveBeenCalledWith(expect.stringContaining('Cannot publish'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should fail when build fails', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript)
      .mockResolvedValueOnce() // tests pass
      .mockRejectedValueOnce(new Error('Build failed')); // build fails

    await toolPublishCommand('buildFailTool', {});

    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Tests passed');
    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Build failed');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should fail when npm publish fails', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();
    vi.mocked(packageManager.publishPackage).mockRejectedValue(new Error('E403 Forbidden'));

    await toolPublishCommand('forbiddenTool', {});

    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Tests passed');
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Build completed');
    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Publishing failed');
    expect(logger.logger.error).toHaveBeenCalledWith('Permission denied - you may not have access to publish this package');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle authentication errors', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();
    vi.mocked(packageManager.publishPackage).mockRejectedValue(new Error('ENEEDAUTH'));

    await toolPublishCommand('unauthTool', {});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Publishing failed');
    expect(logger.logger.error).toHaveBeenCalledWith('Not authenticated with npm');
    expect(logger.logger.info).toHaveBeenCalledWith('Run: npm login');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle version conflict errors', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();
    vi.mocked(packageManager.publishPackage).mockRejectedValue(new Error('EPUBLISHCONFLICT'));

    await toolPublishCommand('conflictTool', {});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Publishing failed');
    expect(logger.logger.error).toHaveBeenCalledWith('Version already published');
    expect(logger.logger.info).toHaveBeenCalledWith('Update the version in package.json before publishing');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(packageManager.detectPackageManager).mockRejectedValue(new Error('PM detection failed'));

    await toolPublishCommand('errorTool', {});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Publishing failed');
    expect(logger.logger.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  describe('path resolution', () => {
    it('should use current directory when package.json name matches', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({
        name: 'myTool',
        version: '1.0.0',
        scripts: { test: 'vitest', build: 'tsup' },
      });
      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand('myTool', {});

      expect(packageManager.publishPackage).toHaveBeenCalledWith(
        process.cwd(),
        expect.any(Object)
      );
    });

    it('should use current directory when package.json has scoped name matching', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({
        name: '@agentforge/myTool',
        version: '1.0.0',
        scripts: { test: 'vitest', build: 'tsup' },
      });
      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand('myTool', {});

      expect(packageManager.publishPackage).toHaveBeenCalledWith(
        process.cwd(),
        expect.any(Object)
      );
    });

    it('should resolve path when name is a relative path', async () => {
      const mockPath = './tools/myTool';
      vi.mocked(fs.readJson).mockResolvedValue({
        name: 'myTool',
        version: '1.0.0',
        scripts: { test: 'vitest', build: 'tsup' },
      });
      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand(mockPath, {});

      expect(packageManager.publishPackage).toHaveBeenCalledWith(
        expect.stringContaining('tools/myTool'),
        expect.any(Object)
      );
    });

    it('should error when package.json not found', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (path: any) => {
        // Return false for package.json, true for directories
        return !path.toString().endsWith('package.json');
      });

      await toolPublishCommand('nonExistent', {});

      expect(logger.logger.error).toHaveBeenCalledWith(expect.stringContaining('Could not find tool package'));
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should error when package.json has no name field', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({
        version: '1.0.0',
        scripts: { test: 'vitest', build: 'tsup' },
      });

      await toolPublishCommand('noName', {});

      expect(logger.logger.error).toHaveBeenCalledWith('package.json must have a "name" field');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should warn when package name does not match argument', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({
        name: 'different-name',
        version: '1.0.0',
        scripts: { test: 'vitest', build: 'tsup' },
      });
      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand('myTool', {});

      expect(logger.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Package name mismatch'));
      expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('different-name'));
    });

    it('should handle scoped package names correctly (not treat as paths)', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({
        name: '@agentforge/myTool',
        version: '1.0.0',
        scripts: { test: 'vitest', build: 'tsup' },
      });
      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand('@agentforge/myTool', {});

      // Should use current directory (not treat @agentforge/myTool as a path)
      expect(packageManager.publishPackage).toHaveBeenCalledWith(
        process.cwd(),
        expect.any(Object)
      );
    });

    it('should handle scoped package names with different scope', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({
        name: '@myorg/custom-tool',
        version: '1.0.0',
        scripts: { test: 'vitest', build: 'tsup' },
      });
      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand('@myorg/custom-tool', {});

      // Should use current directory (not treat @myorg/custom-tool as a path)
      expect(packageManager.publishPackage).toHaveBeenCalledWith(
        process.cwd(),
        expect.any(Object)
      );
    });

    it('should still treat actual paths with slashes as paths', async () => {
      const mockPath = './tools/myTool';
      vi.mocked(fs.readJson).mockResolvedValue({
        name: 'myTool',
        version: '1.0.0',
        scripts: { test: 'vitest', build: 'tsup' },
      });
      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand(mockPath, {});

      // Should resolve the path (not treat as package name)
      expect(packageManager.publishPackage).toHaveBeenCalledWith(
        expect.stringContaining('tools/myTool'),
        expect.any(Object)
      );
    });

    it('should skip build when no build script exists', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({
        name: 'myTool',
        version: '1.0.0',
        scripts: { test: 'vitest' },
      });
      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand('myTool', {});

      // Should run test but not build
      expect(packageManager.runScript).toHaveBeenCalledWith(expect.any(String), 'test', 'pnpm');
      expect(packageManager.runScript).not.toHaveBeenCalledWith(expect.any(String), 'build', 'pnpm');
      expect(logger.logger.info).toHaveBeenCalledWith('⚠️  Skipping build (no build script found)');
      expect(packageManager.publishPackage).toHaveBeenCalled();
    });

    it('should skip test when no test script exists', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({
        name: 'myTool',
        version: '1.0.0',
        scripts: { build: 'tsup' },
      });
      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand('myTool', {});

      // Should run build but not test
      expect(packageManager.runScript).toHaveBeenCalledWith(expect.any(String), 'build', 'pnpm');
      expect(packageManager.runScript).not.toHaveBeenCalledWith(expect.any(String), 'test', 'pnpm');
      expect(logger.logger.info).toHaveBeenCalledWith('⚠️  Skipping tests (no test script found)');
      expect(packageManager.publishPackage).toHaveBeenCalled();
    });

    it('should skip both test and build when neither script exists', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({
        name: 'myTool',
        version: '1.0.0',
        scripts: {},
      });
      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand('myTool', {});

      // Should not run any scripts
      expect(packageManager.runScript).not.toHaveBeenCalled();
      expect(logger.logger.info).toHaveBeenCalledWith('⚠️  Skipping tests (no test script found)');
      expect(logger.logger.info).toHaveBeenCalledWith('⚠️  Skipping build (no build script found)');
      expect(packageManager.publishPackage).toHaveBeenCalled();
    });

    it('should try common tool locations when name does not match cwd', async () => {
      let callCount = 0;
      vi.mocked(fs.pathExists).mockImplementation(async (path: any) => {
        callCount++;
        const pathStr = path.toString();
        // First call is for cwd package.json (exists but name doesn't match)
        // Then it tries ./tools/myTool, ./packages/myTool, ./myTool
        return pathStr.includes('tools/myTool') || pathStr.endsWith('package.json');
      });

      vi.mocked(fs.readJson).mockImplementation(async (path: any) => {
        const pathStr = path.toString();
        if (pathStr.includes('tools/myTool')) {
          return {
            name: 'myTool',
            version: '1.0.0',
            scripts: { test: 'vitest', build: 'tsup' },
          };
        }
        return {
          name: 'wrong-name',
          version: '1.0.0',
          scripts: { test: 'vitest', build: 'tsup' },
        };
      });

      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand('myTool', {});

      expect(packageManager.publishPackage).toHaveBeenCalledWith(
        expect.stringContaining('tools/myTool'),
        expect.any(Object)
      );
    });

    it('should resolve scoped package from unscoped folder in packages/', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (path: any) => {
        const pathStr = path.toString();
        // Scoped path packages/@myorg/my-tool does NOT exist
        // Unscoped path packages/my-tool DOES exist
        return pathStr.includes('packages/my-tool') && !pathStr.includes('@myorg');
      });

      vi.mocked(fs.readJson).mockResolvedValue({
        name: '@myorg/my-tool',
        version: '1.0.0',
        scripts: { test: 'vitest', build: 'tsup' },
      });

      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand('@myorg/my-tool', {});

      // Should find it in packages/my-tool (unscoped folder)
      expect(packageManager.publishPackage).toHaveBeenCalledWith(
        expect.stringContaining('packages/my-tool'),
        expect.any(Object)
      );
    });

    it('should resolve scoped package from unscoped folder in tools/', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (path: any) => {
        const pathStr = path.toString();
        // Scoped path tools/@agentforge/custom does NOT exist
        // Unscoped path tools/custom DOES exist
        return pathStr.includes('tools/custom') && !pathStr.includes('@agentforge');
      });

      vi.mocked(fs.readJson).mockResolvedValue({
        name: '@agentforge/custom',
        version: '1.0.0',
        scripts: { test: 'vitest', build: 'tsup' },
      });

      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand('@agentforge/custom', {});

      // Should find it in tools/custom (unscoped folder)
      expect(packageManager.publishPackage).toHaveBeenCalledWith(
        expect.stringContaining('tools/custom'),
        expect.any(Object)
      );
    });

    it('should prefer scoped folder if it exists over unscoped', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (path: any) => {
        const pathStr = path.toString();
        // Both scoped and unscoped paths exist, should prefer scoped
        return pathStr.includes('packages/@myorg/my-tool') || pathStr.includes('packages/my-tool');
      });

      vi.mocked(fs.readJson).mockResolvedValue({
        name: '@myorg/my-tool',
        version: '1.0.0',
        scripts: { test: 'vitest', build: 'tsup' },
      });

      vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
      vi.mocked(packageManager.runScript).mockResolvedValue();
      vi.mocked(packageManager.publishPackage).mockResolvedValue();

      await toolPublishCommand('@myorg/my-tool', {});

      // Should prefer the scoped folder (checked first)
      expect(packageManager.publishPackage).toHaveBeenCalledWith(
        expect.stringContaining('packages/@myorg/my-tool'),
        expect.any(Object)
      );
    });
  });
});

