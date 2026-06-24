import { join } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolCategory } from '@agentforge/core';
import { SkillRegistry } from '../../src/registry.js';
import { createActivateSkillTool } from '../../src/activation.js';
import { SkillRegistryEvent } from '../../src/types.js';
import { cleanupTempDirs, createSkillFixture, createTempDir } from './shared.js';

describe('activate-skill tool', () => {
  let tempDir: string;
  let tempDirs: string[];

  beforeEach(() => {
    tempDir = createTempDir();
    tempDirs = [tempDir];
  });

  afterEach(() => {
    cleanupTempDirs(tempDirs);
  });

  it('has the expected metadata', () => {
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createActivateSkillTool(registry);

    expect(tool.metadata.name).toBe('activate-skill');
    expect(tool.metadata.category).toBe(ToolCategory.SKILLS);
    expect(tool.metadata.tags).toContain('skill');
    expect(tool.metadata.tags).toContain('activation');
    expect(tool.metadata.description).toContain('Activate an Agent Skill');
  });

  it('returns the skill body and strips frontmatter', async () => {
    createSkillFixture(
      tempDir,
      'code-review',
      'name: code-review\ndescription: Code review skill',
      '\n# Code Review\n\nReview code for quality.',
    );
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test skill', '\nBody content only');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createActivateSkillTool(registry);

    expect(await tool.invoke({ name: 'code-review' })).toContain('# Code Review');
    expect(await tool.invoke({ name: 'my-skill' })).toBe('Body content only');
  });

  it('returns helpful not-found messages', async () => {
    createSkillFixture(tempDir, 'code-review', 'name: code-review\ndescription: CR', '\nbody');

    const populatedRegistry = new SkillRegistry({ skillRoots: [tempDir] });
    const populatedTool = createActivateSkillTool(populatedRegistry);
    const populatedResult = await populatedTool.invoke({ name: 'non-existent' });
    expect(populatedResult).toContain('Skill "non-existent" not found');
    expect(populatedResult).toContain('code-review');

    const emptyRoot = createTempDir();
    tempDirs.push(emptyRoot);
    const emptyRegistry = new SkillRegistry({ skillRoots: [emptyRoot] });
    const emptyTool = createActivateSkillTool(emptyRegistry);
    const emptyResult = await emptyTool.invoke({ name: 'anything' });
    expect(emptyResult).toContain('No skills are currently registered');
  });

  it('emits activation events and read errors correctly', async () => {
    const brokenDir = createSkillFixture(tempDir, 'broken-skill', 'name: broken-skill\ndescription: Broken', '\nbody');
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createActivateSkillTool(registry);

    const handler = vi.fn();
    registry.on(SkillRegistryEvent.SKILL_ACTIVATED, handler);
    await tool.invoke({ name: 'my-skill' });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'my-skill',
        bodyLength: expect.any(Number),
      }),
    );

    rmSync(join(brokenDir, 'SKILL.md'));
    const readError = await tool.invoke({ name: 'broken-skill' });
    expect(readError).toContain('Failed to read skill');
  });

  it('handles empty bodies and ignores invalid skill files', async () => {
    const emptyDir = join(tempDir, 'empty-body');
    mkdirSync(emptyDir, { recursive: true });
    writeFileSync(join(emptyDir, 'SKILL.md'), '---\nname: empty-body\ndescription: Empty\n---', 'utf-8');

    const noFrontmatterDir = join(tempDir, 'no-frontmatter');
    mkdirSync(noFrontmatterDir, { recursive: true });
    writeFileSync(join(noFrontmatterDir, 'SKILL.md'), '# Just content\n\nNo frontmatter here.', 'utf-8');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createActivateSkillTool(registry);

    expect(await tool.invoke({ name: 'empty-body' })).toBe('');
    expect(registry.has('no-frontmatter')).toBe(false);
  });
});
