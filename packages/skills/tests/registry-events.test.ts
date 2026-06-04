import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SkillRegistry } from '../src/registry.js';
import { SkillRegistryEvent } from '../src/types.js';
import { cleanupTempDirs, createSkillFixture, createTempDir } from './registry.test-utils.js';

describe('SkillRegistry events', () => {
  let tempDir: string;
  let tempDirs: string[] = [];

  beforeEach(() => {
    tempDir = createTempDir('skill-registry-events-test');
    tempDirs = [tempDir];
  });

  afterEach(() => {
    cleanupTempDirs(tempDirs);
  });

  it('emits skill:discovered events on re-scan', () => {
    createSkillFixture(tempDir, 'event-skill', `---
name: event-skill
description: Triggers events
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const discoveredSkills: unknown[] = [];

    registry.on(SkillRegistryEvent.SKILL_DISCOVERED, (data) => {
      discoveredSkills.push(data);
    });

    registry.discover();
    expect(discoveredSkills).toHaveLength(1);
  });

  it('emits skill:warning events for invalid skills', () => {
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

  it('supports off() to remove handlers', () => {
    createSkillFixture(tempDir, 'off-test', `---
name: off-test
description: Test off
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    const events: unknown[] = [];
    const handler = (data: unknown) => {
      events.push(data);
    };

    registry.on(SkillRegistryEvent.SKILL_DISCOVERED, handler);
    registry.discover();
    expect(events).toHaveLength(1);

    registry.off(SkillRegistryEvent.SKILL_DISCOVERED, handler);
    registry.discover();
    expect(events).toHaveLength(1);
  });

  it('does not crash if an event handler throws', () => {
    createSkillFixture(tempDir, 'crash-test', `---
name: crash-test
description: Handler will throw
---
body`);

    const registry = new SkillRegistry({ skillRoots: [tempDir] });
    registry.on(SkillRegistryEvent.SKILL_DISCOVERED, () => {
      throw new Error('Handler exploded!');
    });

    expect(() => registry.discover()).not.toThrow();
  });
});
