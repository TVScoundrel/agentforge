import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agentTestCommand } from '../../../src/commands/agent/test.js';
import * as fs from '../../../src/utils/fs.js';
import * as packageManager from '../../../src/utils/package-manager.js';
import * as logger from '../../../src/utils/logger.js';

vi.mock('../../../src/utils/fs.js');
vi.mock('../../../src/utils/package-manager.js');
vi.mock('../../../src/utils/logger.js');

describe('agent:test command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  it('should run tests for agent', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await agentTestCommand('myAgent', {});

    expect(fs.pathExists).toHaveBeenCalledWith(expect.stringContaining('myAgent.test.ts'));
    expect(packageManager.runScript).toHaveBeenCalledWith(
      expect.any(String),
      'test',
      'pnpm'
    );
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Tests completed');
  });

  it('should run tests in watch mode', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('npm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await agentTestCommand('watchAgent', { watch: true });

    expect(packageManager.runScript).toHaveBeenCalledWith(
      expect.any(String),
      'test:watch',
      'npm'
    );
  });

  it('should error when test file does not exist', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);

    await agentTestCommand('nonExistent', {});

    expect(logger.logger.error).toHaveBeenCalledWith(expect.stringContaining('Test file not found'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle test failures gracefully', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockRejectedValue(new Error('Tests failed'));

    await agentTestCommand('failingAgent', {});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Tests failed');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

