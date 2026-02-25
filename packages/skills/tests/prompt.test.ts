/**
 * Tests for SkillRegistry.generatePrompt()
 *
 * Covers: XML generation, subset filtering, feature flag gating,
 * maxDiscoveredSkills cap, prompt composition, XML escaping, token estimation,
 * and edge cases.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SkillRegistry } from '../src/registry.js';

/**
 * Create a temp directory for test fixtures.
 */
function createTempDir(): string {
  const dir = join(tmpdir(), `skill-prompt-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Create a skill directory with a SKILL.md file under a given root.
 */
function createSkillFixture(root: string, dirName: string, frontmatter: { name: string; description: string }): string {
  const skillDir = join(root, dirName);
  mkdirSync(skillDir, { recursive: true });
  const content = `---\nname: ${frontmatter.name}\ndescription: "${frontmatter.description}"\n---\n\n# ${frontmatter.name}\n\nSkill body content.`;
  writeFileSync(join(skillDir, 'SKILL.md'), content, 'utf-8');
  return skillDir;
}

describe('SkillRegistry.generatePrompt()', () => {
  let tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs = [];
  });

  function makeTempDir(): string {
    const dir = createTempDir();
    tempDirs.push(dir);
    return dir;
  }

  // ─── Feature Flag Gating ───────────────────────────────────────────────

  describe('Feature Flag Gating', () => {
    it('should return empty string when enabled is not set (default off)', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'my-skill', { name: 'my-skill', description: 'A skill' });

      const registry = new SkillRegistry({ skillRoots: [root] });
      expect(registry.size()).toBe(1);
      expect(registry.generatePrompt()).toBe('');
    });

    it('should return empty string when enabled is false', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'my-skill', { name: 'my-skill', description: 'A skill' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: false });
      expect(registry.generatePrompt()).toBe('');
    });

    it('should generate XML when enabled is true', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'my-skill', { name: 'my-skill', description: 'A skill' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      const xml = registry.generatePrompt();
      expect(xml).toContain('<available_skills>');
      expect(xml).toContain('</available_skills>');
      expect(xml).toContain('<name>my-skill</name>');
    });

    it('should return empty string when enabled but no skills discovered', () => {
      const root = makeTempDir();
      // Empty root — no skills
      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      expect(registry.generatePrompt()).toBe('');
    });
  });

  // ─── XML Generation ────────────────────────────────────────────────────

  describe('XML Generation', () => {
    it('should produce valid XML structure with name, description, location', () => {
      const root = makeTempDir();
      const skillDir = createSkillFixture(root, 'code-review', {
        name: 'code-review',
        description: 'Review code for quality and correctness',
      });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      const xml = registry.generatePrompt();

      expect(xml).toMatch(/^<available_skills>\n/);
      expect(xml).toMatch(/\n<\/available_skills>$/);
      expect(xml).toContain('  <skill>');
      expect(xml).toContain('  </skill>');
      expect(xml).toContain('    <name>code-review</name>');
      expect(xml).toContain('    <description>Review code for quality and correctness</description>');
      expect(xml).toContain(`    <location>${skillDir}</location>`);
    });

    it('should include multiple skills', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'code-review', { name: 'code-review', description: 'Review code' });
      createSkillFixture(root, 'testing', { name: 'testing', description: 'Write tests' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      const xml = registry.generatePrompt();

      expect(xml).toContain('<name>code-review</name>');
      expect(xml).toContain('<name>testing</name>');

      // Count skill blocks
      const skillBlocks = xml.match(/<skill>/g);
      expect(skillBlocks).toHaveLength(2);
    });

    it('should escape XML special characters in skill fields', () => {
      const root = makeTempDir();
      const skillDir = join(root, 'html-tools');
      mkdirSync(skillDir, { recursive: true });
      // Description with XML-unsafe characters
      writeFileSync(join(skillDir, 'SKILL.md'), [
        '---',
        'name: html-tools',
        'description: "Tools for <html> & \'CSS\\" parsing"',
        '---',
        '',
        '# HTML Tools',
      ].join('\n'), 'utf-8');

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      const xml = registry.generatePrompt();

      expect(xml).toContain('<name>html-tools</name>');
      // Should escape < > & ' "
      expect(xml).toContain('&lt;html&gt;');
      expect(xml).toContain('&amp;');
    });
  });

  // ─── Subset Filtering ─────────────────────────────────────────────────

  describe('Subset Filtering', () => {
    it('should filter to requested skill names', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'code-review', { name: 'code-review', description: 'Review code' });
      createSkillFixture(root, 'testing', { name: 'testing', description: 'Write tests' });
      createSkillFixture(root, 'deployment', { name: 'deployment', description: 'Deploy apps' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      const xml = registry.generatePrompt({ skills: ['code-review', 'testing'] });

      expect(xml).toContain('<name>code-review</name>');
      expect(xml).toContain('<name>testing</name>');
      expect(xml).not.toContain('<name>deployment</name>');

      const skillBlocks = xml.match(/<skill>/g);
      expect(skillBlocks).toHaveLength(2);
    });

    it('should return empty string when no requested skills exist', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'code-review', { name: 'code-review', description: 'Review code' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      const xml = registry.generatePrompt({ skills: ['nonexistent'] });

      expect(xml).toBe('');
    });

    it('should return all skills when skills array is empty', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'code-review', { name: 'code-review', description: 'Review code' });
      createSkillFixture(root, 'testing', { name: 'testing', description: 'Write tests' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      const xml = registry.generatePrompt({ skills: [] });

      expect(xml).toContain('<name>code-review</name>');
      expect(xml).toContain('<name>testing</name>');
    });

    it('should return all skills when no options provided', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'code-review', { name: 'code-review', description: 'Review code' });
      createSkillFixture(root, 'testing', { name: 'testing', description: 'Write tests' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      const xml = registry.generatePrompt();

      expect(xml).toContain('<name>code-review</name>');
      expect(xml).toContain('<name>testing</name>');
    });

    it('should gracefully handle mix of existing and non-existing names', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'code-review', { name: 'code-review', description: 'Review code' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      const xml = registry.generatePrompt({ skills: ['code-review', 'nonexistent'] });

      expect(xml).toContain('<name>code-review</name>');
      expect(xml).not.toContain('nonexistent');

      const skillBlocks = xml.match(/<skill>/g);
      expect(skillBlocks).toHaveLength(1);
    });
  });

  // ─── maxDiscoveredSkills Cap ───────────────────────────────────────────

  describe('maxDiscoveredSkills Cap', () => {
    it('should limit skills to maxDiscoveredSkills', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'skill-a', { name: 'skill-a', description: 'Skill A' });
      createSkillFixture(root, 'skill-b', { name: 'skill-b', description: 'Skill B' });
      createSkillFixture(root, 'skill-c', { name: 'skill-c', description: 'Skill C' });

      const registry = new SkillRegistry({
        skillRoots: [root],
        enabled: true,
        maxDiscoveredSkills: 2,
      });
      const xml = registry.generatePrompt();

      const skillBlocks = xml.match(/<skill>/g);
      expect(skillBlocks).toHaveLength(2);
    });

    it('should return empty string when maxDiscoveredSkills is 0', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'skill-a', { name: 'skill-a', description: 'Skill A' });

      const registry = new SkillRegistry({
        skillRoots: [root],
        enabled: true,
        maxDiscoveredSkills: 0,
      });
      const xml = registry.generatePrompt();

      expect(xml).toBe('');
    });

    it('should return all skills when maxDiscoveredSkills exceeds count', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'skill-a', { name: 'skill-a', description: 'Skill A' });
      createSkillFixture(root, 'skill-b', { name: 'skill-b', description: 'Skill B' });

      const registry = new SkillRegistry({
        skillRoots: [root],
        enabled: true,
        maxDiscoveredSkills: 100,
      });
      const xml = registry.generatePrompt();

      const skillBlocks = xml.match(/<skill>/g);
      expect(skillBlocks).toHaveLength(2);
    });

    it('should apply maxDiscoveredSkills after subset filter', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'skill-a', { name: 'skill-a', description: 'Skill A' });
      createSkillFixture(root, 'skill-b', { name: 'skill-b', description: 'Skill B' });
      createSkillFixture(root, 'skill-c', { name: 'skill-c', description: 'Skill C' });

      const registry = new SkillRegistry({
        skillRoots: [root],
        enabled: true,
        maxDiscoveredSkills: 1,
      });

      // Request 2 skills but cap at 1
      const xml = registry.generatePrompt({ skills: ['skill-a', 'skill-b'] });

      const skillBlocks = xml.match(/<skill>/g);
      expect(skillBlocks).toHaveLength(1);
    });

    it('should not apply cap when maxDiscoveredSkills is undefined', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'skill-a', { name: 'skill-a', description: 'Skill A' });
      createSkillFixture(root, 'skill-b', { name: 'skill-b', description: 'Skill B' });
      createSkillFixture(root, 'skill-c', { name: 'skill-c', description: 'Skill C' });

      const registry = new SkillRegistry({
        skillRoots: [root],
        enabled: true,
        // maxDiscoveredSkills not set
      });
      const xml = registry.generatePrompt();

      const skillBlocks = xml.match(/<skill>/g);
      expect(skillBlocks).toHaveLength(3);
    });
  });

  // ─── Prompt Composition ────────────────────────────────────────────────

  describe('Prompt Composition', () => {
    it('should compose naturally with other prompt sections', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'code-review', { name: 'code-review', description: 'Review code' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });

      // Simulate composing with tool prompt
      const toolPrompt = 'Available Tools:\n\n- my-tool: Does things';
      const skillPrompt = registry.generatePrompt();

      const systemPrompt = [toolPrompt, skillPrompt].filter(Boolean).join('\n\n');

      expect(systemPrompt).toContain('Available Tools:');
      expect(systemPrompt).toContain('<available_skills>');
      expect(systemPrompt).toContain('code-review');
    });

    it('should not add extra content when disabled (composable as empty)', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'code-review', { name: 'code-review', description: 'Review code' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: false });

      const toolPrompt = 'Available Tools:\n\n- my-tool: Does things';
      const skillPrompt = registry.generatePrompt();

      const systemPrompt = [toolPrompt, skillPrompt].filter(Boolean).join('\n\n');

      // Should only contain tool prompt, no skills XML
      expect(systemPrompt).toBe(toolPrompt);
      expect(systemPrompt).not.toContain('<available_skills>');
    });
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('should handle undefined options gracefully', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'my-skill', { name: 'my-skill', description: 'A skill' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      const xml = registry.generatePrompt(undefined);

      expect(xml).toContain('<name>my-skill</name>');
    });

    it('should handle empty registry with enabled flag', () => {
      const root = makeTempDir();
      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });

      expect(registry.generatePrompt()).toBe('');
      expect(registry.generatePrompt({ skills: ['anything'] })).toBe('');
    });

    it('should reflect registry changes after re-scan', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'skill-a', { name: 'skill-a', description: 'Skill A' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      expect(registry.generatePrompt()).toContain('<name>skill-a</name>');

      // Add another skill and re-scan
      createSkillFixture(root, 'skill-b', { name: 'skill-b', description: 'Skill B' });
      registry.discover();

      const xml = registry.generatePrompt();
      expect(xml).toContain('<name>skill-a</name>');
      expect(xml).toContain('<name>skill-b</name>');
    });

    it('should produce consistent XML across multiple calls', () => {
      const root = makeTempDir();
      createSkillFixture(root, 'my-skill', { name: 'my-skill', description: 'A skill' });

      const registry = new SkillRegistry({ skillRoots: [root], enabled: true });
      const xml1 = registry.generatePrompt();
      const xml2 = registry.generatePrompt();

      expect(xml1).toBe(xml2);
    });
  });
});
