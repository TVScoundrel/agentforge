import { mkdir, mkdtemp, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFileSearchTool, createFileSystemPolicy } from '../../src/file/index.js';

describe('file-search traversal behavior', () => {
  let workspaceRoot: string;
  let outsideRoot: string;

  beforeEach(async () => {
    workspaceRoot = await mkdtemp(join(tmpdir(), 'agentforge-file-search-workspace-'));
    outsideRoot = await mkdtemp(join(tmpdir(), 'agentforge-file-search-outside-'));
  });

  afterEach(async () => {
    await Promise.all([
      rm(workspaceRoot, { recursive: true, force: true }),
      rm(outsideRoot, { recursive: true, force: true }),
    ]);
  });

  it('returns flat matches as resolved paths in the existing success envelope', async () => {
    await writeFile(join(workspaceRoot, 'notes.txt'), 'notes');
    await writeFile(join(workspaceRoot, 'ignored.md'), 'ignored');
    const fileSearch = createFileSearchTool(true, false, createFileSystemPolicy({ workspaceRoot }));
    const resolvedWorkspaceRoot = await realpath(workspaceRoot);

    const result = await fileSearch.invoke({ directory: '.', pattern: '*.txt' });

    expect(result).toEqual({
      success: true,
      data: {
        directory: '.',
        pattern: '*.txt',
        matches: [join(resolvedWorkspaceRoot, 'notes.txt')],
        count: 1,
      },
    });
  });

  it('preserves native directory-read order in a sequential depth-first recursive search', async () => {
    await mkdir(join(workspaceRoot, 'first-level'));
    await mkdir(join(workspaceRoot, 'second-level'));
    await mkdir(join(workspaceRoot, 'first-level', 'nested'));
    await writeFile(join(workspaceRoot, 'root.txt'), 'root');
    await writeFile(join(workspaceRoot, 'first-level', 'first.txt'), 'first');
    await writeFile(join(workspaceRoot, 'first-level', 'nested', 'nested.txt'), 'nested');
    await writeFile(join(workspaceRoot, 'second-level', 'second.txt'), 'second');
    const fileSearch = createFileSearchTool();

    const firstLevelPath = join(workspaceRoot, 'first-level');
    const nestedPath = join(firstLevelPath, 'nested');
    const secondLevelPath = join(workspaceRoot, 'second-level');
    const [rootEntries, firstLevelEntries, nestedEntries, secondLevelEntries] = await Promise.all([
      readdir(workspaceRoot),
      readdir(firstLevelPath),
      readdir(nestedPath),
      readdir(secondLevelPath),
    ]);
    const firstLevelMatches = firstLevelEntries.flatMap((entryName) => {
      if (entryName === 'first.txt') {
        return [join(firstLevelPath, entryName)];
      }
      if (entryName === 'nested') {
        return nestedEntries.map((nestedEntryName) => join(nestedPath, nestedEntryName));
      }
      return [];
    });
    const expectedMatches = rootEntries.flatMap((entryName) => {
      if (entryName === 'root.txt') {
        return [join(workspaceRoot, entryName)];
      }
      if (entryName === 'first-level') {
        return firstLevelMatches;
      }
      if (entryName === 'second-level') {
        return secondLevelEntries.map((secondLevelEntryName) =>
          join(secondLevelPath, secondLevelEntryName)
        );
      }
      return [];
    });

    await expect(
      fileSearch.invoke({
        directory: workspaceRoot,
        pattern: '*.txt',
        recursive: true,
      })
    ).resolves.toEqual({
      success: true,
      data: {
        directory: workspaceRoot,
        pattern: '*.txt',
        matches: expectedMatches,
        count: expectedMatches.length,
      },
    });
  });

  it('does not descend into directories when recursion is explicitly disabled', async () => {
    await mkdir(join(workspaceRoot, 'nested'));
    await writeFile(join(workspaceRoot, 'root.txt'), 'root');
    await writeFile(join(workspaceRoot, 'nested', 'child.txt'), 'child');
    const fileSearch = createFileSearchTool(true);

    await expect(
      fileSearch.invoke({
        directory: workspaceRoot,
        pattern: '*.txt',
        recursive: false,
      })
    ).resolves.toMatchObject({
      success: true,
      data: {
        matches: [join(workspaceRoot, 'root.txt')],
        count: 1,
      },
    });
  });

  it('converts star wildcards while preserving literal dots and case options', async () => {
    await writeFile(join(workspaceRoot, 'report.v1.test.ts'), 'lowercase');
    await writeFile(join(workspaceRoot, 'REPORT.V2.TEST.TS'), 'uppercase');
    await writeFile(join(workspaceRoot, 'reportXv3XtestXts'), 'dots must remain literal');
    await writeFile(join(workspaceRoot, 'report.v4.spec.ts'), 'wrong suffix');
    const fileSearch = createFileSearchTool();
    const pattern = 'report.*.test.ts';

    const insensitiveResult = await fileSearch.invoke({
      directory: workspaceRoot,
      pattern,
      caseSensitive: false,
    });
    const sensitiveResult = await fileSearch.invoke({
      directory: workspaceRoot,
      pattern,
      caseSensitive: true,
    });

    expect(insensitiveResult).toMatchObject({
      success: true,
      data: {
        matches: expect.arrayContaining([
          join(workspaceRoot, 'report.v1.test.ts'),
          join(workspaceRoot, 'REPORT.V2.TEST.TS'),
        ]),
        count: 2,
      },
    });
    expect(sensitiveResult).toMatchObject({
      success: true,
      data: {
        matches: [join(workspaceRoot, 'report.v1.test.ts')],
        count: 1,
      },
    });
  });

  it('returns only files without matching or following symbolic links', async () => {
    await writeFile(join(workspaceRoot, 'real.txt'), 'real');
    await mkdir(join(workspaceRoot, 'matching-directory.txt'));
    await writeFile(join(outsideRoot, 'outside.txt'), 'outside');
    await symlink(join(outsideRoot, 'outside.txt'), join(workspaceRoot, 'linked-file.txt'));
    await symlink(outsideRoot, join(workspaceRoot, 'linked-directory'));
    const fileSearch = createFileSearchTool();

    await expect(
      fileSearch.invoke({
        directory: workspaceRoot,
        pattern: '*.txt',
        recursive: true,
      })
    ).resolves.toEqual({
      success: true,
      data: {
        directory: workspaceRoot,
        pattern: '*.txt',
        matches: [join(workspaceRoot, 'real.txt')],
        count: 1,
      },
    });
  });

  it('returns missing-directory and confinement errors through the safe Tool envelope', async () => {
    const unrestrictedSearch = createFileSearchTool();
    const confinedSearch = createFileSearchTool(
      true,
      false,
      createFileSystemPolicy({ allowedRoots: [workspaceRoot] })
    );

    await expect(
      unrestrictedSearch.invoke({
        directory: join(workspaceRoot, 'missing'),
        pattern: '*.txt',
      })
    ).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('ENOENT'),
    });
    await expect(
      confinedSearch.invoke({
        directory: outsideRoot,
        pattern: '*.txt',
      })
    ).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('outside the allowed roots'),
    });
  });
});
