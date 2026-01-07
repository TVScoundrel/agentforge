import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toolListCommand } from '../../../src/commands/tool/list.js';
import * as fs from '../../../src/utils/fs.js';
import * as logger from '../../../src/utils/logger.js';

vi.mock('../../../src/utils/fs.js');
vi.mock('../../../src/utils/logger.js');

describe('tool:list command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  it('should list tools in simple mode', async () => {
    vi.mocked(fs.findFiles).mockResolvedValue(['tool1.ts', 'tool2.ts']);

    await toolListCommand({});

    expect(fs.findFiles).toHaveBeenCalledWith('*.ts', expect.stringContaining('src/tools'));
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('2'));
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('tool1'));
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('tool2'));
  });

  it('should list tools in verbose mode', async () => {
    vi.mocked(fs.findFiles).mockResolvedValue(['myTool.ts']);
    vi.mocked(fs.readFile).mockResolvedValue(`
      /**
       * Test tool description
       * Category: web
       */
      import { createTool } from '@agentforge/core';
    `);

    await toolListCommand({ verbose: true });

    expect(fs.readFile).toHaveBeenCalled();
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('myTool'));
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('web'));
  });

  it('should filter tools by category', async () => {
    vi.mocked(fs.findFiles).mockResolvedValue(['webTool.ts', 'dataTool.ts']);
    vi.mocked(fs.readFile)
      .mockResolvedValueOnce('Category: web')
      .mockResolvedValueOnce('Category: data');

    await toolListCommand({ category: 'web' });

    expect(fs.readFile).toHaveBeenCalledTimes(2);
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('1'));
  });

  it('should show warning when no tools found', async () => {
    vi.mocked(fs.findFiles).mockResolvedValue([]);

    await toolListCommand({});

    expect(logger.logger.warn).toHaveBeenCalledWith('No tools found');
    expect(logger.logger.info).toHaveBeenCalledWith(expect.stringContaining('tool:create'));
  });

  it('should show warning when no tools found in category', async () => {
    vi.mocked(fs.findFiles).mockResolvedValue(['tool1.ts']);
    vi.mocked(fs.readFile).mockResolvedValue('Category: web');

    await toolListCommand({ category: 'data' });

    expect(logger.logger.warn).toHaveBeenCalledWith(expect.stringContaining('No tools found in category'));
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(fs.findFiles).mockRejectedValue(new Error('Directory not found'));

    await toolListCommand({});

    expect(logger.logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to list tools'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

