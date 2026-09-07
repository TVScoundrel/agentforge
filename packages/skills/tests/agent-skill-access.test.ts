import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentSkillAccess } from '../src/agent-skill-access.js';
import { activationLogger } from '../src/activation-shared.js';
import { SkillRegistry } from '../src/registry.js';
import { SkillRegistryEvent, TrustPolicyReason } from '../src/types.js';
import { cleanupTempDirs, createSkillFixture, createTempDir } from './activation/shared.js';

describe('AgentSkillAccess', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanupTempDirs([tempDir]);
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
