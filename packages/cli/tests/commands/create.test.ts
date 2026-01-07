import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCommand } from '../../src/commands/create.js';
import * as logger from '../../src/utils/logger.js';
import * as prompts from '../../src/utils/prompts.js';
import * as fs from '../../src/utils/fs.js';
import * as packageManager from '../../src/utils/package-manager.js';
import * as git from '../../src/utils/git.js';

vi.mock('../../src/utils/logger.js');
vi.mock('../../src/utils/prompts.js');
vi.mock('../../src/utils/fs.js');
vi.mock('../../src/utils/package-manager.js');
vi.mock('../../src/utils/git.js');

describe('createCommand', () => {
  let processExitSpy: any;
  let processCwdSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    processCwdSpy = vi.spyOn(process, 'cwd').mockReturnValue('/test/cwd');

    // Setup default mocks
    vi.mocked(logger.logger.header).mockImplementation(() => {});
    vi.mocked(logger.logger.info).mockImplementation(() => {});
    vi.mocked(logger.logger.error).mockImplementation(() => {});
    vi.mocked(logger.logger.success).mockImplementation(() => {});
    vi.mocked(logger.logger.warn).mockImplementation(() => {});
    vi.mocked(logger.logger.newLine).mockImplementation(() => {});
    vi.mocked(logger.logger.list).mockImplementation(() => {});
    vi.mocked(logger.logger.startSpinner).mockImplementation(() => {});
    vi.mocked(logger.logger.succeedSpinner).mockImplementation(() => {});
    vi.mocked(logger.logger.failSpinner).mockImplementation(() => {});
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    processCwdSpy.mockRestore();
  });

  it('should exit if project name is not provided', async () => {
    await createCommand('', {});
    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(logger.logger.error).toHaveBeenCalledWith('Project name is required');
  });

  it('should exit if directory exists and is not empty', async () => {
    vi.mocked(fs.isEmptyDir).mockResolvedValue(false);

    await createCommand('my-project', {});
    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(logger.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('already exists and is not empty')
    );
  });

  it('should create project with minimal template', async () => {
    vi.mocked(fs.isEmptyDir).mockResolvedValue(true);
    vi.mocked(prompts.promptProjectSetup).mockResolvedValue({
      projectName: 'my-project',
      template: 'minimal',
      packageManager: 'pnpm',
      installDependencies: false,
      initGit: false,
    });
    vi.mocked(fs.getTemplatePath).mockReturnValue('/templates/minimal');
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.copyTemplate).mockResolvedValue();
    vi.mocked(fs.readJson).mockResolvedValue({ name: 'template', version: '1.0.0' });
    vi.mocked(fs.writeJson).mockResolvedValue();

    await createCommand('my-project', { template: 'minimal' });

    expect(fs.ensureDir).toHaveBeenCalledWith('/test/cwd/my-project');
    expect(fs.copyTemplate).toHaveBeenCalledWith(
      '/templates/minimal',
      '/test/cwd/my-project',
      expect.objectContaining({
        PROJECT_NAME: 'my-project',
        PACKAGE_MANAGER: 'pnpm',
      })
    );
    expect(logger.logger.success).toHaveBeenCalled();
  });

  it('should install dependencies when requested', async () => {
    vi.mocked(fs.isEmptyDir).mockResolvedValue(true);
    vi.mocked(prompts.promptProjectSetup).mockResolvedValue({
      projectName: 'my-project',
      template: 'full',
      packageManager: 'npm',
      installDependencies: true,
      initGit: false,
    });
    vi.mocked(fs.getTemplatePath).mockReturnValue('/templates/full');
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.copyTemplate).mockResolvedValue();
    vi.mocked(fs.readJson).mockResolvedValue({ name: 'template', version: '1.0.0' });
    vi.mocked(fs.writeJson).mockResolvedValue();
    vi.mocked(packageManager.installDependencies).mockResolvedValue();

    await createCommand('my-project', { install: true });

    expect(packageManager.installDependencies).toHaveBeenCalledWith('/test/cwd/my-project', 'npm');
  });

  it('should handle dependency installation failure gracefully', async () => {
    vi.mocked(fs.isEmptyDir).mockResolvedValue(true);
    vi.mocked(prompts.promptProjectSetup).mockResolvedValue({
      projectName: 'my-project',
      template: 'minimal',
      packageManager: 'pnpm',
      installDependencies: true,
      initGit: false,
    });
    vi.mocked(fs.getTemplatePath).mockReturnValue('/templates/minimal');
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.copyTemplate).mockResolvedValue();
    vi.mocked(fs.readJson).mockResolvedValue({ name: 'template', version: '1.0.0' });
    vi.mocked(fs.writeJson).mockResolvedValue();
    vi.mocked(packageManager.installDependencies).mockRejectedValue(new Error('Install failed'));

    await createCommand('my-project', {});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Failed to install dependencies');
    expect(logger.logger.warn).toHaveBeenCalledWith('You can install them manually later');
    expect(processExitSpy).not.toHaveBeenCalled(); // Should not exit on install failure
  });

  it('should initialize git when requested', async () => {
    vi.mocked(fs.isEmptyDir).mockResolvedValue(true);
    vi.mocked(prompts.promptProjectSetup).mockResolvedValue({
      projectName: 'my-project',
      template: 'minimal',
      packageManager: 'pnpm',
      installDependencies: false,
      initGit: true,
    });
    vi.mocked(fs.getTemplatePath).mockReturnValue('/templates/minimal');
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.copyTemplate).mockResolvedValue();
    vi.mocked(fs.readJson).mockResolvedValue({ name: 'template', version: '1.0.0' });
    vi.mocked(fs.writeJson).mockResolvedValue();
    vi.mocked(git.isGitInstalled).mockResolvedValue(true);
    vi.mocked(git.initGitRepository).mockResolvedValue();
    vi.mocked(git.createInitialCommit).mockResolvedValue();

    await createCommand('my-project', { git: true });

    expect(git.initGitRepository).toHaveBeenCalledWith('/test/cwd/my-project');
    expect(git.createInitialCommit).toHaveBeenCalledWith('/test/cwd/my-project');
  });

  it('should handle git initialization failure gracefully', async () => {
    vi.mocked(fs.isEmptyDir).mockResolvedValue(true);
    vi.mocked(prompts.promptProjectSetup).mockResolvedValue({
      projectName: 'my-project',
      template: 'minimal',
      packageManager: 'pnpm',
      installDependencies: false,
      initGit: true,
    });
    vi.mocked(fs.getTemplatePath).mockReturnValue('/templates/minimal');
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.copyTemplate).mockResolvedValue();
    vi.mocked(fs.readJson).mockResolvedValue({ name: 'template', version: '1.0.0' });
    vi.mocked(fs.writeJson).mockResolvedValue();
    vi.mocked(git.isGitInstalled).mockResolvedValue(true);
    vi.mocked(git.initGitRepository).mockRejectedValue(new Error('Git init failed'));

    await createCommand('my-project', {});

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Failed to initialize git');
    expect(logger.logger.warn).toHaveBeenCalledWith('You can initialize it manually later');
  });
});

