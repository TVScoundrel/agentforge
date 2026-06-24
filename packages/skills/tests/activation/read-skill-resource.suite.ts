import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolCategory } from '@agentforge/core';
import { SkillRegistry } from '../../src/registry.js';
import { createReadSkillResourceTool } from '../../src/activation.js';
import { SkillRegistryEvent } from '../../src/types.js';
import {
  cleanupTempDirs,
  createResourceFile,
  createSkillFixture,
  createTempDir,
} from './shared.js';

describe('read-skill-resource tool', () => {
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
    const tool = createReadSkillResourceTool(registry);

    expect(tool.metadata.name).toBe('read-skill-resource');
    expect(tool.metadata.category).toBe(ToolCategory.SKILLS);
    expect(tool.metadata.tags).toContain('resource');
    expect(tool.metadata.description).toContain('resource file');
  });

  it('reads resources from safe locations', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'references/guide.md', '# Reference Guide\n\nSome content.');
    createResourceFile(skillDir, 'assets/config.json', '{"key": "value"}');
    createResourceFile(skillDir, 'references/api/endpoints.md', '# Endpoints');

    const trustedRoot = createTempDir();
    tempDirs.push(trustedRoot);
    const trustedSkillDir = createSkillFixture(trustedRoot, 'trusted-skill', 'name: trusted-skill\ndescription: Test', '\nbody');
    createResourceFile(trustedSkillDir, 'scripts/setup.sh', '#!/bin/bash\necho "Hello"');

    const regularRegistry = new SkillRegistry({ skillRoots: [tempDir] });
    const regularTool = createReadSkillResourceTool(regularRegistry);

    expect(await regularTool.invoke({ name: 'my-skill', path: 'references/guide.md' })).toBe('# Reference Guide\n\nSome content.');
    expect(await regularTool.invoke({ name: 'my-skill', path: 'assets/config.json' })).toBe('{"key": "value"}');
    expect(await regularTool.invoke({ name: 'my-skill', path: 'references/api/endpoints.md' })).toBe('# Endpoints');

    const trustedRegistry = new SkillRegistry({ skillRoots: [{ path: trustedRoot, trust: 'trusted' }] });
    const trustedTool = createReadSkillResourceTool(trustedRegistry);
    expect(await trustedTool.invoke({ name: 'trusted-skill', path: 'scripts/setup.sh' })).toBe('#!/bin/bash\necho "Hello"');
  });

  it('blocks invalid paths and missing skills/resources', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    expect(await tool.invoke({ name: 'my-skill', path: '../SKILL.md' })).toContain('Path traversal');
    expect(await tool.invoke({ name: 'my-skill', path: 'references/../../../etc/passwd' })).toContain('Path traversal');
    expect(await tool.invoke({ name: 'my-skill', path: '/etc/passwd' })).toContain('Absolute resource paths');
    expect(await tool.invoke({ name: 'ghost', path: 'file.txt' })).toContain('Skill "ghost" not found');

    const missingResource = await tool.invoke({ name: 'my-skill', path: 'references/nonexistent.md' });
    expect(missingResource).toContain('Failed to read resource');
    expect(missingResource).toContain('nonexistent.md');
  });

  it('emits resource events on success and not on failure', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'references/guide.md', 'Guide content');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const handler = vi.fn();
    registry.on(SkillRegistryEvent.SKILL_RESOURCE_LOADED, handler);

    await tool.invoke({ name: 'my-skill', path: 'references/guide.md' });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'my-skill',
        resourcePath: 'references/guide.md',
        contentLength: expect.any(Number),
      }),
    );

    handler.mockClear();
    await tool.invoke({ name: 'my-skill', path: '../etc/passwd' });
    expect(handler).not.toHaveBeenCalled();
  });
});
