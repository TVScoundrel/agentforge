import { beforeEach, vi } from 'vitest';
import { toolPublishCommand } from '../../../../src/commands/tool/publish.js';
import * as packageManager from '../../../../src/utils/package-manager.js';
import * as logger from '../../../../src/utils/logger.js';
import fs from 'fs-extra';

vi.mock('../../../../src/utils/package-manager.js');
vi.mock('../../../../src/utils/logger.js');
vi.mock('fs-extra');

export const mockedPackageManager = vi.mocked(packageManager);
export const mockedLogger = logger.logger;
export const mockedFs = vi.mocked(fs);

export function usePublishCommandMocks(): void {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    mockedFs.pathExists.mockResolvedValue(true);
    mockedFs.readJson.mockResolvedValue({
      name: 'myTool',
      version: '1.0.0',
      scripts: {
        test: 'vitest',
        build: 'tsup',
      },
    });
  });
}

export async function runPublishCommand(
  name = 'myTool',
  options: Parameters<typeof toolPublishCommand>[1] = {}
): Promise<void> {
  await toolPublishCommand(name, options);
}
