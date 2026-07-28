import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createModelSafeToolPreset } from '../src/model-safe.js';

vi.mock('axios');

const mockedAxios = vi.mocked(axios);

describe('model-safe tool preset', () => {
  let workspaceRoot: string;
  let outsideRoot: string;

  beforeEach(async () => {
    workspaceRoot = await mkdtemp(join(tmpdir(), 'agentforge-model-safe-workspace-'));
    outsideRoot = await mkdtemp(join(tmpdir(), 'agentforge-model-safe-outside-'));
    await writeFile(join(workspaceRoot, 'inside.txt'), 'inside');
    await writeFile(join(outsideRoot, 'outside.txt'), 'outside');
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await Promise.all([
      rm(workspaceRoot, { recursive: true, force: true }),
      rm(outsideRoot, { recursive: true, force: true }),
    ]);
  });

  it('requires an explicit filesystem root', () => {
    expect(() => createModelSafeToolPreset()).toThrow('requires workspaceRoot or allowedRoots');
  });

  it('combines confined file tools with policy-checked web tools', async () => {
    const preset = createModelSafeToolPreset({ fileSystem: { workspaceRoot } });
    const fileReader = preset.fileTools.find((tool) => tool.metadata.name === 'file-reader')!;
    const httpGet = preset.webTools.find((tool) => tool.metadata.name === 'http-get')!;

    await expect(fileReader.invoke({ path: 'inside.txt' })).resolves.toMatchObject({
      success: true,
      data: { content: 'inside' },
    });
    await expect(fileReader.invoke({ path: join(outsideRoot, 'outside.txt') })).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('outside the allowed roots'),
    });
    await expect(httpGet.invoke({ url: 'http://127.0.0.1/internal' })).rejects.toMatchObject({ reason: 'localhost' });
    expect(preset.tools).toHaveLength(preset.fileTools.length + preset.directoryTools.length + preset.webTools.length);
  });

  it('blocks symlink escapes and private redirect targets', async () => {
    await symlink(join(outsideRoot, 'outside.txt'), join(workspaceRoot, 'outside-link.txt'));
    const preset = createModelSafeToolPreset({ fileSystem: { workspaceRoot } });
    const fileReader = preset.fileTools.find((tool) => tool.metadata.name === 'file-reader')!;
    const httpGet = preset.webTools.find((tool) => tool.metadata.name === 'http-get')!;

    await expect(fileReader.invoke({ path: join(workspaceRoot, 'outside-link.txt') })).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('outside the allowed roots'),
    });

    mockedAxios
      .mockResolvedValueOnce({ status: 302, headers: { location: 'http://192.168.1.20/internal' }, config: {}, data: undefined })
      .mockResolvedValueOnce({ status: 200, headers: {}, config: {}, data: { ok: true } });
    await expect(httpGet.invoke({ url: 'http://93.184.216.34/start' })).rejects.toMatchObject({ reason: 'private-network' });
    expect(mockedAxios).toHaveBeenCalledTimes(1);
  });

  it('allows configured workspace and public-host use while forcing safe policy flags', async () => {
    const preset = createModelSafeToolPreset({
      fileSystem: { workspaceRoot, allowOutsideRoots: true, allowRootDeletion: true },
      web: { destinationPolicy: { allowPrivateNetwork: true, allowMetadata: true, allowLocalhost: true } },
    });
    const httpGet = preset.webTools.find((tool) => tool.metadata.name === 'http-get')!;
    mockedAxios.mockResolvedValue({ status: 200, headers: {}, config: {}, data: { ok: true } });

    await expect(httpGet.invoke({ url: 'http://127.0.0.1/should-still-be-blocked' })).rejects.toMatchObject({ reason: 'localhost' });
    await expect(httpGet.invoke({ url: 'http://93.184.216.34/public' })).resolves.toEqual({ ok: true });
  });
});
