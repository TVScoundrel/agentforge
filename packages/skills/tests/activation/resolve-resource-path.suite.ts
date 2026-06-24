import { symlinkSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveResourcePath } from '../../src/activation.js';
import { createTempDir } from './shared.js';

describe('resolveResourcePath', () => {
  it('resolves a valid relative path within the skill root', () => {
    const result = resolveResourcePath('/skills/my-skill', 'references/guide.md');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.resolvedPath).toBe(resolve('/skills/my-skill', 'references/guide.md'));
    }
  });

  it('blocks absolute paths', () => {
    const result = resolveResourcePath('/skills/my-skill', '/etc/passwd');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Absolute resource paths');
    }
  });

  it('blocks backslash absolute paths on Windows or treats them as relative on POSIX', () => {
    const result = resolveResourcePath('/skills/my-skill', '\\etc\\passwd');
    if (process.platform === 'win32') {
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Absolute resource paths');
      }
      return;
    }

    expect(result.success).toBe(true);
  });

  it('blocks simple and nested traversal attempts', () => {
    const simple = resolveResourcePath('/skills/my-skill', '../secrets/key');
    expect(simple.success).toBe(false);
    if (!simple.success) {
      expect(simple.error).toContain('Path traversal');
    }

    const nested = resolveResourcePath('/skills/my-skill', 'references/../../secrets/key');
    expect(nested.success).toBe(false);
    if (!nested.success) {
      expect(nested.error).toContain('Path traversal');
    }
  });

  it('allows safe nested paths and dotted filenames', () => {
    expect(resolveResourcePath('/skills/my-skill', 'README.md').success).toBe(true);
    expect(resolveResourcePath('/skills/my-skill', 'scripts/setup/install.sh').success).toBe(true);
    expect(resolveResourcePath('/skills/my-skill', 'assets/logo.png').success).toBe(true);
    expect(resolveResourcePath('/skills/my-skill', 'references/foo..bar.md').success).toBe(true);
  });

  it('blocks symlinks that escape the skill directory', () => {
    const skillRoot = createTempDir();
    const outsideDir = createTempDir();
    const outsideFile = join(outsideDir, 'secret.txt');
    writeFileSync(outsideFile, 'secret-data', 'utf-8');

    const symlinkPath = join(skillRoot, 'escape-link.txt');
    symlinkSync(outsideFile, symlinkPath);

    const result = resolveResourcePath(skillRoot, 'escape-link.txt');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Symlink target escapes the skill directory');
    }

    rmSync(skillRoot, { recursive: true, force: true });
    rmSync(outsideDir, { recursive: true, force: true });
  });
});
