import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createDirectoryOperationTools,
  createFileOperationTools,
  createFileSystemPolicy,
} from '../../src/file/index.js';

describe('file system confinement policy', () => {
  let workspaceRoot: string;
  let outsideRoot: string;

  beforeEach(async () => {
    workspaceRoot = await mkdtemp(join(tmpdir(), 'agentforge-file-policy-workspace-'));
    outsideRoot = await mkdtemp(join(tmpdir(), 'agentforge-file-policy-outside-'));
    await writeFile(join(workspaceRoot, 'inside.txt'), 'inside');
    await writeFile(join(outsideRoot, 'outside.txt'), 'outside');
  });

  afterEach(async () => {
    await Promise.all([
      rm(workspaceRoot, { recursive: true, force: true }),
      rm(outsideRoot, { recursive: true, force: true }),
    ]);
  });

  it('resolves relative paths from the configured workspace root', async () => {
    const [reader] = createFileOperationTools({
      policy: createFileSystemPolicy({ workspaceRoot }),
    });

    await expect(reader.invoke({ path: 'inside.txt' })).resolves.toMatchObject({
      success: true,
      data: { content: 'inside' },
    });
  });

  it('blocks lexical traversal before file reads or writes', async () => {
    const [reader, writer] = createFileOperationTools({
      policy: createFileSystemPolicy({ allowedRoots: [workspaceRoot] }),
    });

    await expect(reader.invoke({ path: join(workspaceRoot, '..', 'outside.txt') })).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('outside the allowed roots'),
    });
    await expect(writer.invoke({
      path: `${workspaceRoot}/../escape.txt`,
      content: 'blocked',
    })).resolves.toMatchObject({ success: false, error: expect.stringContaining('path traversal') });
  });

  it('blocks symlink escapes for reads and deletes', async () => {
    const linkPath = join(workspaceRoot, 'outside-link.txt');
    await symlink(join(outsideRoot, 'outside.txt'), linkPath);

    const [reader, , , deleter] = createFileOperationTools({
      policy: createFileSystemPolicy({ allowedRoots: [workspaceRoot] }),
    });

    await expect(reader.invoke({ path: linkPath })).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('outside the allowed roots'),
    });
    await expect(deleter.invoke({ path: linkPath })).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('outside the allowed roots'),
    });
    await expect(readFile(join(outsideRoot, 'outside.txt'), 'utf8')).resolves.toBe('outside');
  });

  it('blocks recursive deletion of a configured root', async () => {
    const [, , directoryDeleter] = createDirectoryOperationTools({
      policy: createFileSystemPolicy({ allowedRoots: [workspaceRoot] }),
    });

    await expect(directoryDeleter.invoke({ path: workspaceRoot, recursive: true })).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('recursive deletion of an allowed root'),
    });
    await expect(readFile(join(workspaceRoot, 'inside.txt'), 'utf8')).resolves.toBe('inside');
  });

  it('does not follow symlink entries while listing a confined root', async () => {
    await symlink(outsideRoot, join(workspaceRoot, 'outside-directory-link'));
    const [directoryList] = createDirectoryOperationTools({
      defaultIncludeDetails: true,
      policy: createFileSystemPolicy({ allowedRoots: [workspaceRoot] }),
    });

    await expect(directoryList.invoke({ path: workspaceRoot })).resolves.toMatchObject({
      success: true,
      data: {
        files: expect.arrayContaining([
          expect.objectContaining({ name: 'outside-directory-link', isDirectory: false }),
        ]),
      },
    });
  });

  it('validates missing creation parents and directory traversal through one policy', async () => {
    const [, writer] = createFileOperationTools({
      policy: createFileSystemPolicy({ allowedRoots: [workspaceRoot] }),
    });
    const [, directoryCreator] = createDirectoryOperationTools({
      policy: createFileSystemPolicy({ allowedRoots: [workspaceRoot] }),
    });

    await expect(writer.invoke({
      path: join(workspaceRoot, 'nested', 'created.txt'),
      content: 'created',
      createDirs: true,
    })).resolves.toMatchObject({
      success: true,
      data: { path: join(workspaceRoot, 'nested', 'created.txt') },
    });
    await expect(directoryCreator.invoke({
      path: `${workspaceRoot}/../outside-created`,
      recursive: true,
    })).resolves.toMatchObject({ success: false, error: expect.stringContaining('path traversal') });
  });

  it('preserves an explicit privileged opt-out for trusted automation', async () => {
    const [, writer] = createFileOperationTools({
      policy: createFileSystemPolicy({
        allowedRoots: [workspaceRoot],
        allowOutsideRoots: true,
      }),
    });
    const outsidePath = join(outsideRoot, 'privileged.txt');

    await expect(writer.invoke({ path: outsidePath, content: 'allowed' })).resolves.toMatchObject({
      success: true,
      data: { path: outsidePath },
    });
    await expect(readFile(outsidePath, 'utf8')).resolves.toBe('allowed');
  });

  it('does not hide confinement errors from file-exists checks', async () => {
    const [, , , , exists] = createFileOperationTools({
      policy: createFileSystemPolicy({ allowedRoots: [workspaceRoot] }),
    });

    await expect(exists.invoke({ path: join(workspaceRoot, '..', 'outside.txt') })).rejects.toMatchObject({
      code: 'FILE_SYSTEM_POLICY_VIOLATION',
    });
  });
});
