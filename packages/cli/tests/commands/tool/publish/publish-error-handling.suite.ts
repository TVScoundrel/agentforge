import { describe, expect, it } from 'vitest';
import { mockedLogger, mockedPackageManager, runPublishCommand, usePublishCommandMocks } from './shared.js';

describe('tool:publish error handling', () => {
  usePublishCommandMocks();

  it('stops when tests fail', async () => {
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockRejectedValueOnce(new Error('Tests failed'));

    await runPublishCommand('failingTool');

    expect(mockedLogger.failSpinner).toHaveBeenCalledWith('Tests failed');
    expect(mockedLogger.error).toHaveBeenCalledWith(expect.stringContaining('Cannot publish'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('stops when the build fails', async () => {
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Build failed'));

    await runPublishCommand('buildFailTool');

    expect(mockedLogger.succeedSpinner).toHaveBeenCalledWith('Tests passed');
    expect(mockedLogger.failSpinner).toHaveBeenCalledWith('Build failed');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('shows authentication guidance for npm auth errors', async () => {
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockRejectedValue(new Error('ENEEDAUTH'));

    await runPublishCommand('unauthTool');

    expect(mockedLogger.failSpinner).toHaveBeenCalledWith('Publishing failed');
    expect(mockedLogger.error).toHaveBeenCalledWith('Not authenticated with npm');
    expect(mockedLogger.info).toHaveBeenCalledWith('Run: npm login');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('shows permission guidance for forbidden npm responses', async () => {
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockRejectedValue(new Error('E403 Forbidden'));

    await runPublishCommand('forbiddenTool');

    expect(mockedLogger.failSpinner).toHaveBeenCalledWith('Publishing failed');
    expect(mockedLogger.error).toHaveBeenCalledWith('Permission denied - you may not have access to publish this package');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('shows version guidance for already-published releases', async () => {
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockRejectedValue(new Error('EPUBLISHCONFLICT'));

    await runPublishCommand('conflictTool');

    expect(mockedLogger.failSpinner).toHaveBeenCalledWith('Publishing failed');
    expect(mockedLogger.error).toHaveBeenCalledWith('Version already published');
    expect(mockedLogger.info).toHaveBeenCalledWith('Update the version in package.json before publishing');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('surfaces generic publish errors without remapping them', async () => {
    mockedPackageManager.detectPackageManager.mockResolvedValue('pnpm');
    mockedPackageManager.runScript.mockResolvedValue();
    mockedPackageManager.publishPackage.mockRejectedValue(new Error('registry timeout'));

    await runPublishCommand('timeoutTool');

    expect(mockedLogger.failSpinner).toHaveBeenCalledWith('Publishing failed');
    expect(mockedLogger.error).toHaveBeenCalledWith('registry timeout');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('handles setup errors gracefully', async () => {
    mockedPackageManager.detectPackageManager.mockRejectedValue(new Error('PM detection failed'));

    await runPublishCommand('errorTool');

    expect(mockedLogger.failSpinner).toHaveBeenCalledWith('Publishing failed');
    expect(mockedLogger.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
