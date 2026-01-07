import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agentCreateCommand } from '../../../src/commands/agent/create.js';
import * as prompts from '../../../src/utils/prompts.js';
import * as fs from '../../../src/utils/fs.js';
import * as logger from '../../../src/utils/logger.js';

vi.mock('../../../src/utils/prompts.js');
vi.mock('../../../src/utils/fs.js');
vi.mock('../../../src/utils/logger.js');

describe('agent:create command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  it('should create agent with ReAct pattern', async () => {
    vi.mocked(prompts.promptAgentSetup).mockResolvedValue({
      name: 'myAgent',
      pattern: 'react',
      description: 'Test agent',
      generateTests: false,
    });
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();

    await agentCreateCommand('myAgent', {});

    expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('src/agents'));
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('myAgent.ts'),
      expect.stringContaining('createReActAgent')
    );
    expect(logger.logger.success).toHaveBeenCalled();
  });

  it('should create agent with Plan-Execute pattern', async () => {
    vi.mocked(prompts.promptAgentSetup).mockResolvedValue({
      name: 'planAgent',
      pattern: 'plan-execute',
      description: 'Planning agent',
      generateTests: false,
    });
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();

    await agentCreateCommand('planAgent', { pattern: 'plan-execute' });

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('planAgent.ts'),
      expect.stringContaining('createPlanExecuteAgent')
    );
  });

  it('should create agent with Reflection pattern', async () => {
    vi.mocked(prompts.promptAgentSetup).mockResolvedValue({
      name: 'reflectAgent',
      pattern: 'reflection',
      description: 'Reflection agent',
      generateTests: false,
    });
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();

    await agentCreateCommand('reflectAgent', { pattern: 'reflection' });

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('reflectAgent.ts'),
      expect.stringContaining('createReflectionAgent')
    );
  });

  it('should create agent with Multi-Agent pattern', async () => {
    vi.mocked(prompts.promptAgentSetup).mockResolvedValue({
      name: 'multiAgent',
      pattern: 'multi-agent',
      description: 'Multi-agent system',
      generateTests: false,
    });
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();

    await agentCreateCommand('multiAgent', { pattern: 'multi-agent' });

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('multiAgent.ts'),
      expect.stringContaining('createMultiAgentSystem')
    );
  });

  it('should create test file when test option is true', async () => {
    vi.mocked(prompts.promptAgentSetup).mockResolvedValue({
      name: 'testAgent',
      pattern: 'react',
      description: 'Test agent',
      generateTests: true,
    });
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();

    await agentCreateCommand('testAgent', { test: true });

    expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('tests/agents'));
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('testAgent.test.ts'),
      expect.stringContaining('describe')
    );
  });

  it('should not create test file when test option is false', async () => {
    vi.mocked(prompts.promptAgentSetup).mockResolvedValue({
      name: 'noTestAgent',
      pattern: 'react',
      description: 'No test agent',
      generateTests: false,
    });
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();

    await agentCreateCommand('noTestAgent', { test: false });

    expect(fs.writeFile).toHaveBeenCalledTimes(1); // Only agent file, not test file
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(prompts.promptAgentSetup).mockRejectedValue(new Error('Prompt failed'));

    await agentCreateCommand('errorAgent', {});

    expect(logger.logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to create agent'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

