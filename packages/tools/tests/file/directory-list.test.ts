import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createDirectoryListTool,
  createFileSystemPolicy,
  type DirectoryListEntry,
  type DirectoryListResult,
} from '../../src/file/index.js';

describe('directory-list result model', () => {
  let workspaceRoot: string;

  beforeEach(async () => {
    workspaceRoot = await mkdtemp(join(tmpdir(), 'agentforge-directory-list-'));
  });

  afterEach(async () => {
    await rm(workspaceRoot, { recursive: true, force: true });
  });

  it('returns an empty typed result for an empty directory', async () => {
    const directoryList = createDirectoryListTool();

    const result = await directoryList.invoke({ path: workspaceRoot });

    expect(result).toMatchObject({
      success: true,
      data: { path: workspaceRoot, files: [], count: 0 },
    });
  });

  it('lists flat files and directories with the stable common fields', async () => {
    await writeFile(join(workspaceRoot, 'readme.md'), '# AgentForge');
    await mkdir(join(workspaceRoot, 'src'));
    const directoryList = createDirectoryListTool();

    const result = await directoryList.invoke({ path: workspaceRoot });

    expect(result).toMatchObject({ success: true });
    expect(result.data?.files).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'readme.md',
        path: 'readme.md',
        isFile: true,
        isDirectory: false,
      }),
      expect.objectContaining({
        name: 'src',
        path: 'src',
        isFile: false,
        isDirectory: true,
      }),
    ]));
  });

  it('lists nested files recursively and filters file extensions', async () => {
    await mkdir(join(workspaceRoot, 'nested'));
    await writeFile(join(workspaceRoot, 'root.ts'), 'export {}');
    await writeFile(join(workspaceRoot, 'root.md'), '# Root');
    await writeFile(join(workspaceRoot, 'nested', 'child.ts'), 'export {}');
    await writeFile(join(workspaceRoot, 'nested', 'child.md'), '# Child');
    const directoryList = createDirectoryListTool(true);

    const result = await directoryList.invoke({
      path: workspaceRoot,
      recursive: true,
      extension: '.ts',
    });

    expect(result).toMatchObject({ success: true });
    const names = result.data?.files.map((file) => file.name);
    expect(names).toEqual(expect.arrayContaining(['root.ts', 'nested', 'child.ts']));
    expect(names).not.toContain('root.md');
    expect(names).not.toContain('child.md');
  });

  it('includes detail metadata when requested', async () => {
    const filePath = join(workspaceRoot, 'data.json');
    await writeFile(filePath, '{}');
    const directoryList = createDirectoryListTool(false, true);

    const result = await directoryList.invoke({ path: workspaceRoot, includeDetails: true });

    expect(result).toMatchObject({ success: true });
    expect(result.data?.files).toEqual([
      expect.objectContaining({
        name: 'data.json',
        fullPath: filePath,
        size: 2,
        modified: expect.any(String),
      }),
    ]);
  });

  it('preserves filesystem policy enforcement for typed results', async () => {
    const directoryList = createDirectoryListTool(false, false, createFileSystemPolicy({
      allowedRoots: [workspaceRoot],
    }));

    const result = await directoryList.invoke({ path: join(workspaceRoot, '..') });

    expect(result).toMatchObject({
      success: false,
      error: expect.stringContaining('outside the allowed roots'),
    });
  });

  it('exposes assignable entry and result models for consumers', () => {
    const entry: DirectoryListEntry = {
      name: 'README.md',
      path: 'README.md',
      isFile: true,
      isDirectory: false,
    };
    const result: DirectoryListResult = {
      path: '/workspace',
      files: [entry],
      count: 1,
    };

    expect(result.files[0]).toBe(entry);
  });
});
