import { describe, expect, it, vi } from 'vitest';
import { mockedLogger, mockedPackageManager, mockedFs, runPublishCommand, usePublishCommandMocks } from './shared.js';

describe('tool:publish happy paths', () => {
  usePublishCommandMocks();

  it('publishes a tool successfully', async () => {
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand();

    expect(mockedPackageManager.runScript).toHaveBeenCalledWith(expect.any(String), 'test', 'pnpm');
    expect(mockedPackageManager.runScript).toHaveBeenCalledWith(expect.any(String), 'build', 'pnpm');
    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(expect.any(String), {
      tag: undefined,
      access: 'public',
      dryRun: undefined,
    });
    expect(mockedLogger.succeedSpinner).toHaveBeenCalledWith('Tests passed');
    expect(mockedLogger.succeedSpinner).toHaveBeenCalledWith('Build completed');
    expect(mockedLogger.succeedSpinner).toHaveBeenCalledWith('Published to npm');
    expect(mockedLogger.success).toHaveBeenCalled();
  });

  it('publishes with a custom tag', async () => {
    mockedPackageManager.detectPackageManager.mockResolvedValue('npm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand('myTool', { tag: 'beta' });

    expect(mockedLogger.info).toHaveBeenCalledWith(expect.stringContaining('beta'));
    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(expect.any(String), {
      tag: 'beta',
      access: 'public',
      dryRun: undefined,
    });
  });

  it('supports dry-run publishing', async () => {
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand('myTool', { dryRun: true });

    expect(mockedLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Dry run'));
    expect(mockedPackageManager.publishPackage).toHaveBeenCalledWith(expect.any(String), {
      tag: undefined,
      access: 'public',
      dryRun: true,
    });
    expect(mockedLogger.succeedSpinner).toHaveBeenCalledWith('Dry-run completed - no actual publishing occurred');
  });

  it('skips build when no build script exists', async () => {
    mockedFs.readJson.mockResolvedValue({
      name: 'myTool',
      version: '1.0.0',
      scripts: { test: 'vitest' },
    });
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand();

    expect(mockedPackageManager.runScript).toHaveBeenCalledWith(expect.any(String), 'test', 'pnpm');
    expect(mockedPackageManager.runScript).not.toHaveBeenCalledWith(expect.any(String), 'build', 'pnpm');
    expect(mockedLogger.info).toHaveBeenCalledWith('⚠️  Skipping build (no build script found)');
  });

  it('skips tests when no test script exists', async () => {
    mockedFs.readJson.mockResolvedValue({
      name: 'myTool',
      version: '1.0.0',
      scripts: { build: 'tsup' },
    });
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand();

    expect(mockedPackageManager.runScript).toHaveBeenCalledWith(expect.any(String), 'build', 'pnpm');
    expect(mockedPackageManager.runScript).not.toHaveBeenCalledWith(expect.any(String), 'test', 'pnpm');
    expect(mockedLogger.info).toHaveBeenCalledWith('⚠️  Skipping tests (no test script found)');
  });

  it('skips both preflight scripts when neither exists', async () => {
    mockedFs.readJson.mockResolvedValue({
      name: 'myTool',
      version: '1.0.0',
      scripts: {},
    });
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockResolvedValue();

    await runPublishCommand();

    expect(mockedPackageManager.runScript).not.toHaveBeenCalled();
    expect(mockedLogger.info).toHaveBeenCalledWith('⚠️  Skipping tests (no test script found)');
    expect(mockedLogger.info).toHaveBeenCalledWith('⚠️  Skipping build (no build script found)');
  });
});
