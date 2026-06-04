import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SkillRegistry } from '../src/registry.js';
import { cleanupTempDirs, createSkillFixture, createTempDir } from './registry.test-utils.js';

describe('SkillRegistry discovery', () => {
  let tempDir: string;
  let tempDirs: string[] = [];

  beforeEach(() => {
    tempDir = createTempDir('skill-registry-discovery-test');
    tempDirs = [tempDir];
  });

  afterEach(() => {
    cleanupTempDirs(tempDirs);
  });

  it('discovers skills on construction', () => {
    createSkillFixture(tempDir, 'my-skill', `---
name: my-skill
description: A test skill
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    expect(registry.size()).toBe(1);
    expect(registry.has('my-skill')).toBe(true);
  });

  it('handles empty roots', () => {
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    expect(registry.size()).toBe(0);
  });

  it('handles non-existent roots without crashing', () => {
    const registry = new SkillRegistry({ skillRoots: ['/does/not/exist'] });
    expect(registry.size()).toBe(0);
  });

  it('discovers skills from multiple roots', () => {
    const root2 = createTempDir('skill-registry-discovery-test');
    tempDirs.push(root2);

    createSkillFixture(tempDir, 'skill-a', `---
name: skill-a
description: Skill A
---
body`);
    createSkillFixture(root2, 'skill-b', `---
name: skill-b
description: Skill B
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir, root2] });
    expect(registry.size()).toBe(2);
  });

  it('skips invalid skills without aborting', () => {
    createSkillFixture(tempDir, 'valid-skill', `---
name: valid-skill
description: A valid skill
---
body`);
    createSkillFixture(tempDir, 'invalid-skill', `---
name: invalid-skill
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    expect(registry.size()).toBe(1);
    expect(registry.has('valid-skill')).toBe(true);
    expect(registry.has('invalid-skill')).toBe(false);
  });

  it('keeps first root version on duplicate name', () => {
    const root2 = createTempDir('skill-registry-discovery-test');
    tempDirs.push(root2);

    createSkillFixture(tempDir, 'shared', `---
name: shared
description: From root 1
---
body1`);
    createSkillFixture(root2, 'shared', `---
name: shared
description: From root 2
---
body2`);

    const registry = new SkillRegistry({ skillRoots: [tempDir, root2] });
    expect(registry.size()).toBe(1);

    const skill = registry.get('shared');
    expect(skill?.metadata.description).toBe('From root 1');
    expect(skill?.rootPath).toBe(tempDir);
  });

  it('records a warning for duplicate names', () => {
    const root2 = createTempDir('skill-registry-discovery-test');
    tempDirs.push(root2);

    createSkillFixture(tempDir, 'dup', `---
name: dup
description: First
---
body`);
    createSkillFixture(root2, 'dup', `---
name: dup
description: Second
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir, root2] });
    const errors = registry.getScanErrors();

    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((error) => error.error.includes('Duplicate skill name'))).toBe(true);
  });

  it('rejects skills whose name does not match the directory', () => {
    createSkillFixture(tempDir, 'wrong-dir', `---
name: my-skill
description: Name does not match directory
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    expect(registry.size()).toBe(0);
    expect(registry.getScanErrors()).toHaveLength(1);
    expect(registry.getScanErrors()[0].error).toContain('must match parent directory name');
  });

  it('skips malformed yaml while still discovering valid skills', () => {
    createSkillFixture(tempDir, 'bad-yaml', `---
name: [broken
  yaml: {{invalid
---
body`);
    createSkillFixture(tempDir, 'good-skill', `---
name: good-skill
description: Valid skill
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    expect(registry.size()).toBe(1);
    expect(registry.has('good-skill')).toBe(true);
  });

  it('skips skills with empty frontmatter', () => {
    createSkillFixture(tempDir, 'empty-front', `---
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    expect(registry.size()).toBe(0);
  });

  it('skips skills with no frontmatter at all', () => {
    createSkillFixture(tempDir, 'no-front', `# Just markdown

No frontmatter here.`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    expect(registry.size()).toBe(0);
  });
});
