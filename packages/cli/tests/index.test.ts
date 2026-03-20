import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('CLI run', () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.resetModules();
    process.argv = ['node', 'agentforge', '--help'];
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  it('does not treat help output as an error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const { run } = await import('../src/index.js');

    await expect(run()).resolves.toBeUndefined();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
