import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toolCreateCommand } from '../../../src/commands/tool/create.js';
import * as prompts from '../../../src/utils/prompts.js';
import * as fs from '../../../src/utils/fs.js';
import * as logger from '../../../src/utils/logger.js';

vi.mock('../../../src/utils/prompts.js');
vi.mock('../../../src/utils/fs.js');
vi.mock('../../../src/utils/logger.js');

describe('tool:create command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  it('should create tool with web category', async () => {
    vi.mocked(prompts.promptToolSetup).mockResolvedValue({
      name: 'webTool',
      category: 'web',
      description: 'Web scraping tool',
      generateTests: false,
    });
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();

    await toolCreateCommand('webTool', {});

    expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('src/tools'));
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('webTool.ts'),
      expect.stringContaining('createTool')
    );
    expect(logger.logger.success).toHaveBeenCalled();
  });

  it('should create tool with data category', async () => {
    vi.mocked(prompts.promptToolSetup).mockResolvedValue({
      name: 'dataTool',
      category: 'data',
      description: 'Data processing tool',
      generateTests: false,
    });
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();

    await toolCreateCommand('dataTool', { category: 'data' });

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('dataTool.ts'),
      expect.stringContaining('data')
    );
  });

  it('should create tool with file category', async () => {
    vi.mocked(prompts.promptToolSetup).mockResolvedValue({
      name: 'fileTool',
      category: 'file',
      description: 'File manipulation tool',
      generateTests: false,
    });
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();

    await toolCreateCommand('fileTool', { category: 'file' });

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('fileTool.ts'),
      expect.stringContaining('file')
    );
  });

  it('should create tool with utility category', async () => {
    vi.mocked(prompts.promptToolSetup).mockResolvedValue({
      name: 'utilityTool',
      category: 'utility',
      description: 'Utility tool',
      generateTests: false,
    });
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();

    await toolCreateCommand('utilityTool', { category: 'utility' });

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('utilityTool.ts'),
      expect.stringContaining('utility')
    );
  });

  it('should create test file when test option is true', async () => {
    vi.mocked(prompts.promptToolSetup).mockResolvedValue({
      name: 'testTool',
      category: 'web',
      description: 'Test tool',
      generateTests: true,
    });
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();

    await toolCreateCommand('testTool', { test: true });

    expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('tests/tools'));
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('testTool.test.ts'),
      expect.stringContaining('describe')
    );
  });

  it('should not create test file when test option is false', async () => {
    vi.mocked(prompts.promptToolSetup).mockResolvedValue({
      name: 'noTestTool',
      category: 'web',
      description: 'No test tool',
      generateTests: false,
    });
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();

    await toolCreateCommand('noTestTool', { test: false });

    expect(fs.writeFile).toHaveBeenCalledTimes(1); // Only tool file, not test file
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(prompts.promptToolSetup).mockRejectedValue(new Error('Prompt failed'));

    await toolCreateCommand('errorTool', {});

    expect(logger.logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to create tool'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

