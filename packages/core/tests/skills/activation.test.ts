/**
 * Tests for Skill Activation Tools
 *
 * Covers:
 * - activate-skill tool: resolves via SkillRegistry, returns SKILL.md body
 * - read-skill-resource tool: resolves resource files with path traversal protection
 * - toActivationTools() convenience method
 * - resolveResourcePath security function
 * - Event emission (skill:activated, skill:resource-loaded)
 * - Error handling for missing skills and resources
 * - Integration with SkillRegistry lifecycle
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SkillRegistry } from '../../src/skills/registry.js';
import { SkillRegistryEvent } from '../../src/skills/types.js';
import {
  createActivateSkillTool,
  createReadSkillResourceTool,
  createSkillActivationTools,
  resolveResourcePath,
} from '../../src/skills/activation.js';
import { ToolCategory } from '../../src/tools/types.js';

// ─── Fixture Helpers ─────────────────────────────────────────────────────

function createTempDir(): string {
  const dir = join(tmpdir(), `skill-activation-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function createSkillFixture(
  root: string,
  dirName: string,
  frontmatter: string,
  body: string,
): string {
  const skillDir = join(root, dirName);
  mkdirSync(skillDir, { recursive: true });
  const content = `---\n${frontmatter}\n---\n${body}`;
  writeFileSync(join(skillDir, 'SKILL.md'), content, 'utf-8');
  return skillDir;
}

function createResourceFile(skillDir: string, relativePath: string, content: string): string {
  const fullPath = join(skillDir, relativePath);
  const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
  mkdirSync(dir, { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

// ─── Tests ───────────────────────────────────────────────────────────────

describe('resolveResourcePath', () => {
  it('should resolve a valid relative path within the skill root', () => {
    const result = resolveResourcePath('/skills/my-skill', 'references/guide.md');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.resolvedPath).toBe(join('/skills/my-skill', 'references/guide.md'));
    }
  });

  it('should block absolute paths', () => {
    const result = resolveResourcePath('/skills/my-skill', '/etc/passwd');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Absolute resource paths');
    }
  });

  it('should block backslash absolute paths', () => {
    const result = resolveResourcePath('/skills/my-skill', '\\etc\\passwd');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Absolute resource paths');
    }
  });

  it('should block simple .. traversal', () => {
    const result = resolveResourcePath('/skills/my-skill', '../secrets/key');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Path traversal');
    }
  });

  it('should block nested .. traversal', () => {
    const result = resolveResourcePath('/skills/my-skill', 'references/../../secrets/key');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Path traversal');
    }
  });

  it('should allow simple filename', () => {
    const result = resolveResourcePath('/skills/my-skill', 'README.md');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.resolvedPath).toBe(join('/skills/my-skill', 'README.md'));
    }
  });

  it('should allow nested subdirectory paths', () => {
    const result = resolveResourcePath('/skills/my-skill', 'scripts/setup/install.sh');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.resolvedPath).toBe(join('/skills/my-skill', 'scripts/setup/install.sh'));
    }
  });

  it('should allow assets/ directory', () => {
    const result = resolveResourcePath('/skills/my-skill', 'assets/logo.png');
    expect(result.success).toBe(true);
  });
});

describe('activate-skill tool', () => {
  let tempDir: string;
  let tempDirs: string[];

  beforeEach(() => {
    tempDir = createTempDir();
    tempDirs = [tempDir];
  });

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should have correct tool metadata', () => {
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createActivateSkillTool(registry);

    expect(tool.metadata.name).toBe('activate-skill');
    expect(tool.metadata.category).toBe(ToolCategory.SKILLS);
    expect(tool.metadata.tags).toContain('skill');
    expect(tool.metadata.tags).toContain('activation');
    expect(tool.metadata.description).toContain('Activate an Agent Skill');
  });

  it('should return skill body when skill exists', async () => {
    createSkillFixture(tempDir, 'code-review', 'name: code-review\ndescription: Code review skill', '\n# Code Review\n\nReview code for quality.');
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createActivateSkillTool(registry);

    const result = await tool.invoke({ name: 'code-review' });

    expect(result).toContain('# Code Review');
    expect(result).toContain('Review code for quality.');
  });

  it('should strip frontmatter from returned body', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test skill', '\nBody content only');
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createActivateSkillTool(registry);

    const result = await tool.invoke({ name: 'my-skill' });

    expect(result).not.toContain('name: my-skill');
    expect(result).toBe('Body content only');
  });

  it('should return error message for non-existent skill', async () => {
    createSkillFixture(tempDir, 'code-review', 'name: code-review\ndescription: CR', '\nbody');
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createActivateSkillTool(registry);

    const result = await tool.invoke({ name: 'non-existent' });

    expect(result).toContain('Skill "non-existent" not found');
    expect(result).toContain('code-review');
  });

  it('should return error message when no skills are registered', async () => {
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createActivateSkillTool(registry);

    const result = await tool.invoke({ name: 'anything' });

    expect(result).toContain('not found');
    expect(result).toContain('No skills are currently registered');
  });

  it('should emit skill:activated event', async () => {
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
  });

  it('should handle skill with no SKILL.md gracefully', async () => {
    // Create a registry with a skill, then delete the SKILL.md
    const skillDir = createSkillFixture(tempDir, 'broken-skill', 'name: broken-skill\ndescription: Broken', '\nbody');
    const registry = new SkillRegistry({ skillRoots: [tempDir] });

    // Remove SKILL.md after discovery
    rmSync(join(skillDir, 'SKILL.md'));

    const tool = createActivateSkillTool(registry);
    const result = await tool.invoke({ name: 'broken-skill' });

    expect(result).toContain('Failed to read skill');
  });

  it('should handle skill with only frontmatter (empty body)', async () => {
    const skillDir = join(tempDir, 'empty-body');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'SKILL.md'), '---\nname: empty-body\ndescription: Empty\n---', 'utf-8');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createActivateSkillTool(registry);

    const result = await tool.invoke({ name: 'empty-body' });
    expect(result).toBe('');
  });

  it('should handle skill with no frontmatter', async () => {
    const skillDir = join(tempDir, 'no-frontmatter');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'SKILL.md'), '# Just content\n\nNo frontmatter here.', 'utf-8');

    // This skill will fail parsing (no frontmatter = no name), so it won't be in the registry
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    expect(registry.has('no-frontmatter')).toBe(false);
  });
});

describe('read-skill-resource tool', () => {
  let tempDir: string;
  let tempDirs: string[];

  beforeEach(() => {
    tempDir = createTempDir();
    tempDirs = [tempDir];
  });

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should have correct tool metadata', () => {
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    expect(tool.metadata.name).toBe('read-skill-resource');
    expect(tool.metadata.category).toBe(ToolCategory.SKILLS);
    expect(tool.metadata.tags).toContain('resource');
    expect(tool.metadata.description).toContain('resource file');
  });

  it('should read a resource file from references/', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'references/guide.md', '# Reference Guide\n\nSome content.');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'references/guide.md' });

    expect(result).toBe('# Reference Guide\n\nSome content.');
  });

  it('should read a resource file from scripts/', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'scripts/setup.sh', '#!/bin/bash\necho "Hello"');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'scripts/setup.sh' });

    expect(result).toBe('#!/bin/bash\necho "Hello"');
  });

  it('should read a resource from assets/', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'assets/config.json', '{"key": "value"}');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'assets/config.json' });

    expect(result).toBe('{"key": "value"}');
  });

  it('should read a resource from nested subdirectories', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'references/api/endpoints.md', '# Endpoints');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'references/api/endpoints.md' });

    expect(result).toBe('# Endpoints');
  });

  it('should block path traversal via ../', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: '../SKILL.md' });

    expect(result).toContain('Path traversal');
  });

  it('should block path traversal via nested ../../../', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'references/../../../etc/passwd' });

    expect(result).toContain('Path traversal');
  });

  it('should block absolute paths', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: '/etc/passwd' });

    expect(result).toContain('Absolute resource paths');
  });

  it('should return error for non-existent skill', async () => {
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'ghost', path: 'file.txt' });

    expect(result).toContain('Skill "ghost" not found');
  });

  it('should return error for missing resource file', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'references/nonexistent.md' });

    expect(result).toContain('Failed to read resource');
    expect(result).toContain('nonexistent.md');
  });

  it('should emit skill:resource-loaded event on success', async () => {
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
  });

  it('should not emit event on failure', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const handler = vi.fn();
    registry.on(SkillRegistryEvent.SKILL_RESOURCE_LOADED, handler);

    await tool.invoke({ name: 'my-skill', path: '../etc/passwd' });

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('createSkillActivationTools', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return an array of two tools', () => {
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tools = createSkillActivationTools(registry);

    expect(tools).toHaveLength(2);
    expect(tools[0].metadata.name).toBe('activate-skill');
    expect(tools[1].metadata.name).toBe('read-skill-resource');
  });

  it('should return tools in SKILLS category', () => {
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tools = createSkillActivationTools(registry);

    expect(tools[0].metadata.category).toBe(ToolCategory.SKILLS);
    expect(tools[1].metadata.category).toBe(ToolCategory.SKILLS);
  });
});

describe('SkillRegistry.toActivationTools()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return activation tools bound to the registry', () => {
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tools = registry.toActivationTools();

    expect(tools).toHaveLength(2);
    expect(tools[0].metadata.name).toBe('activate-skill');
    expect(tools[1].metadata.name).toBe('read-skill-resource');
  });

  it('should return tools that work with the registry state', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: A test skill', '\n# Test Skill\n\nInstructions here.');
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const [activateTool] = registry.toActivationTools();

    const result = await activateTool.invoke({ name: 'my-skill' });

    expect(result).toContain('# Test Skill');
    expect(result).toContain('Instructions here.');
  });
});

describe('End-to-end integration', () => {
  let tempDir: string;
  let tempDirs: string[];

  beforeEach(() => {
    tempDir = createTempDir();
    tempDirs = [tempDir];
  });

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should activate a skill and then read its resources', async () => {
    const skillDir = createSkillFixture(
      tempDir,
      'code-review',
      'name: code-review\ndescription: Code review best practices',
      '\n# Code Review Skill\n\nFollow the guidelines in references/checklist.md',
    );
    createResourceFile(skillDir, 'references/checklist.md', '# Checklist\n\n- [ ] Check naming\n- [ ] Check tests');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const [activateTool, readResourceTool] = registry.toActivationTools();

    // Step 1: Activate the skill
    const skillBody = await activateTool.invoke({ name: 'code-review' });
    expect(skillBody).toContain('# Code Review Skill');
    expect(skillBody).toContain('references/checklist.md');

    // Step 2: Read the referenced resource
    const resource = await readResourceTool.invoke({
      name: 'code-review',
      path: 'references/checklist.md',
    });
    expect(resource).toContain('# Checklist');
    expect(resource).toContain('Check naming');
  });

  it('should work with multiple skills from multiple roots', async () => {
    const root2 = createTempDir();
    tempDirs.push(root2);

    createSkillFixture(tempDir, 'skill-a', 'name: skill-a\ndescription: Skill A', '\n# Skill A body');
    const skillBDir = createSkillFixture(root2, 'skill-b', 'name: skill-b\ndescription: Skill B', '\n# Skill B body');
    createResourceFile(skillBDir, 'scripts/run.sh', '#!/bin/bash\necho "running"');

    const registry = new SkillRegistry({ skillRoots: [tempDir, root2] });
    const [activateTool, readResourceTool] = registry.toActivationTools();

    const bodyA = await activateTool.invoke({ name: 'skill-a' });
    expect(bodyA).toContain('# Skill A body');

    const bodyB = await activateTool.invoke({ name: 'skill-b' });
    expect(bodyB).toContain('# Skill B body');

    const script = await readResourceTool.invoke({ name: 'skill-b', path: 'scripts/run.sh' });
    expect(script).toContain('echo "running"');
  });

  it('should emit both event types in a full workflow', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'references/ref.md', 'reference content');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const [activateTool, readResourceTool] = registry.toActivationTools();

    const activatedHandler = vi.fn();
    const resourceHandler = vi.fn();
    registry.on(SkillRegistryEvent.SKILL_ACTIVATED, activatedHandler);
    registry.on(SkillRegistryEvent.SKILL_RESOURCE_LOADED, resourceHandler);

    await activateTool.invoke({ name: 'my-skill' });
    await readResourceTool.invoke({ name: 'my-skill', path: 'references/ref.md' });

    expect(activatedHandler).toHaveBeenCalledOnce();
    expect(resourceHandler).toHaveBeenCalledOnce();
  });

  it('should work alongside SkillRegistry.generatePrompt()', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test skill for compose', '\n# Skill Body');

    const registry = new SkillRegistry({ skillRoots: [tempDir], enabled: true });
    const [activateTool] = registry.toActivationTools();

    // generatePrompt() should list the skill
    const prompt = registry.generatePrompt();
    expect(prompt).toContain('my-skill');
    expect(prompt).toContain('Test skill for compose');

    // activate-skill should return the body
    const body = await activateTool.invoke({ name: 'my-skill' });
    expect(body).toContain('# Skill Body');
  });

  it('tools can be spread into any agent tool array', () => {
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const skillTools = registry.toActivationTools();

    // Simulating adding to an agent's tool array
    const allTools = [...skillTools];
    expect(allTools).toHaveLength(2);
    expect(allTools[0].metadata.name).toBe('activate-skill');
    expect(allTools[1].metadata.name).toBe('read-skill-resource');
  });
});
