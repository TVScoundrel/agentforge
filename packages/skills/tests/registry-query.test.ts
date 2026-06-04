import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SkillRegistry } from '../src/registry.js';
import { cleanupTempDirs, createSkillFixture, createTempDir } from './registry.test-utils.js';

describe('SkillRegistry query api', () => {
  let tempDir: string;
  let tempDirs: string[] = [];

  beforeEach(() => {
    tempDir = createTempDir('skill-registry-query-test');
    tempDirs = [tempDir];
  });

  afterEach(() => {
    cleanupTempDirs(tempDirs);
  });

  it('returns discovered skills and metadata through the query helpers', () => {
    createSkillFixture(tempDir, 'alpha', `---
name: alpha
description: Alpha skill
license: MIT
---
Alpha body`);
    createSkillFixture(tempDir, 'beta', `---
name: beta
description: Beta skill for testing
---
Beta body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });

    const alpha = registry.get('alpha');
    expect(alpha?.metadata.name).toBe('alpha');
    expect(alpha?.metadata.description).toBe('Alpha skill');
    expect(alpha?.metadata.license).toBe('MIT');
    expect(alpha?.skillPath).toContain('alpha');
    expect(alpha?.rootPath).toBe(tempDir);

    expect(registry.get('nonexistent')).toBeUndefined();
    expect(registry.getAll()).toHaveLength(2);
    expect(registry.getAll().map((skill) => skill.metadata.name).sort()).toEqual(['alpha', 'beta']);
    expect(registry.has('alpha')).toBe(true);
    expect(registry.has('gamma')).toBe(false);
    expect(registry.size()).toBe(2);
    expect(registry.getNames().sort()).toEqual(['alpha', 'beta']);
  });

  it('returns an empty scan error list after a clean discovery run', () => {
    createSkillFixture(tempDir, 'clean', `---
name: clean
description: No issues
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    expect(registry.getScanErrors()).toEqual([]);
  });

  it('collects parse errors from invalid skills', () => {
    createSkillFixture(tempDir, 'broken', `---
name: UPPERCASE
description: Bad name
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const errors = registry.getScanErrors();

    expect(errors).toHaveLength(1);
    expect(errors[0].path).toContain('broken');
  });
});
