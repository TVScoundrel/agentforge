import path from 'path';
import chalk from 'chalk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runNamedTestCommand } from '../../src/commands/named-test.js';
import * as fs from '../../src/utils/fs.js';
import * as packageManager from '../../src/utils/package-manager.js';
import * as logger from '../../src/utils/logger.js';

vi.mock('../../src/utils/fs.js');
vi.mock('../../src/utils/package-manager.js');
vi.mock('../../src/utils/logger.js');

const config = {
  noun: 'Widget',
  testDirectory: 'widgets',
  creationHint: 'agentforge widget:create myWidget --test',
};

describe('named-test command protocol', () => {
  const originalTestFile = process.env.TEST_FILE;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    if (originalTestFile === undefined) {
      delete process.env.TEST_FILE;
    } else {
      process.env.TEST_FILE = originalTestFile;
    }
  });

  it('runs the selected test file with the detected package manager', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('pnpm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await runNamedTestCommand('myWidget', {}, config);

    const cwd = process.cwd();
    const testFile = path.join(cwd, 'tests', 'widgets', 'myWidget.test.ts');

    expect(logger.logger.header).toHaveBeenCalledWith('🧪 Test Widget');
    expect(fs.pathExists).toHaveBeenCalledWith(testFile);
    expect(logger.logger.info).toHaveBeenNthCalledWith(
      1,
      `Testing widget: ${chalk.cyan('myWidget')}`
    );
    expect(logger.logger.info).toHaveBeenNthCalledWith(2, 'Watch mode: No');
    expect(logger.logger.newLine).toHaveBeenCalledOnce();
    expect(packageManager.detectPackageManager).toHaveBeenCalledWith(cwd);
    expect(logger.logger.startSpinner).toHaveBeenCalledWith('Running tests...');
    expect(process.env.TEST_FILE).toBe(testFile);
    expect(packageManager.runScript).toHaveBeenCalledWith(cwd, 'test', 'pnpm');
    expect(logger.logger.succeedSpinner).toHaveBeenCalledWith('Tests completed');
    expect(logger.logger.startSpinner.mock.invocationCallOrder[0]).toBeLessThan(
      packageManager.runScript.mock.invocationCallOrder[0]
    );
    expect(packageManager.runScript.mock.invocationCallOrder[0]).toBeLessThan(
      logger.logger.succeedSpinner.mock.invocationCallOrder[0]
    );
  });

  it('selects the watch script without changing the rest of the protocol', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('npm');
    vi.mocked(packageManager.runScript).mockResolvedValue();

    await runNamedTestCommand('myWidget', { watch: true }, config);

    expect(logger.logger.info).toHaveBeenCalledWith('Watch mode: Yes');
    expect(packageManager.runScript).toHaveBeenCalledWith(process.cwd(), 'test:watch', 'npm');
  });

  it('shows creation guidance and exits when the test file is missing', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);

    await runNamedTestCommand('myWidget', {}, config);

    const testFile = path.join(process.cwd(), 'tests', 'widgets', 'myWidget.test.ts');

    expect(logger.logger.error).toHaveBeenCalledWith(`Test file not found: ${testFile}`);
    expect(logger.logger.info).toHaveBeenCalledWith(
      `Create tests with: ${chalk.cyan(config.creationHint)}`
    );
    expect(packageManager.detectPackageManager).not.toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('fails the spinner and exits when test execution fails', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(packageManager.detectPackageManager).mockResolvedValue('yarn');
    vi.mocked(packageManager.runScript).mockRejectedValue(new Error('runner failed'));

    await runNamedTestCommand('myWidget', {}, config);

    expect(logger.logger.failSpinner).toHaveBeenCalledWith('Tests failed');
    expect(logger.logger.error).toHaveBeenCalledWith('runner failed');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
