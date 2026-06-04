import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { SkillRegistry } from '../src/registry.js';
import { cleanupTempDirs, createSkillFixture, createTempDir } from './registry.test-utils.js';

describe('SkillRegistry discover()', () => {
  let tempDir: string;
  let tempDirs: string[] = [];

  beforeEach(() => {
    tempDir = createTempDir('skill-registry-rescan-test');
    tempDirs = [tempDir];
  });

  afterEach(() => {
    cleanupTempDirs(tempDirs);
  });

  it('clears and re-populates skills on re-scan', () => {
    createSkillFixture(tempDir, 'initial', `---
name: initial
description: Initial skill
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    expect(registry.size()).toBe(1);

    createSkillFixture(tempDir, 'added', `---
name: added
description: Added after init
---
body`);

    registry.discover();
    expect(registry.size()).toBe(2);
    expect(registry.has('added')).toBe(true);
  });

  it('reflects removed skills after a re-scan', () => {
    createSkillFixture(tempDir, 'to-remove', `---
name: to-remove
description: Will be removed
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    expect(registry.size()).toBe(1);

    rmSync(join(tempDir, 'to-remove'), { recursive: true, force: true });

    registry.discover();
    expect(registry.size()).toBe(0);
  });
});
