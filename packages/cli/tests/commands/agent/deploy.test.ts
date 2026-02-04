import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agentDeployCommand } from '../../../src/commands/agent/deploy.js';
import * as logger from '../../../src/utils/logger.js';

vi.mock('../../../src/utils/logger.js');

describe('agent:deploy command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  it('should show error and deployment instructions', async () => {
    await agentDeployCommand('myAgent', {});

    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('myAgent'));
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('production'));
    expect(logger.logger.error).toHaveBeenCalledWith('Automated agent deployment is not yet implemented');
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('Docker Deployment'));
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('Kubernetes Deployment'));
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('Serverless Deployment'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should show environment in output', async () => {
    await agentDeployCommand('myAgent', { environment: 'staging' });

    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('staging'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should show deployment instructions regardless of dry-run flag', async () => {
    await agentDeployCommand('myAgent', { dryRun: true });

    expect(logger.logger.error).toHaveBeenCalledWith('Automated agent deployment is not yet implemented');
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('deployment methods'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

