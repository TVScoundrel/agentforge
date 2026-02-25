/**
 * Tests for Skill Frontmatter Parser
 *
 * Covers: parseSkillContent, validateSkillName, validateSkillDescription,
 * validateSkillNameMatchesDir
 */

import { describe, it, expect } from 'vitest';
import {
  parseSkillContent,
  validateSkillName,
  validateSkillDescription,
  validateSkillNameMatchesDir,
} from '../src/parser.js';

describe('validateSkillName', () => {
  it('should accept valid names', () => {
    expect(validateSkillName('code-review')).toEqual([]);
    expect(validateSkillName('a')).toEqual([]);
    expect(validateSkillName('my-great-skill')).toEqual([]);
    expect(validateSkillName('abc123')).toEqual([]);
    expect(validateSkillName('a1b2c3')).toEqual([]);
  });

  it('should reject undefined/null', () => {
    expect(validateSkillName(undefined)).toHaveLength(1);
    expect(validateSkillName(undefined)[0].message).toContain('required');
    expect(validateSkillName(null)).toHaveLength(1);
  });

  it('should reject non-string', () => {
    expect(validateSkillName(42)).toHaveLength(1);
    expect(validateSkillName(42)[0].message).toContain('must be a string');
  });

  it('should reject empty string', () => {
    expect(validateSkillName('')).toHaveLength(1);
    expect(validateSkillName('')[0].message).toContain('must not be empty');
  });

  it('should reject names exceeding 64 characters', () => {
    const longName = 'a'.repeat(65);
    const errors = validateSkillName(longName);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some(e => e.message.includes('at most 64'))).toBe(true);
  });

  it('should accept name at exactly 64 characters', () => {
    const name64 = 'a'.repeat(64);
    expect(validateSkillName(name64)).toEqual([]);
  });

  it('should reject uppercase letters', () => {
    const errors = validateSkillName('Code-Review');
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it('should reject leading hyphen', () => {
    const errors = validateSkillName('-code');
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it('should reject trailing hyphen', () => {
    const errors = validateSkillName('code-');
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it('should reject consecutive hyphens', () => {
    const errors = validateSkillName('code--review');
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some(e => e.message.includes('consecutive hyphens'))).toBe(true);
  });

  it('should reject special characters', () => {
    expect(validateSkillName('code_review').length).toBeGreaterThanOrEqual(1);
    expect(validateSkillName('code.review').length).toBeGreaterThanOrEqual(1);
    expect(validateSkillName('code review').length).toBeGreaterThanOrEqual(1);
  });
});

describe('validateSkillDescription', () => {
  it('should accept valid descriptions', () => {
    expect(validateSkillDescription('A useful skill')).toEqual([]);
    expect(validateSkillDescription('x')).toEqual([]);
  });

  it('should reject undefined/null', () => {
    expect(validateSkillDescription(undefined)).toHaveLength(1);
    expect(validateSkillDescription(undefined)[0].message).toContain('required');
    expect(validateSkillDescription(null)).toHaveLength(1);
  });

  it('should reject non-string', () => {
    expect(validateSkillDescription(123)).toHaveLength(1);
    expect(validateSkillDescription(123)[0].message).toContain('must be a string');
  });

  it('should reject empty/whitespace-only', () => {
    expect(validateSkillDescription('')).toHaveLength(1);
    expect(validateSkillDescription('   ')).toHaveLength(1);
    expect(validateSkillDescription('  ')[0].message).toContain('must not be empty');
  });

  it('should reject descriptions exceeding 1024 characters', () => {
    const longDesc = 'a'.repeat(1025);
    const errors = validateSkillDescription(longDesc);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0].message).toContain('at most 1024');
  });

  it('should accept description at exactly 1024 characters', () => {
    const desc1024 = 'a'.repeat(1024);
    expect(validateSkillDescription(desc1024)).toEqual([]);
  });
});

describe('validateSkillNameMatchesDir', () => {
  it('should pass when name matches directory', () => {
    expect(validateSkillNameMatchesDir('code-review', 'code-review')).toEqual([]);
  });

  it('should fail when name does not match directory', () => {
    const errors = validateSkillNameMatchesDir('code-review', 'my-skill');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('must match parent directory name');
  });
});

describe('parseSkillContent', () => {
  it('should parse valid SKILL.md with required fields', () => {
    const content = `---
name: code-review
description: Reviews code for quality and security
---

# Code Review Skill

Follow these steps...`;

    const result = parseSkillContent(content, 'code-review');
    expect(result.success).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.metadata!.name).toBe('code-review');
    expect(result.metadata!.description).toBe('Reviews code for quality and security');
    expect(result.body).toContain('# Code Review Skill');
  });

  it('should parse all optional fields', () => {
    const content = `---
name: full-skill
description: A skill with all fields
license: MIT
compatibility:
  - github-copilot
  - agentforge
metadata:
  author: team-x
  version: 1.0.0
allowed-tools:
  - read-file
  - grep-search
---

Content here`;

    const result = parseSkillContent(content, 'full-skill');
    expect(result.success).toBe(true);
    expect(result.metadata!.license).toBe('MIT');
    expect(result.metadata!.compatibility).toEqual(['github-copilot', 'agentforge']);
    expect(result.metadata!.metadata).toEqual({ author: 'team-x', version: '1.0.0' });
    expect(result.metadata!.allowedTools).toEqual(['read-file', 'grep-search']);
  });

  it('should fail when name is missing', () => {
    const content = `---
description: A skill without a name
---

body`;

    const result = parseSkillContent(content, 'some-dir');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
    expect(result.error).toContain('required');
  });

  it('should fail when description is missing', () => {
    const content = `---
name: no-desc
---

body`;

    const result = parseSkillContent(content, 'no-desc');
    expect(result.success).toBe(false);
    expect(result.error).toContain('description');
    expect(result.error).toContain('required');
  });

  it('should fail when name does not match directory', () => {
    const content = `---
name: code-review
description: A valid description
---

body`;

    const result = parseSkillContent(content, 'wrong-dir');
    expect(result.success).toBe(false);
    expect(result.error).toContain('must match parent directory name');
  });

  it('should fail on invalid name format', () => {
    const content = `---
name: Code-Review
description: A valid description
---

body`;

    const result = parseSkillContent(content, 'Code-Review');
    expect(result.success).toBe(false);
    expect(result.error).toContain('lowercase');
  });

  it('should fail on malformed frontmatter', () => {
    const content = `---
name: [invalid
  yaml: {{broken
---

body`;

    const result = parseSkillContent(content, 'test');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to parse frontmatter');
  });

  it('should handle empty frontmatter', () => {
    const content = `---
---

body`;

    const result = parseSkillContent(content, 'test');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
    expect(result.error).toContain('required');
  });

  it('should handle content with no frontmatter at all', () => {
    const content = '# Just a markdown file\n\nNo frontmatter.';

    const result = parseSkillContent(content, 'test');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  it('should ignore unknown frontmatter fields without error', () => {
    const content = `---
name: my-skill
description: A valid skill
custom-field: some-value
another: 42
---

body`;

    const result = parseSkillContent(content, 'my-skill');
    expect(result.success).toBe(true);
    expect(result.metadata!.name).toBe('my-skill');
  });

  it('should handle non-array compatibility gracefully', () => {
    const content = `---
name: my-skill
description: A valid skill
compatibility: not-an-array
---

body`;

    const result = parseSkillContent(content, 'my-skill');
    expect(result.success).toBe(true);
    // Non-array compatibility is simply ignored
    expect(result.metadata!.compatibility).toBeUndefined();
  });

  it('should handle non-object metadata gracefully', () => {
    const content = `---
name: my-skill
description: A valid skill
metadata: just-a-string
---

body`;

    const result = parseSkillContent(content, 'my-skill');
    expect(result.success).toBe(true);
    expect(result.metadata!.metadata).toBeUndefined();
  });

  it('should collect multiple validation errors', () => {
    const content = `---
name: 123
description: ""
---

body`;

    // name "123" is actually valid (numeric), but empty description should fail
    const result = parseSkillContent(content, '123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('description');
  });
});
