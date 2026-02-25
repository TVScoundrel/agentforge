/**
 * Tests for SkillRegistry
 *
 * Covers: constructor auto-discovery, query API (get, getAll, has, size, getNames),
 * duplicate handling, event system, scan errors, malformed skill recovery.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SkillRegistry } from '../src/registry.js';
import { SkillRegistryEvent } from '../src/types.js';

/**
 * Create a temp directory for test fixtures.
 */
function createTempDir(): string {
  const dir = join(tmpdir(), `skill-registry-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

describe('SkillRegistry', () => {
  let tempDir: string;
  let tempDirs: string[] = [];

  beforeEach(() => {
    tempDir = createTempDir();
    tempDirs = [tempDir];
  });

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('Constructor and Auto-Discovery', () => {
    it('should discover skills on construction', () => {
      createSkillFixture(tempDir, 'my-skill', `---
name: my-skill
description: A test skill
---
body`);

      const registry = new SkillRegistry({ skillRoots: [tempDir] });
      expect(registry.size()).toBe(1);
      expect(registry.has('my-skill')).toBe(true);
    });

    it('should handle empty roots', () => {
      const registry = new SkillRegistry({ skillRoots: [tempDir] });
      expect(registry.size()).toBe(0);
    });

    it('should handle non-existent roots without crashing', () => {
      const registry = new SkillRegistry({ skillRoots: ['/does/not/exist'] });
      expect(registry.size()).toBe(0);
    });

    it('should discover skills from multiple roots', () => {
      const root2 = createTempDir();
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

    it('should skip invalid skills without aborting', () => {
      createSkillFixture(tempDir, 'valid-skill', `---
name: valid-skill
description: A valid skill
---
body`);

      // Invalid: missing required description
      createSkillFixture(tempDir, 'invalid-skill', `---
name: invalid-skill
---
body`);

      const registry = new SkillRegistry({ skillRoots: [tempDir] });
      expect(registry.size()).toBe(1);
      expect(registry.has('valid-skill')).toBe(true);
      expect(registry.has('invalid-skill')).toBe(false);
    });
  });

  describe('Query API', () => {
    let registry: SkillRegistry;

    beforeEach(() => {
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

      registry = new SkillRegistry({ skillRoots: [tempDir] });
    });

    it('should get a skill by name', () => {
      const skill = registry.get('alpha');
      expect(skill).toBeDefined();
      expect(skill!.metadata.name).toBe('alpha');
      expect(skill!.metadata.description).toBe('Alpha skill');
    });

    it('should return undefined for non-existent skill', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });

    it('should return all skills', () => {
      const all = registry.getAll();
      expect(all).toHaveLength(2);
      const names = all.map(s => s.metadata.name).sort();
      expect(names).toEqual(['alpha', 'beta']);
    });

    it('should check if skill exists', () => {
      expect(registry.has('alpha')).toBe(true);
      expect(registry.has('gamma')).toBe(false);
    });

    it('should return correct size', () => {
      expect(registry.size()).toBe(2);
    });

    it('should return all skill names', () => {
      const names = registry.getNames().sort();
      expect(names).toEqual(['alpha', 'beta']);
    });

    it('should include optional metadata fields', () => {
      const skill = registry.get('alpha');
      expect(skill!.metadata.license).toBe('MIT');
    });

    it('should include skill path and root path', () => {
      const skill = registry.get('alpha');
      expect(skill!.skillPath).toContain('alpha');
      expect(skill!.rootPath).toBe(tempDir);
    });
  });

  describe('Duplicate Handling', () => {
    it('should keep first root version on duplicate name', () => {
      const root2 = createTempDir();
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

      const skill = registry.get('shared')!;
      expect(skill.metadata.description).toBe('From root 1');
      expect(skill.rootPath).toBe(tempDir);
    });

    it('should emit warning for duplicate', () => {
      const root2 = createTempDir();
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

      const warnings: unknown[] = [];
      // Create registry with pre-registered handler won't work since
      // discovery happens in constructor. Use getScanErrors instead.
      const registry = new SkillRegistry({ skillRoots: [tempDir, root2] });
      const errors = registry.getScanErrors();
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors.some(e => e.error.includes('Duplicate skill name'))).toBe(true);
    });
  });

  describe('Name-Directory Mismatch', () => {
    it('should reject skill where name does not match directory', () => {
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
  });

  describe('Malformed Skill Recovery', () => {
    it('should skip skill with malformed YAML', () => {
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

    it('should skip skill with empty frontmatter', () => {
      createSkillFixture(tempDir, 'empty-front', `---
---
body`);

      const registry = new SkillRegistry({ skillRoots: [tempDir] });
      expect(registry.size()).toBe(0);
    });

    it('should skip skill with no frontmatter at all', () => {
      createSkillFixture(tempDir, 'no-front', `# Just markdown\n\nNo frontmatter here.`);

      const registry = new SkillRegistry({ skillRoots: [tempDir] });
      expect(registry.size()).toBe(0);
    });
  });

  describe('Event System', () => {
    it('should emit skill:discovered events', () => {
      createSkillFixture(tempDir, 'event-skill', `---
name: event-skill
description: Triggers events
---
body`);

      // We need to register handler before discovery runs.
      // Since discovery runs in constructor, we use discover() re-scan.
      const registry = new SkillRegistry({ skillRoots: [tempDir] });

      const discoveredSkills: unknown[] = [];
      registry.on(SkillRegistryEvent.SKILL_DISCOVERED, (data) => {
        discoveredSkills.push(data);
      });

      // Re-scan to trigger events with our handler
      registry.discover();
      expect(discoveredSkills).toHaveLength(1);
    });

    it('should emit skill:warning events for invalid skills', () => {
      createSkillFixture(tempDir, 'invalid', `---
name: invalid
---
body`);

      const registry = new SkillRegistry({ skillRoots: [tempDir] });

      const warnings: unknown[] = [];
      registry.on(SkillRegistryEvent.SKILL_WARNING, (data) => {
        warnings.push(data);
      });

      registry.discover();
      expect(warnings).toHaveLength(1);
    });

    it('should support off() to remove handlers', () => {
      createSkillFixture(tempDir, 'off-test', `---
name: off-test
description: Test off
---
body`);

      const registry = new SkillRegistry({ skillRoots: [tempDir] });

      const events: unknown[] = [];
      const handler = (data: unknown) => events.push(data);

      registry.on(SkillRegistryEvent.SKILL_DISCOVERED, handler);
      registry.discover();
      expect(events).toHaveLength(1);

      registry.off(SkillRegistryEvent.SKILL_DISCOVERED, handler);
      registry.discover();
      // Should still be 1, not 2 — handler was removed
      expect(events).toHaveLength(1);
    });

    it('should not crash if event handler throws', () => {
      createSkillFixture(tempDir, 'crash-test', `---
name: crash-test
description: Handler will throw
---
body`);

      const registry = new SkillRegistry({ skillRoots: [tempDir] });

      registry.on(SkillRegistryEvent.SKILL_DISCOVERED, () => {
        throw new Error('Handler exploded!');
      });

      // Should not throw
      expect(() => registry.discover()).not.toThrow();
    });
  });

  describe('Re-scan (discover)', () => {
    it('should clear and re-populate on discover()', () => {
      createSkillFixture(tempDir, 'initial', `---
name: initial
description: Initial skill
---
body`);

      const registry = new SkillRegistry({ skillRoots: [tempDir] });
      expect(registry.size()).toBe(1);

      // Add another skill on disk
      createSkillFixture(tempDir, 'added', `---
name: added
description: Added after init
---
body`);

      registry.discover();
      expect(registry.size()).toBe(2);
      expect(registry.has('added')).toBe(true);
    });

    it('should reflect removed skills after re-scan', () => {
      createSkillFixture(tempDir, 'to-remove', `---
name: to-remove
description: Will be removed
---
body`);

      const registry = new SkillRegistry({ skillRoots: [tempDir] });
      expect(registry.size()).toBe(1);

      // Remove from disk
      rmSync(join(tempDir, 'to-remove'), { recursive: true, force: true });

      registry.discover();
      expect(registry.size()).toBe(0);
    });
  });

  describe('getScanErrors', () => {
    it('should return empty array on clean scan', () => {
      createSkillFixture(tempDir, 'clean', `---
name: clean
description: No issues
---
body`);

      const registry = new SkillRegistry({ skillRoots: [tempDir] });
      expect(registry.getScanErrors()).toEqual([]);
    });

    it('should collect parse errors', () => {
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
});
