import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agentDeployCommand } from '../../../src/commands/agent/deploy.js';
import * as logger from '../../../src/utils/logger.js';

vi.mock('../../../src/utils/logger.js');

describe('agent:deploy command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  it('should deploy agent to production', async () => {
    await agentDeployCommand('myAgent', {});

    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('myAgent'));
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('production'));
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Agent deployed successfully');
    expect(logger.logger.success).toHaveBeenCalled();
  });

  it('should deploy agent to specific environment', async () => {
    await agentDeployCommand('myAgent', { environment: 'staging' });

    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('staging'));
  });

  it('should run in dry-run mode', async () => {
    await agentDeployCommand('myAgent', { dryRun: true });

    expect(logger.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Dry run'));
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Deployment prepared');
    expect(logger.logger.succeedSpinner).not.toHaveBeenCalledWith('Agent deployed successfully');
  });

  it('should handle errors gracefully', async () => {
    // Mock setTimeout to throw error
    vi.spyOn(global, 'setTimeout').mockImplementation(() => {
      throw new Error('Deployment failed');
    });

    await agentDeployCommand('errorAgent', {});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Deployment failed');
    expect(logger.logger.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);

    vi.restoreAllMocks();
  });
});

