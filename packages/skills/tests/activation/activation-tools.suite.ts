import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolCategory } from '@agentforge/core';
import { SkillRegistry } from '../../src/registry.js';
import { createSkillActivationTools } from '../../src/activation.js';
import { SkillRegistryEvent } from '../../src/types.js';
import {
  cleanupTempDirs,
  createResourceFile,
  createSkillFixture,
  createTempDir,
} from './shared.js';

describe('createSkillActivationTools', () => {
  let tempDir: string;
  let tempDirs: string[];

  beforeEach(() => {
    tempDir = createTempDir();
    tempDirs = [tempDir];
  });

  afterEach(() => {
    cleanupTempDirs(tempDirs);
  });

  it('returns the two skill tools in the SKILLS category', () => {
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tools = createSkillActivationTools(registry);

    expect(tools).toHaveLength(2);
    expect(tools[0].metadata.name).toBe('activate-skill');
    expect(tools[1].metadata.name).toBe('read-skill-resource');
    expect(tools[0].metadata.category).toBe(ToolCategory.SKILLS);
    expect(tools[1].metadata.category).toBe(ToolCategory.SKILLS);
  });
});

describe('SkillRegistry.toActivationTools()', () => {
  let tempDir: string;
  let tempDirs: string[];

  beforeEach(() => {
    tempDir = createTempDir();
    tempDirs = [tempDir];
  });

  afterEach(() => {
    cleanupTempDirs(tempDirs);
  });

  it('returns activation tools bound to the registry', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: A test skill', '\n# Test Skill\n\nInstructions here.');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const [activateTool, readResourceTool] = registry.toActivationTools();

    expect(activateTool.metadata.name).toBe('activate-skill');
    expect(readResourceTool.metadata.name).toBe('read-skill-resource');
    expect(await activateTool.invoke({ name: 'my-skill' })).toContain('# Test Skill');
  });
});

describe('Skill activation integration', () => {
  let tempDir: string;
  let tempDirs: string[];

  beforeEach(() => {
    tempDir = createTempDir();
    tempDirs = [tempDir];
  });

  afterEach(() => {
    cleanupTempDirs(tempDirs);
  });

  it('activates a skill and then reads its resources', async () => {
    const skillDir = createSkillFixture(
      tempDir,
      'code-review',
      'name: code-review\ndescription: Code review best practices',
      '\n# Code Review Skill\n\nFollow the guidelines in references/checklist.md',
    );
    createResourceFile(skillDir, 'references/checklist.md', '# Checklist\n\n- [ ] Check naming\n- [ ] Check tests');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const [activateTool, readResourceTool] = registry.toActivationTools();

    const skillBody = await activateTool.invoke({ name: 'code-review' });
    expect(skillBody).toContain('# Code Review Skill');
    expect(skillBody).toContain('references/checklist.md');

    const resource = await readResourceTool.invoke({ name: 'code-review', path: 'references/checklist.md' });
    expect(resource).toContain('# Checklist');
    expect(resource).toContain('Check naming');
  });

  it('works with multiple skills across multiple roots', async () => {
    const root2 = createTempDir();
    tempDirs.push(root2);

    createSkillFixture(tempDir, 'skill-a', 'name: skill-a\ndescription: Skill A', '\n# Skill A body');
    const skillBDir = createSkillFixture(root2, 'skill-b', 'name: skill-b\ndescription: Skill B', '\n# Skill B body');
    createResourceFile(skillBDir, 'scripts/run.sh', '#!/bin/bash\necho "running"');

    const registry = new SkillRegistry({
      skillRoots: [
        { path: tempDir, trust: 'workspace' },
        { path: root2, trust: 'trusted' },
      ],
    });
    const [activateTool, readResourceTool] = registry.toActivationTools();

    expect(await activateTool.invoke({ name: 'skill-a' })).toContain('# Skill A body');
    expect(await activateTool.invoke({ name: 'skill-b' })).toContain('# Skill B body');
    expect(await readResourceTool.invoke({ name: 'skill-b', path: 'scripts/run.sh' })).toContain('echo "running"');
  });

  it('emits activation and resource events in a full workflow', async () => {
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

  it('works alongside generatePrompt and tool spreading', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test skill for compose', '\n# Skill Body');

    const registry = new SkillRegistry({ skillRoots: [tempDir], enabled: true });
    const [activateTool] = registry.toActivationTools();

    const prompt = registry.generatePrompt();
    expect(prompt).toContain('my-skill');
    expect(prompt).toContain('Test skill for compose');
    expect(await activateTool.invoke({ name: 'my-skill' })).toContain('# Skill Body');

    const allTools = [...registry.toActivationTools()];
    expect(allTools).toHaveLength(2);
    expect(allTools[0].metadata.name).toBe('activate-skill');
    expect(allTools[1].metadata.name).toBe('read-skill-resource');
  });
});
