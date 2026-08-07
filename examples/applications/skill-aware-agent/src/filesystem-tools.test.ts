import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
    const fileReader = fileTools[0] as {
      invoke(input: { path: string }): Promise<unknown>;
    };

    await expect(fileReader.invoke({ path: 'inside.ts' })).resolves.toMatchObject({
      success: true,
      data: { content: 'export const inside = true;' },
    });
    await expect(fileReader.invoke({ path: join('..', outsideRoot.split('/').at(-1)!, 'outside.ts') }))
      .resolves.toMatchObject({ success: false, error: expect.stringContaining('path traversal') });
    await expect(fileReader.invoke({ path: join(outsideRoot, 'outside.ts') })).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('outside the allowed roots'),
    });
  });
});
