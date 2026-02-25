/**
 * Tests for Skill Directory Scanner
 *
 * Covers: scanSkillRoot, scanAllSkillRoots, expandHome
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  scanSkillRoot,
  scanAllSkillRoots,
  expandHome,
} from '../src/scanner.js';

/**
 * Create a temporary directory for test fixtures.
 */
function createTempDir(): string {
  const dir = join(tmpdir(), `skill-scanner-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Create a skill directory with a SKILL.md file under a given root.
 */
function createSkillFixture(root: string, dirName: string, content: string): string {
  const skillDir = join(root, dirName);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, 'SKILL.md'), content, 'utf-8');
  return skillDir;
}

describe('expandHome', () => {
  it('should expand ~ to home directory', () => {
    const result = expandHome('~/some/path');
    expect(result).not.toContain('~');
    expect(result).toContain('some/path');
  });

  it('should leave absolute paths unchanged', () => {
    expect(expandHome('/foo/bar')).toBe('/foo/bar');
  });

  it('should leave relative paths unchanged', () => {
    const result = expandHome('./relative/path');
    expect(result).toContain('relative/path');
  });
});

describe('scanSkillRoot', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return empty array for non-existent root', () => {
    const result = scanSkillRoot('/non/existent/path/that/does/not/exist');
    expect(result).toEqual([]);
  });

  it('should return empty array for empty root', () => {
    tempDir = createTempDir();
    const result = scanSkillRoot(tempDir);
    expect(result).toEqual([]);
  });

  it('should discover a valid skill directory', () => {
    tempDir = createTempDir();
    createSkillFixture(tempDir, 'my-skill', `---
name: my-skill
description: A test skill
---
# My Skill`);

    const result = scanSkillRoot(tempDir);
    expect(result).toHaveLength(1);
    expect(result[0].dirName).toBe('my-skill');
    expect(result[0].content).toContain('name: my-skill');
    expect(result[0].rootPath).toBe(tempDir);
  });

  it('should discover multiple skills', () => {
    tempDir = createTempDir();
    createSkillFixture(tempDir, 'skill-a', `---
name: skill-a
description: Skill A
---
body`);
    createSkillFixture(tempDir, 'skill-b', `---
name: skill-b
description: Skill B
---
body`);

    const result = scanSkillRoot(tempDir);
    expect(result).toHaveLength(2);

    const names = result.map(c => c.dirName).sort();
    expect(names).toEqual(['skill-a', 'skill-b']);
  });

  it('should skip directories without SKILL.md', () => {
    tempDir = createTempDir();
    mkdirSync(join(tempDir, 'no-skill-dir'), { recursive: true });
    writeFileSync(join(tempDir, 'no-skill-dir', 'README.md'), 'not a skill', 'utf-8');

    createSkillFixture(tempDir, 'valid-skill', `---
name: valid-skill
description: Valid
---
body`);

    const result = scanSkillRoot(tempDir);
    expect(result).toHaveLength(1);
    expect(result[0].dirName).toBe('valid-skill');
  });

  it('should skip files at root level (not directories)', () => {
    tempDir = createTempDir();
    writeFileSync(join(tempDir, 'README.md'), '# Not a skill', 'utf-8');

    const result = scanSkillRoot(tempDir);
    expect(result).toEqual([]);
  });
});

describe('scanAllSkillRoots', () => {
  let tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs = [];
  });

  it('should scan multiple roots', () => {
    const root1 = createTempDir();
    const root2 = createTempDir();
    tempDirs.push(root1, root2);

    createSkillFixture(root1, 'skill-a', `---
name: skill-a
description: Skill A
---
body`);
    createSkillFixture(root2, 'skill-b', `---
name: skill-b
description: Skill B
---
body`);

    const result = scanAllSkillRoots([root1, root2]);
    expect(result).toHaveLength(2);
  });

  it('should handle mix of existing and non-existing roots', () => {
    const root1 = createTempDir();
    tempDirs.push(root1);

    createSkillFixture(root1, 'my-skill', `---
name: my-skill
description: A skill
---
body`);

    const result = scanAllSkillRoots([root1, '/does/not/exist']);
    expect(result).toHaveLength(1);
  });

  it('should return empty for all non-existing roots', () => {
    const result = scanAllSkillRoots(['/nonexistent1', '/nonexistent2']);
    expect(result).toEqual([]);
  });
});
