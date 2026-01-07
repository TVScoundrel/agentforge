import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agentListCommand } from '../../../src/commands/agent/list.js';
import * as fs from '../../../src/utils/fs.js';
import * as logger from '../../../src/utils/logger.js';

vi.mock('../../../src/utils/fs.js');
vi.mock('../../../src/utils/logger.js');

describe('agent:list command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  it('should list agents in simple mode', async () => {
    vi.mocked(fs.findFiles).mockResolvedValue(['agent1.ts', 'agent2.ts']);

    await agentListCommand({});

    expect(fs.findFiles).toHaveBeenCalledWith('*.ts', expect.stringContaining('src/agents'));
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('2'));
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('agent1'));
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('agent2'));
  });

  it('should list agents in verbose mode', async () => {
    vi.mocked(fs.findFiles).mockResolvedValue(['myAgent.ts']);
    vi.mocked(fs.readFile).mockResolvedValue(`
      /**
       * Test agent description
       */
      import { createReActAgent } from '@agentforge/patterns';
    `);

    await agentListCommand({ verbose: true });

    expect(fs.readFile).toHaveBeenCalled();
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('myAgent'));
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('ReAct'));
  });

  it('should show warning when no agents found', async () => {
    vi.mocked(fs.findFiles).mockResolvedValue([]);

    await agentListCommand({});

    expect(logger.logger.warn).toHaveBeenCalledWith('No agents found');
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('agent:create'));
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(fs.findFiles).mockRejectedValue(new Error('Directory not found'));

    await agentListCommand({});

    expect(logger.logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to list agents'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

