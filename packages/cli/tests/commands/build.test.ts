import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildCommand } from '../../src/commands/build.js';
import * as logger from '../../src/utils/logger.js';
import * as packageManager from '../../src/utils/package-manager.js';

vi.mock('../../src/utils/logger.js');
vi.mock('../../src/utils/package-manager.js');

describe('buildCommand', () => {
  let processExitSpy: any;
  let processCwdSpy: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...process.env };
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
    process.env = originalEnv;
  });

  it('should build with default options', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await buildCommand({});

    expect(packageManager.detectPackageManager).toHaveBeenCalledWith('/test/project');
    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'build', 'pnpm');
    expect(process.env.NODE_ENV).toBe('production');
    expect(logger.logger.success).toHaveBeenCalledWith('✨ Production build ready!');
  });

  it('should set NO_MINIFY when minify is false', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('npm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await buildCommand({ minify: false });

    expect(process.env.NO_MINIFY).toBe('true');
    expect(packageManager.runScript).toHaveBeenCalled();
  });

  it('should set NO_SOURCEMAP when sourcemap is false', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('yarn');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await buildCommand({ sourcemap: false });

    expect(process.env.NO_SOURCEMAP).toBe('true');
    expect(packageManager.runScript).toHaveBeenCalled();
  });

  it('should handle build failure', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockRejectedValue(new Error('Build failed'));

    await buildCommand({});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Build failed');
    expect(logger.logger.error).toHaveBeenCalledWith('Build failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should detect package manager from project', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('yarn');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await buildCommand({});

    expect(packageManager.detectPackageManager).toHaveBeenCalledWith('/test/project');
    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'build', 'yarn');
  });

  it('should log build options', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await buildCommand({ minify: false, sourcemap: false });

    expect(logger.logger.info).toHaveBeenCalledWith('Minify: No');
    expect(logger.logger.info).toHaveBeenCalledWith('Sourcemap: No');
  });
});

