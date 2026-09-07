import { mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentSkillAccess } from '../src/agent-skill-access.js';
import { activationLogger } from '../src/activation-shared.js';
import { SkillRegistry } from '../src/registry.js';
import { SkillRegistryEvent, TrustPolicyReason } from '../src/types.js';
import {
  cleanupTempDirs,
  createResourceFile,
  createSkillFixture,
  createTempDir,
} from './activation/shared.js';

describe('AgentSkillAccess', () => {
  let tempDir: string;
  let tempDirs: string[];

  beforeEach(() => {
    tempDir = createTempDir();
    tempDirs = [tempDir];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanupTempDirs(tempDirs);
  });

  it('activates a trusted Agent Skill and publishes the existing registry event', async () => {
    createSkillFixture(
      tempDir,
      'code-review',
      'name: code-review\ndescription: Code review skill',
      '\n# Code Review\n\nReview code for quality.'
    );
    const registry = new SkillRegistry({
      skillRoots: [{ path: tempDir, trust: 'workspace' }],
    });
    const activated = vi.fn();
    const info = vi.spyOn(activationLogger, 'info');
    registry.on(SkillRegistryEvent.SKILL_ACTIVATED, activated);

    const result = await new AgentSkillAccess(registry).activate('code-review');

    expect(result).toEqual({
      kind: 'success',
      body: '# Code Review\n\nReview code for quality.',
    });
    expect(activated).toHaveBeenCalledWith({
      name: 'code-review',
      skillPath: expect.any(String),
      bodyLength: 39,
      trustLevel: 'workspace',
    });
    expect(info).toHaveBeenCalledWith(
      'Skill activated',
      expect.objectContaining({
        name: 'code-review',
        bodyLength: 39,
        trustLevel: 'workspace',
        activationReason: TrustPolicyReason.WORKSPACE_SKILL_ACTIVATION,
      })
    );
  });

  it('reads an ordinary Agent Skill resource and publishes the existing registry event', async () => {
    const skillDir = createSkillFixture(
      tempDir,
      'code-review',
      'name: code-review\ndescription: Code review skill',
      '\nInstructions'
    );
    createResourceFile(skillDir, 'references/style-guide.md', '# Style Guide');
    const registry = new SkillRegistry({
      skillRoots: [{ path: tempDir, trust: 'untrusted' }],
    });
    const loaded = vi.fn();
    const info = vi.spyOn(activationLogger, 'info');
    registry.on(SkillRegistryEvent.SKILL_RESOURCE_LOADED, loaded);

    const result = await new AgentSkillAccess(registry).readResource(
      'code-review',
      'references/style-guide.md'
    );

    expect(result).toEqual({ kind: 'success', content: '# Style Guide' });
    expect(loaded).toHaveBeenCalledWith({
      name: 'code-review',
      resourcePath: 'references/style-guide.md',
      resolvedPath: join(skillDir, 'references/style-guide.md'),
      contentLength: 13,
    });
    expect(info).toHaveBeenCalledWith('Skill resource loaded', {
      name: 'code-review',
      resourcePath: 'references/style-guide.md',
      resolvedPath: join(skillDir, 'references/style-guide.md'),
      contentLength: 13,
    });
  });

  it('normalizes a missing Agent Skill resource owner without throwing', async () => {
    createSkillFixture(
      tempDir,
      'available-skill',
      'name: available-skill\ndescription: Available skill',
      '\nInstructions'
    );
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const warn = vi.spyOn(activationLogger, 'warn');

    const result = await new AgentSkillAccess(registry).readResource(
      'missing-skill',
      'references/guide.md'
    );

    expect(result).toEqual({
      kind: 'skill-not-found',
      name: 'missing-skill',
      availableNames: ['available-skill'],
    });
    expect(warn).toHaveBeenCalledWith('Skill resource load failed — skill not found', {
      name: 'missing-skill',
      resourcePath: 'references/guide.md',
    });
  });

  it('normalizes resource paths that escape the Agent Skill root as denied access', async () => {
    createSkillFixture(
      tempDir,
      'code-review',
      'name: code-review\ndescription: Code review skill',
      '\nInstructions'
    );
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const warn = vi.spyOn(activationLogger, 'warn');

    const result = await new AgentSkillAccess(registry).readResource('code-review', '../SKILL.md');

    expect(result).toEqual({
      kind: 'access-denied',
      message:
        'Path traversal is not allowed — resource paths must stay within the skill directory',
    });
    expect(warn).toHaveBeenCalledWith('Skill resource load blocked — path traversal', {
      name: 'code-review',
      resourcePath: '../SKILL.md',
      error: 'Path traversal is not allowed — resource paths must stay within the skill directory',
    });
  });

  it('denies a resource symlink that escapes the Agent Skill root', async () => {
    const skillDir = createSkillFixture(
      tempDir,
      'code-review',
      'name: code-review\ndescription: Code review skill',
      '\nInstructions'
    );
    const outsideDir = createTempDir();
    tempDirs.push(outsideDir);
    const outsideResource = createResourceFile(outsideDir, 'secret.md', 'secret');
    mkdirSync(join(skillDir, 'references'), { recursive: true });
    symlinkSync(outsideResource, join(skillDir, 'references', 'guide.md'));
    const registry = new SkillRegistry({ skillRoots: [tempDir] });

    const result = await new AgentSkillAccess(registry).readResource(
      'code-review',
      'references/guide.md'
    );

    expect(result).toEqual({
      kind: 'access-denied',
      message: 'Symlink target escapes the skill directory — access denied',
    });
  });

  it('denies executable resources at the Skill trust policy seam and publishes the existing event', async () => {
    const skillDir = createSkillFixture(
      tempDir,
      'community-skill',
      'name: community-skill\ndescription: Community skill',
      '\nInstructions'
    );
    createResourceFile(skillDir, 'scripts/install.sh', '#!/bin/sh');
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const denied = vi.fn();
    const warn = vi.spyOn(activationLogger, 'warn');
    registry.on(SkillRegistryEvent.TRUST_POLICY_DENIED, denied);

    const result = await new AgentSkillAccess(registry).readResource(
      'community-skill',
      'scripts/install.sh'
    );

    expect(result).toEqual({
      kind: 'access-denied',
      reason: TrustPolicyReason.UNTRUSTED_SCRIPT_DENIED,
      message: expect.stringContaining('Script access denied'),
    });
    expect(denied).toHaveBeenCalledWith({
      name: 'community-skill',
      resourcePath: 'scripts/install.sh',
      trustLevel: 'untrusted',
      reason: TrustPolicyReason.UNTRUSTED_SCRIPT_DENIED,
      message: expect.stringContaining('Script access denied'),
    });
    expect(warn).toHaveBeenCalledWith(
      'Skill resource load blocked — trust policy',
      expect.objectContaining({
        name: 'community-skill',
        resourcePath: 'scripts/install.sh',
        reason: TrustPolicyReason.UNTRUSTED_SCRIPT_DENIED,
      })
    );
  });

  it('applies Skill activation policy when resource access targets the instructions', async () => {
    const skillDir = createSkillFixture(
      tempDir,
      'community-skill',
      'name: community-skill\ndescription: Community skill',
      '\nSecret instructions'
    );
    symlinkSync(join(skillDir, 'SKILL.md'), join(skillDir, 'instructions.md'));
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const denied = vi.fn();
    registry.on(SkillRegistryEvent.TRUST_POLICY_DENIED, denied);

    const result = await new AgentSkillAccess(registry).readResource(
      'community-skill',
      'instructions.md'
    );

    expect(result).toEqual({
      kind: 'access-denied',
      reason: TrustPolicyReason.UNTRUSTED_SKILL_ACTIVATION_DENIED,
      message: expect.stringContaining('Skill activation blocked'),
    });
    expect(denied).toHaveBeenCalledWith({
      name: 'community-skill',
      resourcePath: 'SKILL.md',
      trustLevel: 'untrusted',
      reason: TrustPolicyReason.UNTRUSTED_SKILL_ACTIVATION_DENIED,
      message: expect.stringContaining('Skill activation blocked'),
    });
  });

  it('publishes the existing allow event for executable resources from trusted roots', async () => {
    const skillDir = createSkillFixture(
      tempDir,
      'trusted-skill',
      'name: trusted-skill\ndescription: Trusted skill',
      '\nInstructions'
    );
    createResourceFile(skillDir, 'scripts/install.sh', '#!/bin/sh');
    const registry = new SkillRegistry({
      skillRoots: [{ path: tempDir, trust: 'trusted' }],
    });
    const allowed = vi.fn();
    const info = vi.spyOn(activationLogger, 'info');
    registry.on(SkillRegistryEvent.TRUST_POLICY_ALLOWED, allowed);

    const result = await new AgentSkillAccess(registry).readResource(
      'trusted-skill',
      'scripts/install.sh'
    );

    expect(result).toEqual({ kind: 'success', content: '#!/bin/sh' });
    expect(allowed).toHaveBeenCalledWith({
      name: 'trusted-skill',
      resourcePath: 'scripts/install.sh',
      trustLevel: 'trusted',
      reason: TrustPolicyReason.TRUSTED_ROOT,
    });
    expect(info).toHaveBeenCalledWith('Skill resource trust policy — allowed', {
      name: 'trusted-skill',
      resourcePath: 'scripts/install.sh',
      trustLevel: 'trusted',
      reason: TrustPolicyReason.TRUSTED_ROOT,
    });
  });

  it('distinguishes a missing resource from other read failures', async () => {
    createSkillFixture(
      tempDir,
      'code-review',
      'name: code-review\ndescription: Code review skill',
      '\nInstructions'
    );
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const warn = vi.spyOn(activationLogger, 'warn');

    const result = await new AgentSkillAccess(registry).readResource(
      'code-review',
      'references/missing.md'
    );

    expect(result).toEqual({
      kind: 'resource-not-found',
      name: 'code-review',
      resourcePath: 'references/missing.md',
      error: expect.stringContaining('ENOENT'),
    });
    expect(warn).toHaveBeenCalledWith('Skill resource load failed — file not found or unreadable', {
      name: 'code-review',
      resourcePath: 'references/missing.md',
      error: expect.stringContaining('ENOENT'),
    });
  });

  it('normalizes a non-missing resource read failure without throwing', async () => {
    const skillDir = createSkillFixture(
      tempDir,
      'code-review',
      'name: code-review\ndescription: Code review skill',
      '\nInstructions'
    );
    mkdirSync(join(skillDir, 'references', 'directory.md'), { recursive: true });
    const registry = new SkillRegistry({ skillRoots: [tempDir] });

    const result = await new AgentSkillAccess(registry).readResource(
      'code-review',
      'references/directory.md'
    );

    expect(result).toEqual({
      kind: 'read-failure',
      name: 'code-review',
      resourcePath: 'references/directory.md',
      error: expect.any(String),
    });
  });

  it('denies activation at the Skill trust policy seam and publishes the existing registry event', async () => {
    createSkillFixture(
      tempDir,
      'community-skill',
      'name: community-skill\ndescription: Community skill',
      '\nUntrusted instructions'
    );
    const registry = new SkillRegistry({
      skillRoots: [{ path: tempDir, trust: 'untrusted' }],
    });
    const denied = vi.fn();
    const warn = vi.spyOn(activationLogger, 'warn');
    registry.on(SkillRegistryEvent.TRUST_POLICY_DENIED, denied);

    const result = await new AgentSkillAccess(registry).activate('community-skill');

    expect(result).toEqual({
      kind: 'access-denied',
      reason: TrustPolicyReason.UNTRUSTED_SKILL_ACTIVATION_DENIED,
      message: expect.stringContaining('Skill activation blocked'),
    });
    expect(denied).toHaveBeenCalledWith({
      name: 'community-skill',
      resourcePath: 'SKILL.md',
      trustLevel: 'untrusted',
      reason: TrustPolicyReason.UNTRUSTED_SKILL_ACTIVATION_DENIED,
      message: expect.stringContaining('Skill activation blocked'),
    });
    expect(warn).toHaveBeenCalledWith(
      'Skill activation blocked — trust policy',
      expect.objectContaining({
        name: 'community-skill',
        trustLevel: 'untrusted',
        reason: TrustPolicyReason.UNTRUSTED_SKILL_ACTIVATION_DENIED,
      })
    );
  });

  it('normalizes a missing Agent Skill without throwing', async () => {
    createSkillFixture(
      tempDir,
      'available-skill',
      'name: available-skill\ndescription: Available skill',
      '\nAvailable instructions'
    );
    const registry = new SkillRegistry({
      skillRoots: [{ path: tempDir, trust: 'workspace' }],
    });
    const warn = vi.spyOn(activationLogger, 'warn');

    const result = await new AgentSkillAccess(registry).activate('missing-skill');

    expect(result).toEqual({
      kind: 'skill-not-found',
      name: 'missing-skill',
      availableNames: ['available-skill'],
    });
    expect(warn).toHaveBeenCalledWith('Skill activation failed — not found', {
      name: 'missing-skill',
      availableCount: 1,
    });
  });

  it('normalizes an instruction read failure without throwing', async () => {
    const skillDir = createSkillFixture(
      tempDir,
      'broken-skill',
      'name: broken-skill\ndescription: Broken skill',
      '\nInstructions'
    );
    const registry = new SkillRegistry({
      skillRoots: [{ path: tempDir, trust: 'workspace' }],
    });
    const error = vi.spyOn(activationLogger, 'error');
    rmSync(join(skillDir, 'SKILL.md'));

    const result = await new AgentSkillAccess(registry).activate('broken-skill');

    expect(result).toEqual({
      kind: 'read-failure',
      name: 'broken-skill',
      error: expect.any(String),
    });
    expect(error).toHaveBeenCalledWith(
      'Skill activation failed — read error',
      expect.objectContaining({
        name: 'broken-skill',
        skillPath: skillDir,
        error: expect.any(String),
      })
    );
  });
});
