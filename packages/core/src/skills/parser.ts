/**
 * SKILL.md Frontmatter Parser
 *
 * Parses YAML frontmatter from SKILL.md files and validates
 * against the Agent Skills specification constraints.
 *
 * @see https://agentskills.io/specification
 */

import matter from 'gray-matter';
import type { SkillMetadata, SkillParseResult, SkillValidationError } from './types.js';

/**
 * Skill name validation constraints (per spec).
 *
 * - 1-64 characters
 * - Lowercase alphanumeric and hyphens only
 * - No leading, trailing, or consecutive hyphens
 */
const SKILL_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const SKILL_NAME_MAX_LENGTH = 64;
const SKILL_DESCRIPTION_MAX_LENGTH = 1024;

/**
 * Validate the `name` field per the Agent Skills spec.
 *
 * @param name - The name value from frontmatter
 * @returns Array of validation errors (empty = valid)
 */
export function validateSkillName(name: unknown): SkillValidationError[] {
  const errors: SkillValidationError[] = [];

  if (name === undefined || name === null) {
    errors.push({ field: 'name', message: 'name is required' });
    return errors;
  }

  if (typeof name !== 'string') {
    errors.push({ field: 'name', message: 'name must be a string' });
    return errors;
  }

  if (name.length === 0) {
    errors.push({ field: 'name', message: 'name must not be empty' });
    return errors;
  }

  if (name.length > SKILL_NAME_MAX_LENGTH) {
    errors.push({
      field: 'name',
      message: `name must be at most ${SKILL_NAME_MAX_LENGTH} characters (got ${name.length})`,
    });
    return errors;
  }

  if (!SKILL_NAME_PATTERN.test(name)) {
    errors.push({
      field: 'name',
      message: 'name must be lowercase alphanumeric with hyphens, no leading/trailing/consecutive hyphens',
    });
  }

  if (name.includes('--')) {
    errors.push({
      field: 'name',
      message: 'name must not contain consecutive hyphens',
    });
  }

  return errors;
}

/**
 * Validate the `description` field per the Agent Skills spec.
 *
 * @param description - The description value from frontmatter
 * @returns Array of validation errors (empty = valid)
 */
export function validateSkillDescription(description: unknown): SkillValidationError[] {
  const errors: SkillValidationError[] = [];

  if (description === undefined || description === null) {
    errors.push({ field: 'description', message: 'description is required' });
    return errors;
  }

  if (typeof description !== 'string') {
    errors.push({ field: 'description', message: 'description must be a string' });
    return errors;
  }

  if (description.trim().length === 0) {
    errors.push({ field: 'description', message: 'description must not be empty' });
    return errors;
  }

  if (description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
    errors.push({
      field: 'description',
      message: `description must be at most ${SKILL_DESCRIPTION_MAX_LENGTH} characters (got ${description.length})`,
    });
  }

  return errors;
}

/**
 * Validate that the skill name matches its parent directory name (per spec).
 *
 * @param name - The name from frontmatter
 * @param dirName - The parent directory name
 * @returns Array of validation errors (empty = valid)
 */
export function validateSkillNameMatchesDir(name: string, dirName: string): SkillValidationError[] {
  if (name !== dirName) {
    return [{
      field: 'name',
      message: `name "${name}" must match parent directory name "${dirName}"`,
    }];
  }
  return [];
}

/**
 * Parse and validate a SKILL.md file's raw content.
 *
 * Extracts YAML frontmatter using gray-matter, then validates
 * required and optional fields against spec constraints.
 *
 * @param content - Raw file content of the SKILL.md
 * @param dirName - Parent directory name for name-match validation
 * @returns Parse result with metadata or error
 */
export function parseSkillContent(content: string, dirName: string): SkillParseResult {
  let parsed: matter.GrayMatterFile<string>;

  try {
    parsed = matter(content);
  } catch (err) {
    return {
      success: false,
      error: `Failed to parse frontmatter: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const data = parsed.data;

  // Validate required fields
  const errors: SkillValidationError[] = [
    ...validateSkillName(data.name),
    ...validateSkillDescription(data.description),
  ];

  // If name is valid, validate it matches directory name
  if (typeof data.name === 'string' && data.name.length > 0 && SKILL_NAME_PATTERN.test(data.name)) {
    errors.push(...validateSkillNameMatchesDir(data.name, dirName));
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: errors.map((e) => `${e.field}: ${e.message}`).join('; '),
    };
  }

  // Build metadata from validated fields
  const metadata: SkillMetadata = {
    name: data.name as string,
    description: data.description as string,
  };

  // Optional fields
  if (data.license !== undefined) {
    metadata.license = String(data.license);
  }

  if (Array.isArray(data.compatibility)) {
    metadata.compatibility = data.compatibility.map(String);
  }

  if (data.metadata !== undefined && typeof data.metadata === 'object' && data.metadata !== null) {
    metadata.metadata = data.metadata as Record<string, unknown>;
  }

  if (Array.isArray(data['allowed-tools'])) {
    metadata.allowedTools = data['allowed-tools'].map(String);
  }

  return {
    success: true,
    metadata,
    body: parsed.content,
  };
}
