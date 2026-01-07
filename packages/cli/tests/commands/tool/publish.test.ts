import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toolPublishCommand } from '../../../src/commands/tool/publish.js';
import * as packageManager from '../../../src/utils/package-manager.js';
import * as logger from '../../../src/utils/logger.js';

vi.mock('../../../src/utils/package-manager.js');
vi.mock('../../../src/utils/logger.js');

describe('tool:publish command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  it('should publish tool successfully', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await toolPublishCommand('myTool', {});

    expect(packageManager.runScript).toHaveBeenCalledWith(expect.any(String), 'test', 'pnpm');
    expect(packageManager.runScript).toHaveBeenCalledWith(expect.any(String), 'build', 'pnpm');
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Tests passed');
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Build completed');
    expect(logger.logger.success).toHaveBeenCalled();
  });

  it('should publish with custom tag', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('npm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await toolPublishCommand('myTool', { tag: 'beta' });

    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('beta'));
  });

  it('should run in dry-run mode', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await toolPublishCommand('myTool', { dryRun: true });

    expect(logger.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Dry run'));
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Tests passed');
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Build completed');
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

  it('should handle errors gracefully', async () => {
    vi.mocked(packageManager.detectPackageManager).mockRejectedValue(new Error('PM detection failed'));

    await toolPublishCommand('errorTool', {});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Publishing failed');
    expect(logger.logger.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

