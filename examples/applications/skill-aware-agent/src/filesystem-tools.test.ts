import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createWorkspaceFileTools } from './filesystem-tools.js';

describe('skill-aware agent filesystem tools', () => {
  let workspaceRoot: string;
  let outsideRoot: string;

  beforeEach(async () => {
    workspaceRoot = await mkdtemp(join(tmpdir(), 'skill-aware-workspace-'));
    outsideRoot = await mkdtemp(join(tmpdir(), 'skill-aware-outside-'));
    await writeFile(join(workspaceRoot, 'inside.ts'), 'export const inside = true;');
    await writeFile(join(outsideRoot, 'outside.ts'), 'export const outside = true;');
  });

  afterEach(async () => {
    await Promise.all([
      rm(workspaceRoot, { recursive: true, force: true }),
      rm(outsideRoot, { recursive: true, force: true }),
    ]);
  });

  it('preserves workspace reads while rejecting traversal and outside-root access', async () => {
    const { fileTools } = createWorkspaceFileTools(workspaceRoot);
    const fileReader = fileTools.find((tool) => tool.metadata.name === 'file-reader') as {
      invoke(input: { path: string }): Promise<unknown>;
    } | undefined;
    if (!fileReader) {
      throw new Error('Expected model-safe preset to include file-reader');
    }

    await expect(fileReader.invoke({ path: 'inside.ts' })).resolves.toMatchObject({
      success: true,
      data: { content: 'export const inside = true;' },
    });
    await expect(fileReader.invoke({ path: join('..', basename(outsideRoot), 'outside.ts') }))
      .resolves.toMatchObject({ success: false, error: expect.stringContaining('path traversal') });
    await expect(fileReader.invoke({ path: join(outsideRoot, 'outside.ts') })).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('outside the allowed roots'),
    });
  });
});
