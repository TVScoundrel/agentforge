import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { testCommand } from '../../src/commands/test.js';
import * as logger from '../../src/utils/logger.js';
import * as packageManager from '../../src/utils/package-manager.js';

vi.mock('../../src/utils/logger.js');
vi.mock('../../src/utils/package-manager.js');

describe('testCommand', () => {
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
    vi.mocked(logger.logger.newLine).mockImplementation(() => {});
    vi.mocked(logger.logger.startSpinner).mockImplementation(() => {});
    vi.mocked(logger.logger.succeedSpinner).mockImplementation(() => {});
    vi.mocked(logger.logger.failSpinner).mockImplementation(() => {});
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    processCwdSpy.mockRestore();
  });

  it('should run tests with default options', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await testCommand({});

    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'test', 'pnpm');
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Tests completed');
  });

  it('should run tests in watch mode', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('npm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await testCommand({ watch: true });

    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'test:watch', 'npm');
  });

  it('should run tests with UI', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('yarn');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await testCommand({ ui: true });

    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'test:ui', 'yarn');
  });

  it('should run tests with coverage', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await testCommand({ coverage: true });

    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'test:coverage', 'pnpm');
  });

  it('should prioritize UI over coverage', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await testCommand({ ui: true, coverage: true });

    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'test:ui', 'pnpm');
  });

  it('should handle test failure', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockRejectedValue(new Error('Tests failed'));

    await testCommand({});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Tests failed');
    expect(logger.logger.error).toHaveBeenCalledWith('Tests failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should log test options', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await testCommand({ watch: true, coverage: false });

    expect(logger.logger.info).toHaveBeenCalledWith('Watch mode: Yes');
    expect(logger.logger.info).toHaveBeenCalledWith('Coverage: No');
  });
});

