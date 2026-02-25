/**
 * Conformance Test Suite — Agent Skills Integration
 *
 * Validates the full Agent Skills pipeline end-to-end using the static
 * fixture skill packs committed alongside this test. Unlike the unit
 * tests (which create ephemeral temp fixtures), these tests run against
 * the committed fixtures to catch regressions in fixture quality and to
 * ensure the framework handles real-world skill structures correctly.
 *
 * Pipeline stages covered:
 *   scan → parse → register → prompt → activate → read-resource → trust
 *
 * Fixture layout:
 *   tests/skills/fixtures/
 *   ├── valid/           (code-review, test-generator)
 *   ├── malformed/       (bad-frontmatter, name-mismatch, no-frontmatter)
 *   └── untrusted/       (community-tool with scripts)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillRegistry } from '../src/registry.js';
import { SkillRegistryEvent, type SkillRegistryConfig } from '../src/types.js';
import { ToolCategory } from '@agentforge/core';

// ─── Fixture Roots ──────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = resolve(__dirname, 'fixtures');
const VALID_ROOT = resolve(FIXTURES, 'valid');
const MALFORMED_ROOT = resolve(FIXTURES, 'malformed');
const UNTRUSTED_ROOT = resolve(FIXTURES, 'untrusted');

// ─── Helpers ─────────────────────────────────────────────────────────────

function createRegistry(config: Partial<SkillRegistryConfig> = {}): SkillRegistry {
  return new SkillRegistry({
    enabled: true,
    skillRoots: [
      { path: VALID_ROOT, trust: 'workspace' },
    ],
    ...config,
  });
}

function collectEvents(
  registry: SkillRegistry,
  event: SkillRegistryEvent,
): unknown[] {
  const captured: unknown[] = [];
  registry.on(event, (data) => captured.push(data));
  return captured;
}

// ═════════════════════════════════════════════════════════════════════════
// 1. Discovery — scanning static fixture packs
// ═════════════════════════════════════════════════════════════════════════

describe('Conformance: Discovery', () => {
  it('should discover valid fixture skills (code-review, test-generator)', () => {
    const registry = createRegistry();
    expect(registry.size()).toBe(2);
    expect(registry.getNames().sort()).toEqual(['code-review', 'test-generator']);
  });

  it('should populate metadata from frontmatter', () => {
    const registry = createRegistry();
    const skill = registry.get('code-review');
    expect(skill).toBeDefined();
    expect(skill!.metadata.name).toBe('code-review');
    expect(skill!.metadata.description).toContain('code reviews');
    expect(skill!.metadata.license).toBe('MIT');
    expect(skill!.metadata.compatibility).toEqual(['agentforge', 'copilot']);
    expect(skill!.metadata.metadata).toEqual({ category: 'development', difficulty: 'intermediate' });
    expect(skill!.metadata.allowedTools).toEqual(['read-file', 'grep-search']);
  });

  it('should set correct trust level from root config', () => {
    const registry = createRegistry();
    const skill = registry.get('code-review');
    expect(skill!.trustLevel).toBe('workspace');
  });

  it('should skip all malformed fixtures without crashing', () => {
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [{ path: MALFORMED_ROOT, trust: 'workspace' }],
    });
    // All 3 malformed fixtures should be rejected
    expect(registry.size()).toBe(0);
    expect(registry.getScanErrors().length).toBeGreaterThan(0);
  });

  it('should emit warnings for malformed fixtures', () => {
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [{ path: MALFORMED_ROOT, trust: 'workspace' }],
    });
    const errors = registry.getScanErrors();
    // Should have errors for bad-frontmatter, name-mismatch, no-frontmatter
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it('should discover untrusted skills with correct trust level', () => {
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [{ path: UNTRUSTED_ROOT, trust: 'untrusted' }],
    });
    expect(registry.size()).toBe(1);
    const skill = registry.get('community-tool');
    expect(skill).toBeDefined();
    expect(skill!.trustLevel).toBe('untrusted');
  });

  it('should discover skills from mixed roots', () => {
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [
        { path: VALID_ROOT, trust: 'workspace' },
        { path: UNTRUSTED_ROOT, trust: 'untrusted' },
      ],
    });
    expect(registry.size()).toBe(3);
    expect(registry.getNames().sort()).toEqual([
      'code-review',
      'community-tool',
      'test-generator',
    ]);
  });

  it('should respect maxDiscoveredSkills cap in prompt generation', () => {
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [
        { path: VALID_ROOT, trust: 'workspace' },
        { path: UNTRUSTED_ROOT, trust: 'untrusted' },
      ],
      maxDiscoveredSkills: 2,
    });
    // Cap applies to prompt generation, not discovery
    expect(registry.size()).toBe(3);
    const prompt = registry.generatePrompt();
    // Only 2 skills should appear in the prompt
    const skillMatches = prompt.match(/<skill>/g);
    expect(skillMatches).toHaveLength(2);
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 2. Prompt Generation — XML injection of fixture metadata
// ═════════════════════════════════════════════════════════════════════════

describe('Conformance: Prompt Generation', () => {
  let registry: SkillRegistry;

  beforeEach(() => {
    registry = new SkillRegistry({
      enabled: true,
      skillRoots: [
        { path: VALID_ROOT, trust: 'workspace' },
        { path: UNTRUSTED_ROOT, trust: 'untrusted' },
      ],
    });
  });

  it('should produce <available_skills> XML for fixture skills', () => {
    const prompt = registry.generatePrompt();
    expect(prompt).toContain('<available_skills>');
    expect(prompt).toContain('</available_skills>');
    expect(prompt).toContain('code-review');
    expect(prompt).toContain('test-generator');
    expect(prompt).toContain('community-tool');
  });

  it('should include skill descriptions in prompt', () => {
    const prompt = registry.generatePrompt();
    expect(prompt).toContain('code reviews');
    expect(prompt).toContain('test suites');
    expect(prompt).toContain('community-contributed');
  });

  it('should return empty string when disabled', () => {
    const disabled = new SkillRegistry({
      enabled: false,
      skillRoots: [{ path: VALID_ROOT, trust: 'workspace' }],
    });
    expect(disabled.generatePrompt()).toBe('');
  });

  it('should filter prompt to requested skills only', () => {
    const prompt = registry.generatePrompt({ skills: ['code-review'] });
    expect(prompt).toContain('code-review');
    expect(prompt).not.toContain('test-generator');
    expect(prompt).not.toContain('community-tool');
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 3. Tool Activation — activate-skill with fixture skills
// ═════════════════════════════════════════════════════════════════════════

describe('Conformance: Tool Activation', () => {
  let registry: SkillRegistry;

  beforeEach(() => {
    registry = new SkillRegistry({
      enabled: true,
      skillRoots: [
        { path: VALID_ROOT, trust: 'workspace' },
        { path: UNTRUSTED_ROOT, trust: 'untrusted' },
      ],
    });
  });

  it('should produce two activation tools via toActivationTools()', () => {
    const tools = registry.toActivationTools();
    expect(tools).toHaveLength(2);
    expect(tools[0].metadata.name).toBe('activate-skill');
    expect(tools[1].metadata.name).toBe('read-skill-resource');
    expect(tools[0].metadata.category).toBe(ToolCategory.SKILLS);
    expect(tools[1].metadata.category).toBe(ToolCategory.SKILLS);
  });

  it('should activate code-review and return body content', async () => {
    const [activateSkill] = registry.toActivationTools();
    const body = await activateSkill.invoke({ name: 'code-review' });
    expect(body).toContain('Code Review Skill');
    expect(body).toContain('Review Process');
    // Frontmatter should be stripped from the top of the body, but content
    // may legitimately contain '---' or frontmatter-like text later on.
    const headerRegion = body.split('\n').slice(0, 5).join('\n');
    expect(headerRegion.trimStart().startsWith('---')).toBe(false);
    expect(headerRegion).not.toContain('name: code-review');
  });

  it('should activate test-generator and return body content', async () => {
    const [activateSkill] = registry.toActivationTools();
    const body = await activateSkill.invoke({ name: 'test-generator' });
    expect(body).toContain('Test Generator');
    expect(body).toContain('Test Quality Rules');
  });

  it('should activate community-tool from untrusted root', async () => {
    const [activateSkill] = registry.toActivationTools();
    const body = await activateSkill.invoke({ name: 'community-tool' });
    expect(body).toContain('Community Tool');
    // Activation always works regardless of trust — trust is enforced on resources
    expect(body).toContain('trust policy');
  });

  it('should emit SKILL_ACTIVATED event on activation', async () => {
    const events = collectEvents(registry, SkillRegistryEvent.SKILL_ACTIVATED);
    const [activateSkill] = registry.toActivationTools();
    await activateSkill.invoke({ name: 'code-review' });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ name: 'code-review' });
  });

  it('should return error for non-existent skill', async () => {
    const [activateSkill] = registry.toActivationTools();
    const result = await activateSkill.invoke({ name: 'does-not-exist' });
    expect(result).toContain('not found');
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 4. Resource Loading — read-skill-resource with fixture resources
// ═════════════════════════════════════════════════════════════════════════

describe('Conformance: Resource Loading', () => {
  let registry: SkillRegistry;

  beforeEach(() => {
    registry = new SkillRegistry({
      enabled: true,
      skillRoots: [
        { path: VALID_ROOT, trust: 'workspace' },
        { path: UNTRUSTED_ROOT, trust: 'untrusted' },
      ],
    });
  });

  it('should read references/style-guide.md from code-review', async () => {
    const [, readResource] = registry.toActivationTools();
    const content = await readResource.invoke({
      name: 'code-review',
      path: 'references/style-guide.md',
    });
    expect(content).toContain('Style Guide');
  });

  it('should read references/testing-patterns.md from test-generator', async () => {
    const [, readResource] = registry.toActivationTools();
    const content = await readResource.invoke({
      name: 'test-generator',
      path: 'references/testing-patterns.md',
    });
    expect(content).toContain('Testing Patterns');
  });

  it('should read scripts from workspace-trusted skill', async () => {
    const [, readResource] = registry.toActivationTools();
    const content = await readResource.invoke({
      name: 'code-review',
      path: 'scripts/setup-linter.sh',
    });
    expect(content).toContain('Setup linter');
  });

  it('should read references from untrusted skill (non-script allowed)', async () => {
    const [, readResource] = registry.toActivationTools();
    const content = await readResource.invoke({
      name: 'community-tool',
      path: 'references/readme.md',
    });
    expect(content).toBeTruthy();
  });

  it('should emit SKILL_RESOURCE_LOADED event on success', async () => {
    const events = collectEvents(registry, SkillRegistryEvent.SKILL_RESOURCE_LOADED);
    const [, readResource] = registry.toActivationTools();
    await readResource.invoke({
      name: 'code-review',
      path: 'references/style-guide.md',
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      name: 'code-review',
      resourcePath: 'references/style-guide.md',
    });
  });

  it('should return error for missing resource file', async () => {
    const [, readResource] = registry.toActivationTools();
    const result = await readResource.invoke({
      name: 'code-review',
      path: 'references/nonexistent.md',
    });
    expect(result).toContain('Failed to read resource');
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 5. Trust Policy Enforcement — blocking untrusted scripts
// ═════════════════════════════════════════════════════════════════════════

describe('Conformance: Trust Policy', () => {
  it('should block script access from untrusted root (default)', async () => {
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [{ path: UNTRUSTED_ROOT, trust: 'untrusted' }],
      allowUntrustedScripts: false,
    });
    const events = collectEvents(registry, SkillRegistryEvent.TRUST_POLICY_DENIED);
    const [, readResource] = registry.toActivationTools();

    const result = await readResource.invoke({
      name: 'community-tool',
      path: 'scripts/install.sh',
    });

    expect(result).toContain('blocked');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      name: 'community-tool',
      resourcePath: 'scripts/install.sh',
    });
  });

  it('should allow script access from untrusted root when override is true', async () => {
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [{ path: UNTRUSTED_ROOT, trust: 'untrusted' }],
      allowUntrustedScripts: true,
    });
    const allowed = collectEvents(registry, SkillRegistryEvent.TRUST_POLICY_ALLOWED);
    const denied = collectEvents(registry, SkillRegistryEvent.TRUST_POLICY_DENIED);
    const [, readResource] = registry.toActivationTools();

    const result = await readResource.invoke({
      name: 'community-tool',
      path: 'scripts/install.sh',
    });

    // Should succeed and return file content
    expect(result).toContain('Installing');
    expect(denied).toHaveLength(0);
    expect(allowed).toHaveLength(1);
  });

  it('should allow script access from workspace-trusted root', async () => {
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [{ path: VALID_ROOT, trust: 'workspace' }],
      allowUntrustedScripts: false,
    });
    const denied = collectEvents(registry, SkillRegistryEvent.TRUST_POLICY_DENIED);
    const [, readResource] = registry.toActivationTools();

    const result = await readResource.invoke({
      name: 'code-review',
      path: 'scripts/setup-linter.sh',
    });

    expect(result).toContain('Setup linter');
    expect(denied).toHaveLength(0);
  });

  it('should allow non-script resources from untrusted root', async () => {
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [{ path: UNTRUSTED_ROOT, trust: 'untrusted' }],
      allowUntrustedScripts: false,
    });
    const denied = collectEvents(registry, SkillRegistryEvent.TRUST_POLICY_DENIED);
    const [, readResource] = registry.toActivationTools();

    const result = await readResource.invoke({
      name: 'community-tool',
      path: 'references/readme.md',
    });

    expect(result).toBeTruthy();
    expect(denied).toHaveLength(0);
  });

  it('should block path traversal even with workspace trust', async () => {
    const registry = createRegistry();
    const [, readResource] = registry.toActivationTools();

    const result = await readResource.invoke({
      name: 'code-review',
      path: '../../../etc/passwd',
    });

    expect(result).toContain('traversal');
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 6. getAllowedTools — fixture frontmatter validation
// ═════════════════════════════════════════════════════════════════════════

describe('Conformance: Allowed Tools', () => {
  it('should return allowedTools for code-review fixture', () => {
    const registry = createRegistry();
    expect(registry.getAllowedTools('code-review')).toEqual(['read-file', 'grep-search']);
  });

  it('should return allowedTools for test-generator fixture', () => {
    const registry = createRegistry();
    expect(registry.getAllowedTools('test-generator')).toEqual(['read-file', 'create-file', 'grep-search']);
  });

  it('should return allowedTools for untrusted community-tool', () => {
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [{ path: UNTRUSTED_ROOT, trust: 'untrusted' }],
    });
    expect(registry.getAllowedTools('community-tool')).toEqual(['run-in-terminal']);
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 7. Full Pipeline — scan → prompt → activate → read-resource → trust
// ═════════════════════════════════════════════════════════════════════════

describe('Conformance: Full Pipeline', () => {
  it('should execute the complete pipeline from discovery to trust enforcement', async () => {
    // 1. Scan — create registry with mixed roots
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [
        { path: VALID_ROOT, trust: 'workspace' },
        { path: UNTRUSTED_ROOT, trust: 'untrusted' },
      ],
      allowUntrustedScripts: false,
    });

    // Collect all events
    const activated = collectEvents(registry, SkillRegistryEvent.SKILL_ACTIVATED);
    const loaded = collectEvents(registry, SkillRegistryEvent.SKILL_RESOURCE_LOADED);
    const denied = collectEvents(registry, SkillRegistryEvent.TRUST_POLICY_DENIED);

    expect(registry.size()).toBe(3);

    // 2. Prompt — generate skill listing
    const prompt = registry.generatePrompt();
    expect(prompt).toContain('<available_skills>');
    expect(prompt).toContain('code-review');
    expect(prompt).toContain('community-tool');

    // 3. Activate — load skill instructions
    const [activateSkill, readResource] = registry.toActivationTools();

    const codeReviewBody = await activateSkill.invoke({ name: 'code-review' });
    expect(codeReviewBody).toContain('Code Review Skill');

    const communityBody = await activateSkill.invoke({ name: 'community-tool' });
    expect(communityBody).toContain('Community Tool');

    expect(activated).toHaveLength(2);

    // 4. Read resource — workspace reference (allowed)
    const styleGuide = await readResource.invoke({
      name: 'code-review',
      path: 'references/style-guide.md',
    });
    expect(styleGuide).toContain('Style Guide');
    expect(loaded).toHaveLength(1);

    // 5. Read resource — workspace script (allowed, workspace trust)
    const script = await readResource.invoke({
      name: 'code-review',
      path: 'scripts/setup-linter.sh',
    });
    expect(script).toContain('Setup linter');

    // 6. Read resource — untrusted reference (allowed, non-script)
    const communityRef = await readResource.invoke({
      name: 'community-tool',
      path: 'references/readme.md',
    });
    expect(communityRef).toBeTruthy();

    // 7. Trust enforcement — untrusted script (blocked)
    const blockedScript = await readResource.invoke({
      name: 'community-tool',
      path: 'scripts/install.sh',
    });
    expect(blockedScript).toContain('blocked');
    expect(denied).toHaveLength(1);

    // 8. Path traversal — blocked regardless of trust
    const traversal = await readResource.invoke({
      name: 'code-review',
      path: '../../../etc/passwd',
    });
    expect(traversal).toContain('traversal');
  });

  it('should handle malformed fixtures gracefully in mixed roots', async () => {
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [
        { path: VALID_ROOT, trust: 'workspace' },
        { path: MALFORMED_ROOT, trust: 'workspace' },
        { path: UNTRUSTED_ROOT, trust: 'untrusted' },
      ],
    });

    // Valid + untrusted skills discovered, malformed skipped
    expect(registry.size()).toBe(3);
    expect(registry.getScanErrors().length).toBeGreaterThan(0);

    // Pipeline still works for valid skills
    const [activateSkill] = registry.toActivationTools();
    const body = await activateSkill.invoke({ name: 'code-review' });
    expect(body).toContain('Code Review Skill');
  });

  it('should reflect changes after re-scan', () => {
    const registry = new SkillRegistry({
      enabled: true,
      skillRoots: [{ path: VALID_ROOT, trust: 'workspace' }],
    });

    expect(registry.size()).toBe(2);

    // Re-scan should produce the same result from static fixtures
    registry.discover();
    expect(registry.size()).toBe(2);
    expect(registry.getNames().sort()).toEqual(['code-review', 'test-generator']);
  });
});
