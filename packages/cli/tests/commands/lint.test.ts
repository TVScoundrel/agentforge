import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { lintCommand } from '../../src/commands/lint.js';
import * as logger from '../../src/utils/logger.js';
import * as packageManager from '../../src/utils/package-manager.js';

vi.mock('../../src/utils/logger.js');
vi.mock('../../src/utils/package-manager.js');

describe('lintCommand', () => {
  let processExitSpy: any;
  let processCwdSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    processCwdSpy = vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

    // Setup logger mocks
    vi.mocked(logger.logger.header).mockImplementation(() => {});
    vi.mocked(logger.logger.info).mockImplementation(() => {});
    vi.mocked(logger.logger.error).mockImplementation(() => {});
    vi.mocked(logger.logger.success).mockImplementation(() => {});
    vi.mocked(logger.logger.newLine).mockImplementation(() => {});
    vi.mocked(logger.logger.startSpinner).mockImplementation(() => {});
    vi.mocked(logger.logger.succeedSpinner).mockImplementation(() => {});
    vi.mocked(logger.logger.failSpinner).mockImplementation(() => {});
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    processCwdSpy.mockRestore();
  });

  it('should run linter with default options', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await lintCommand({});

    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'lint', 'pnpm');
    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'format', 'pnpm');
    expect(logger.logger.success).toHaveBeenCalledWith('✨ Code quality check completed!');
  });

  it('should run linter with fix option', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('npm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await lintCommand({ fix: true });

    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'lint:fix', 'npm');
  });

  it('should skip formatting when format is false', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('yarn');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await lintCommand({ format: false });

    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'lint', 'yarn');
    expect(packageManager.runScript).not.toHaveBeenCalledWith('/test/project', 'format', 'yarn');
  });

  it('should handle linting issues gracefully', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript)
      .mockRejectedValueOnce(new Error('Lint issues'))
      .mockResolvedValueOnce(); // format succeeds

    await lintCommand({});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Linting found issues');
    expect(logger.logger.info).toHaveBeenCalledWith('Run with --fix to automatically fix issues');
    expect(logger.logger.success).toHaveBeenCalledWith('✨ Code quality check completed!');
  });

  it('should not suggest fix when already using fix option', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript)
      .mockRejectedValueOnce(new Error('Lint issues'))
      .mockResolvedValueOnce(); // format succeeds

    await lintCommand({ fix: true });

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Linting found issues');
    expect(logger.logger.info).not.toHaveBeenCalledWith('Run with --fix to automatically fix issues');
  });

  it('should handle formatting failure gracefully', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript)
      .mockResolvedValueOnce() // lint succeeds
      .mockRejectedValueOnce(new Error('Format failed')); // format fails

    await lintCommand({});

    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Linting completed');
    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Formatting failed');
    expect(logger.logger.success).toHaveBeenCalledWith('✨ Code quality check completed!');
  });

  it('should handle complete failure', async () => {
    vi.mocked(packageManager.detectPackageManager).mockRejectedValue(new Error('PM detection failed'));

    await lintCommand({});

    expect(logger.logger.error).toHaveBeenCalledWith('PM detection failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should log lint options', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await lintCommand({ fix: true, format: false });

    expect(logger.logger.info).toHaveBeenCalledWith('Auto-fix: Yes');
    expect(logger.logger.info).toHaveBeenCalledWith('Format: No');
  });
});

