import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agentCreateReusableCommand } from '../../../src/commands/agent/create-reusable.js';
import * as fs from '../../../src/utils/fs.js';
import * as logger from '../../../src/utils/logger.js';
import inquirer from 'inquirer';

vi.mock('../../../src/utils/fs.js');
vi.mock('../../../src/utils/logger.js');
vi.mock('inquirer');
vi.mock('fs-extra');

describe('agent:create-reusable command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  it('should create reusable agent with default options', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      name: 'customer-support',
      description: 'A customer support agent',
      author: 'Test Author',
    });
    vi.mocked(fs.copyTemplate).mockResolvedValue();
    vi.mocked(fs.getTemplatePath).mockReturnValue('/path/to/template');

    // Mock fs-extra
    const fsExtra = await import('fs-extra');
    vi.mocked(fsExtra.ensureDir).mockResolvedValue();
    vi.mocked(fsExtra.move).mockResolvedValue();

    await agentCreateReusableCommand('customer-support', {});

    expect(fs.getTemplatePath).toHaveBeenCalledWith('reusable-agent');
    expect(fs.copyTemplate).toHaveBeenCalledWith(
      '/path/to/template',
      expect.stringContaining('customer-support'),
      expect.objectContaining({
        AGENT_NAME_KEBAB: 'customer-support',
        AGENT_NAME_PASCAL: 'CustomerSupport',
        AGENT_NAME_CAMEL: 'customerSupport',
        AGENT_DESCRIPTION: 'A customer support agent',
        PACKAGE_NAME: '@agentforge/customer-support',
        AUTHOR: 'Test Author',
      })
    );
    expect(logger.logger.success).toHaveBeenCalled();
  });

  it('should create reusable agent with custom description', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      name: 'data-analyst',
      description: 'Custom data analyst',
      author: 'Custom Author',
    });
    vi.mocked(fs.copyTemplate).mockResolvedValue();
    vi.mocked(fs.getTemplatePath).mockReturnValue('/path/to/template');

    const fsExtra = await import('fs-extra');
    vi.mocked(fsExtra.ensureDir).mockResolvedValue();
    vi.mocked(fsExtra.move).mockResolvedValue();

    await agentCreateReusableCommand('data-analyst', {
      description: 'Custom data analyst',
      author: 'Custom Author',
    });

    expect(fs.copyTemplate).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('data-analyst'),
      expect.objectContaining({
        AGENT_NAME_KEBAB: 'data-analyst',
        AGENT_NAME_PASCAL: 'DataAnalyst',
        AGENT_NAME_CAMEL: 'dataAnalyst',
        AGENT_DESCRIPTION: 'Custom data analyst',
      })
    );
  });

  it('should handle kebab-case to PascalCase conversion', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      name: 'code-review-assistant',
      description: 'Code review agent',
      author: 'Test',
    });
    vi.mocked(fs.copyTemplate).mockResolvedValue();
    vi.mocked(fs.getTemplatePath).mockReturnValue('/path/to/template');

    const fsExtra = await import('fs-extra');
    vi.mocked(fsExtra.ensureDir).mockResolvedValue();
    vi.mocked(fsExtra.move).mockResolvedValue();

    await agentCreateReusableCommand('code-review-assistant', {});

    expect(fs.copyTemplate).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        AGENT_NAME_KEBAB: 'code-review-assistant',
        AGENT_NAME_PASCAL: 'CodeReviewAssistant',
        AGENT_NAME_CAMEL: 'codeReviewAssistant',
      })
    );
  });

  it('should organize files into src directory', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      name: 'test-agent',
      description: 'Test',
      author: 'Test',
    });
    vi.mocked(fs.copyTemplate).mockResolvedValue();
    vi.mocked(fs.getTemplatePath).mockReturnValue('/path/to/template');

    const fsExtra = await import('fs-extra');
    vi.mocked(fsExtra.ensureDir).mockResolvedValue();
    vi.mocked(fsExtra.move).mockResolvedValue();

    await agentCreateReusableCommand('test-agent', {});

    expect(fsExtra.ensureDir).toHaveBeenCalledWith(expect.stringContaining('src'));
    expect(fsExtra.move).toHaveBeenCalledWith(
      expect.stringContaining('index.ts'),
      expect.stringContaining('src/index.ts')
    );
    // Note: prompt-loader.ts is no longer moved (consolidated into @agentforge/core)
    expect(fsExtra.move).toHaveBeenCalledWith(
      expect.stringContaining('index.test.ts'),
      expect.stringContaining('src/index.test.ts')
    );
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(inquirer.prompt).mockRejectedValue(new Error('User cancelled'));

    await agentCreateReusableCommand('test-agent', {});

    expect(logger.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create reusable agent')
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

