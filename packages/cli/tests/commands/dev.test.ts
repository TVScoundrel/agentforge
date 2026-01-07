import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { devCommand } from '../../src/commands/dev.js';
import * as logger from '../../src/utils/logger.js';
import * as packageManager from '../../src/utils/package-manager.js';

vi.mock('../../src/utils/logger.js');
vi.mock('../../src/utils/package-manager.js');

describe('devCommand', () => {
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
    vi.mocked(logger.logger.startSpinner).mockImplementation(() => {});
    vi.mocked(logger.logger.succeedSpinner).mockImplementation(() => {});
    vi.mocked(logger.logger.failSpinner).mockImplementation(() => {});
    vi.mocked(logger.logger.newLine).mockImplementation(() => {});
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    processCwdSpy.mockRestore();
    process.env = originalEnv;
  });

  it('should start dev server with default options', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await devCommand({});

    expect(packageManager.detectPackageManager).toHaveBeenCalledWith('/test/project');
    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'dev', 'pnpm');
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Development server started');
  });

  it('should set PORT environment variable when port option provided', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('npm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await devCommand({ port: '8080' });

    expect(process.env.PORT).toBe('8080');
    expect(packageManager.runScript).toHaveBeenCalled();
  });

  it('should handle dev server failure', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockRejectedValue(new Error('Server failed'));

    await devCommand({});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Failed to start development server');
    expect(logger.logger.error).toHaveBeenCalledWith('Server failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should detect package manager from project', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('yarn');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await devCommand({});

    expect(packageManager.detectPackageManager).toHaveBeenCalledWith('/test/project');
    expect(packageManager.runScript).toHaveBeenCalledWith('/test/project', 'dev', 'yarn');
  });

  it('should log port and package manager', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await devCommand({ port: '4000' });

    expect(logger.logger.info).toHaveBeenCalledWith('Port: 4000');
    expect(logger.logger.info).toHaveBeenCalledWith('Package manager: pnpm');
  });

  it('should use default port 3000 when not specified', async () => {
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await devCommand({});

    expect(logger.logger.info).toHaveBeenCalledWith('Port: 3000');
  });
});

