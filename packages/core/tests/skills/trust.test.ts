/**
 * Tests for Skill Trust Policies and Execution Guardrails
 *
 * Covers:
 * - Trust policy configuration model (workspace, trusted, untrusted)
 * - normalizeRootConfig() — string and object root normalization
 * - isScriptResource() — script path detection
 * - evaluateTrustPolicy() — policy engine logic for all trust levels
 * - read-skill-resource trust enforcement (scripts blocked from untrusted roots)
 * - allowUntrustedScripts override
 * - Trust policy events (TRUST_POLICY_DENIED, TRUST_POLICY_ALLOWED)
 * - getAllowedTools() API
 * - Security regression: path traversal + untrusted script denial + policy bypass
 * - Backward compatibility: plain string roots default to untrusted
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { SkillRegistry } from '../../src/skills/registry.js';
import { SkillRegistryEvent, TrustPolicyReason } from '../../src/skills/types.js';
import type { TrustLevel } from '../../src/skills/types.js';
import {
  evaluateTrustPolicy,
  isScriptResource,
  normalizeRootConfig,
} from '../../src/skills/trust.js';
import {
  createReadSkillResourceTool,
} from '../../src/skills/activation.js';

// ─── Fixture Helpers ─────────────────────────────────────────────────────

function createTempDir(): string {
  const dir = join(tmpdir(), `skill-trust-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

// ─── normalizeRootConfig ─────────────────────────────────────────────────

describe('normalizeRootConfig', () => {
  it('should convert a plain string to untrusted SkillRootConfig', () => {
    const result = normalizeRootConfig('/some/path');
    expect(result).toEqual({ path: '/some/path', trust: 'untrusted' });
  });

  it('should pass through SkillRootConfig objects unchanged', () => {
    const input = { path: '/some/path', trust: 'trusted' as TrustLevel };
    const result = normalizeRootConfig(input);
    expect(result).toEqual(input);
  });

  it('should normalize workspace trust level', () => {
    const result = normalizeRootConfig({ path: '.agentskills', trust: 'workspace' });
    expect(result.trust).toBe('workspace');
  });
});

// ─── isScriptResource ────────────────────────────────────────────────────

describe('isScriptResource', () => {
  it('should return true for scripts/ prefix', () => {
    expect(isScriptResource('scripts/setup.sh')).toBe(true);
  });

  it('should return true for nested scripts/ paths', () => {
    expect(isScriptResource('scripts/init/bootstrap.sh')).toBe(true);
  });

  it('should return true for exact "scripts" path', () => {
    expect(isScriptResource('scripts')).toBe(true);
  });

  it('should return false for references/ prefix', () => {
    expect(isScriptResource('references/guide.md')).toBe(false);
  });

  it('should return false for assets/ prefix', () => {
    expect(isScriptResource('assets/logo.png')).toBe(false);
  });

  it('should return false for root-level files', () => {
    expect(isScriptResource('README.md')).toBe(false);
  });

  it('should return false for paths containing "scripts" but not as prefix', () => {
    expect(isScriptResource('references/scripts-guide.md')).toBe(false);
  });

  it('should handle backslash separators', () => {
    expect(isScriptResource('scripts\\setup.sh')).toBe(true);
  });
});

// ─── evaluateTrustPolicy ─────────────────────────────────────────────────

describe('evaluateTrustPolicy', () => {
  describe('non-script resources', () => {
    it('should allow references/ from any trust level', () => {
      for (const trust of ['workspace', 'trusted', 'untrusted'] as TrustLevel[]) {
        const decision = evaluateTrustPolicy('references/guide.md', trust);
        expect(decision.allowed).toBe(true);
        expect(decision.reason).toBe(TrustPolicyReason.NOT_SCRIPT);
      }
    });

    it('should allow assets/ from untrusted roots', () => {
      const decision = evaluateTrustPolicy('assets/logo.png', 'untrusted');
      expect(decision.allowed).toBe(true);
      expect(decision.reason).toBe(TrustPolicyReason.NOT_SCRIPT);
    });

    it('should allow root-level files from untrusted roots', () => {
      const decision = evaluateTrustPolicy('README.md', 'untrusted');
      expect(decision.allowed).toBe(true);
    });
  });

  describe('workspace trust', () => {
    it('should allow scripts from workspace roots', () => {
      const decision = evaluateTrustPolicy('scripts/setup.sh', 'workspace');
      expect(decision.allowed).toBe(true);
      expect(decision.reason).toBe(TrustPolicyReason.WORKSPACE_TRUST);
    });

    it('should include descriptive message', () => {
      const decision = evaluateTrustPolicy('scripts/run.sh', 'workspace');
      expect(decision.message).toContain('workspace trust');
    });
  });

  describe('trusted roots', () => {
    it('should allow scripts from trusted roots', () => {
      const decision = evaluateTrustPolicy('scripts/deploy.sh', 'trusted');
      expect(decision.allowed).toBe(true);
      expect(decision.reason).toBe(TrustPolicyReason.TRUSTED_ROOT);
    });
  });

  describe('untrusted roots', () => {
    it('should deny scripts from untrusted roots by default', () => {
      const decision = evaluateTrustPolicy('scripts/setup.sh', 'untrusted');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe(TrustPolicyReason.UNTRUSTED_SCRIPT_DENIED);
    });

    it('should include remediation guidance in denial message', () => {
      const decision = evaluateTrustPolicy('scripts/setup.sh', 'untrusted');
      expect(decision.message).toContain('allowUntrustedScripts');
      expect(decision.message).toContain('trusted');
      expect(decision.message).toContain('workspace');
    });

    it('should allow scripts when allowUntrustedScripts override is true', () => {
      const decision = evaluateTrustPolicy('scripts/setup.sh', 'untrusted', true);
      expect(decision.allowed).toBe(true);
      expect(decision.reason).toBe(TrustPolicyReason.UNTRUSTED_SCRIPT_ALLOWED);
    });

    it('should deny scripts when allowUntrustedScripts is false', () => {
      const decision = evaluateTrustPolicy('scripts/setup.sh', 'untrusted', false);
      expect(decision.allowed).toBe(false);
    });
  });
});

// ─── Trust enforcement integration (read-skill-resource) ─────────────────

describe('read-skill-resource trust enforcement', () => {
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

  it('should allow non-script resources from untrusted roots', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'references/guide.md', '# Guide');

    const registry = new SkillRegistry({ skillRoots: [tempDir] }); // default untrusted
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'references/guide.md' });
    expect(result).toBe('# Guide');
  });

  it('should deny script resources from untrusted roots', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'scripts/setup.sh', '#!/bin/bash\nrm -rf /');

    const registry = new SkillRegistry({ skillRoots: [tempDir] }); // default untrusted
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'scripts/setup.sh' });
    expect(result).toContain('Script access denied');
    expect(result).toContain('untrusted');
  });

  it('should allow script resources from workspace roots', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'scripts/setup.sh', '#!/bin/bash\necho hello');

    const registry = new SkillRegistry({
      skillRoots: [{ path: tempDir, trust: 'workspace' }],
    });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'scripts/setup.sh' });
    expect(result).toBe('#!/bin/bash\necho hello');
  });

  it('should allow script resources from trusted roots', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'scripts/setup.sh', '#!/bin/bash\necho hello');

    const registry = new SkillRegistry({
      skillRoots: [{ path: tempDir, trust: 'trusted' }],
    });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'scripts/setup.sh' });
    expect(result).toBe('#!/bin/bash\necho hello');
  });

  it('should allow untrusted scripts when allowUntrustedScripts is true', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'scripts/setup.sh', '#!/bin/bash\necho ok');

    const registry = new SkillRegistry({
      skillRoots: [tempDir], // default untrusted
      allowUntrustedScripts: true,
    });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'scripts/setup.sh' });
    expect(result).toBe('#!/bin/bash\necho ok');
  });

  it('should emit TRUST_POLICY_DENIED event when script is blocked', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'scripts/setup.sh', 'danger');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const events: unknown[] = [];
    registry.on(SkillRegistryEvent.TRUST_POLICY_DENIED, (data) => events.push(data));

    const tool = createReadSkillResourceTool(registry);
    await tool.invoke({ name: 'my-skill', path: 'scripts/setup.sh' });

    expect(events).toHaveLength(1);
    const event = events[0] as Record<string, unknown>;
    expect(event.name).toBe('my-skill');
    expect(event.resourcePath).toBe('scripts/setup.sh');
    expect(event.trustLevel).toBe('untrusted');
    expect(event.reason).toBe(TrustPolicyReason.UNTRUSTED_SCRIPT_DENIED);
  });

  it('should emit TRUST_POLICY_ALLOWED event for trusted scripts', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'scripts/setup.sh', '#!/bin/bash\necho ok');

    const registry = new SkillRegistry({
      skillRoots: [{ path: tempDir, trust: 'workspace' }],
    });
    const events: unknown[] = [];
    registry.on(SkillRegistryEvent.TRUST_POLICY_ALLOWED, (data) => events.push(data));

    const tool = createReadSkillResourceTool(registry);
    await tool.invoke({ name: 'my-skill', path: 'scripts/setup.sh' });

    expect(events).toHaveLength(1);
    const event = events[0] as Record<string, unknown>;
    expect(event.name).toBe('my-skill');
    expect(event.reason).toBe(TrustPolicyReason.WORKSPACE_TRUST);
  });

  it('should not emit TRUST_POLICY_ALLOWED for non-script resources', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'references/guide.md', '# Guide');

    const registry = new SkillRegistry({
      skillRoots: [{ path: tempDir, trust: 'workspace' }],
    });
    const events: unknown[] = [];
    registry.on(SkillRegistryEvent.TRUST_POLICY_ALLOWED, (data) => events.push(data));

    const tool = createReadSkillResourceTool(registry);
    await tool.invoke({ name: 'my-skill', path: 'references/guide.md' });

    expect(events).toHaveLength(0);
  });

  it('should handle mixed trust levels across roots', async () => {
    const trustedRoot = createTempDir();
    const untrustedRoot = createTempDir();
    tempDirs.push(trustedRoot, untrustedRoot);

    const trustedSkillDir = createSkillFixture(trustedRoot, 'trusted-skill', 'name: trusted-skill\ndescription: Trusted', '\nbody');
    createResourceFile(trustedSkillDir, 'scripts/deploy.sh', '#!/bin/bash\ndeploy');

    const untrustedSkillDir = createSkillFixture(untrustedRoot, 'community-skill', 'name: community-skill\ndescription: Community', '\nbody');
    createResourceFile(untrustedSkillDir, 'scripts/setup.sh', '#!/bin/bash\nsetup');

    const registry = new SkillRegistry({
      skillRoots: [
        { path: trustedRoot, trust: 'trusted' },
        { path: untrustedRoot, trust: 'untrusted' },
      ],
    });
    const tool = createReadSkillResourceTool(registry);

    // Trusted skill — scripts allowed
    const trustedResult = await tool.invoke({ name: 'trusted-skill', path: 'scripts/deploy.sh' });
    expect(trustedResult).toContain('deploy');

    // Untrusted skill — scripts denied
    const untrustedResult = await tool.invoke({ name: 'community-skill', path: 'scripts/setup.sh' });
    expect(untrustedResult).toContain('Script access denied');
  });
});

// ─── Security regression tests ───────────────────────────────────────────

describe('Security regression — trust policy', () => {
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

  it('should block path traversal even with trusted roots', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');

    const registry = new SkillRegistry({
      skillRoots: [{ path: tempDir, trust: 'workspace' }],
    });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: '../../../etc/passwd' });
    expect(result).toContain('Path traversal');
  });

  it('should block absolute paths even with trusted roots', async () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');

    const registry = new SkillRegistry({
      skillRoots: [{ path: tempDir, trust: 'workspace' }],
    });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: '/etc/passwd' });
    expect(result).toContain('Absolute resource paths');
  });

  it('should deny nested scripts/ path from untrusted root', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'scripts/nested/deep.sh', '#!/bin/bash\nrm -rf /');

    const registry = new SkillRegistry({ skillRoots: [tempDir] }); // untrusted
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'scripts/nested/deep.sh' });
    expect(result).toContain('Script access denied');
  });

  it('should not bypass trust via path tricks like scripts/../scripts/file', async () => {
    // '../' is caught by path traversal check before trust policy
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'scripts/run.sh', 'danger');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'scripts/../scripts/run.sh' });
    expect(result).toContain('Path traversal');
  });

  it('should deny "scripts" path (no trailing slash) from untrusted root', async () => {
    const skillDir = createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');
    createResourceFile(skillDir, 'scripts', 'file-named-scripts');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const tool = createReadSkillResourceTool(registry);

    const result = await tool.invoke({ name: 'my-skill', path: 'scripts' });
    expect(result).toContain('Script access denied');
  });
});

// ─── getAllowedTools ─────────────────────────────────────────────────────

describe('SkillRegistry.getAllowedTools()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return allowedTools from frontmatter', () => {
    createSkillFixture(tempDir, 'code-review',
      'name: code-review\ndescription: Code review\nallowed-tools:\n  - read_file\n  - grep_search',
      '\n# Code Review');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const allowed = registry.getAllowedTools('code-review');

    expect(allowed).toEqual(['read_file', 'grep_search']);
  });

  it('should return undefined for skills without allowed-tools', () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const allowed = registry.getAllowedTools('my-skill');

    expect(allowed).toBeUndefined();
  });

  it('should return undefined for non-existent skills', () => {
    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const allowed = registry.getAllowedTools('nonexistent');

    expect(allowed).toBeUndefined();
  });
});

// ─── Backward compatibility ──────────────────────────────────────────────

describe('Backward compatibility', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should accept plain string roots and default to untrusted', () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const skill = registry.get('my-skill');

    expect(skill).toBeDefined();
    expect(skill!.trustLevel).toBe('untrusted');
  });

  it('should accept mixed string and config objects', () => {
    const root2 = createTempDir();

    createSkillFixture(tempDir, 'skill-a', 'name: skill-a\ndescription: A', '\nbody');
    createSkillFixture(root2, 'skill-b', 'name: skill-b\ndescription: B', '\nbody');

    const registry = new SkillRegistry({
      skillRoots: [
        tempDir,  // plain string → untrusted
        { path: root2, trust: 'workspace' },
      ],
    });

    expect(registry.get('skill-a')!.trustLevel).toBe('untrusted');
    expect(registry.get('skill-b')!.trustLevel).toBe('workspace');

    rmSync(root2, { recursive: true, force: true });
  });

  it('should preserve all existing SkillRegistry query APIs', () => {
    createSkillFixture(tempDir, 'my-skill', 'name: my-skill\ndescription: Test', '\nbody');

    const registry = new SkillRegistry({ skillRoots: [tempDir] });

    expect(registry.get('my-skill')).toBeDefined();
    expect(registry.has('my-skill')).toBe(true);
    expect(registry.size()).toBe(1);
    expect(registry.getNames()).toEqual(['my-skill']);
    expect(registry.getAll().length).toBe(1);
    expect(registry.getScanErrors().length).toBe(0);
  });
});
