import { describe, expect, it } from 'vitest';
import { mockedFs, mockedLogger, mockedPackageManager, runPublishCommand, usePublishCommandMocks } from './shared.js';

describe('tool:publish path resolution', () => {
  usePublishCommandMocks();

  it('uses the current directory when package.json matches the tool name', async () => {
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand();

    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(process.cwd(), expect.any(Object));
  });

  it('uses the current directory when package.json has the expected scoped name', async () => {
    mockedFs.readJson.mockResolvedValue({
      name: '@agentforge/myTool',
      version: '1.0.0',
      scripts: { test: 'vitest', build: 'tsup' },
    });
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand();

    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(process.cwd(), expect.any(Object));
  });

  it('resolves relative paths directly', async () => {
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand('./tools/myTool');

    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(
      expect.stringContaining('tools/myTool'),
      expect.any(Object)
    );
  });

  it('fails when the target package cannot be found', async () => {
    mockedFs.pathExists.mockImplementation(async (candidate: string) => !candidate.endsWith('package.json'));

    await runPublishCommand('nonExistent');

    expect(mockedLogger.error).toHaveBeenCalledWith(expect.stringContaining('Could not find tool package'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('fails when package.json has no name field', async () => {
    mockedFs.readJson.mockResolvedValue({
      version: '1.0.0',
      scripts: { test: 'vitest', build: 'tsup' },
    });

    await runPublishCommand('noName');

    expect(mockedLogger.error).toHaveBeenCalledWith('package.json must have a "name" field');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('warns when the package name does not match the argument', async () => {
    mockedFs.readJson.mockResolvedValue({
      name: 'different-name',
      version: '1.0.0',
      scripts: { test: 'vitest', build: 'tsup' },
    });
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand();

    expect(mockedLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Package name mismatch'));
    expect(mockedLogger.info).toHaveBeenCalledWith(expect.stringContaining('different-name'));
  });

  it('does not treat scoped package names as paths', async () => {
    mockedFs.readJson.mockResolvedValue({
      name: '@agentforge/myTool',
      version: '1.0.0',
      scripts: { test: 'vitest', build: 'tsup' },
    });
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand('@agentforge/myTool');

    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(process.cwd(), expect.any(Object));
  });

  it('does not treat other scoped package names as paths either', async () => {
    mockedFs.readJson.mockResolvedValue({
      name: '@myorg/custom-tool',
      version: '1.0.0',
      scripts: { test: 'vitest', build: 'tsup' },
    });
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand('@myorg/custom-tool');

    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(process.cwd(), expect.any(Object));
  });

  it('still treats actual slash-delimited paths as paths', async () => {
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand('./tools/myTool');

    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(
      expect.stringContaining('tools/myTool'),
      expect.any(Object)
    );
  });

  it('tries common tool locations when the current package does not match', async () => {
    mockedFs.pathExists.mockImplementation(async (candidate: string) => {
      return candidate.includes('tools/myTool') || candidate.endsWith('package.json');
    });

    mockedFs.readJson.mockImplementation(async (candidate: string) => {
      if (candidate.includes('tools/myTool')) {
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

    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand();

    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(
      expect.stringContaining('tools/myTool'),
      expect.any(Object)
    );
  });

  it('finds scoped packages in unscoped package folders', async () => {
    mockedFs.pathExists.mockImplementation(async (candidate: string) => {
      return candidate.includes('packages/my-tool') && !candidate.includes('@myorg');
    });
    mockedFs.readJson.mockResolvedValue({
      name: '@myorg/my-tool',
      version: '1.0.0',
      scripts: { test: 'vitest', build: 'tsup' },
    });
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand('@myorg/my-tool');

    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(
      expect.stringContaining('packages/my-tool'),
      expect.any(Object)
    );
  });

  it('finds scoped packages in unscoped tool folders', async () => {
    mockedFs.pathExists.mockImplementation(async (candidate: string) => {
      return candidate.includes('tools/custom') && !candidate.includes('@agentforge');
    });
    mockedFs.readJson.mockResolvedValue({
      name: '@agentforge/custom',
      version: '1.0.0',
      scripts: { test: 'vitest', build: 'tsup' },
    });
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand('@agentforge/custom');

    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(
      expect.stringContaining('tools/custom'),
      expect.any(Object)
    );
  });

  it('prefers a scoped folder when both scoped and unscoped locations exist', async () => {
    mockedFs.pathExists.mockImplementation(async (candidate: string) => {
      return candidate.includes('packages/@myorg/my-tool') || candidate.includes('packages/my-tool');
    });
    mockedFs.readJson.mockResolvedValue({
      name: '@myorg/my-tool',
      version: '1.0.0',
      scripts: { test: 'vitest', build: 'tsup' },
    });
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand('@myorg/my-tool');

    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(
      expect.stringContaining('packages/@myorg/my-tool'),
      expect.any(Object)
    );
  });
});
