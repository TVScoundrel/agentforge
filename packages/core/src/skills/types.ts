/**
 * Skill System Types
 *
 * Core type definitions for the AgentForge Agent Skills system.
 * These types align with the Agent Skills specification (https://agentskills.io/specification).
 */

/**
 * Parsed metadata from a SKILL.md frontmatter block.
 *
 * Required fields: `name`, `description`.
 * All other fields are optional per the Agent Skills spec.
 */
export interface SkillMetadata {
  /** Skill name (1-64 chars, lowercase alphanumeric + hyphens, must match parent dir name) */
  name: string;
  /** Human-readable description (1-1024 chars) */
  description: string;
  /** SPDX license identifier */
  license?: string;
  /** List of compatible agent frameworks / tool hosts */
  compatibility?: string[];
  /** Arbitrary key-value metadata (author, version, etc.) */
  metadata?: Record<string, unknown>;
  /** Tools that this skill is allowed to use */
  allowedTools?: string[];
}

/**
 * A fully resolved skill entry in the registry.
 *
 * Contains parsed metadata plus internal tracking fields
 * that are not part of the SKILL.md frontmatter.
 */
export interface Skill {
  /** Parsed frontmatter metadata */
  metadata: SkillMetadata;
  /** Absolute path to the skill directory */
  skillPath: string;
  /** Which configured skill root this was discovered from */
  rootPath: string;
}

/**
 * Configuration for the SkillRegistry.
 */
export interface SkillRegistryConfig {
  /**
   * Array of directory paths to scan for skills.
   *
   * Each root is scanned for subdirectories containing a valid `SKILL.md`.
   * Paths may be absolute or relative (resolved against `cwd`).
   * The `~` prefix is expanded to `$HOME`.
   *
   * @example ['.agentskills', '~/.agentskills', './project-skills']
   */
  skillRoots: string[];

  /**
   * Feature flag to enable Agent Skills in system prompts.
   *
   * When `false` (default), `generatePrompt()` returns an empty string
   * so agents operate with unmodified system prompts.
   *
   * @default false
   */
  enabled?: boolean;

  /**
   * Maximum number of skills to include in generated prompts.
   *
   * Caps prompt token usage when many skills are discovered.
   * Skills are included in discovery order (first root first).
   * When undefined, all discovered skills are included.
   */
  maxDiscoveredSkills?: number;
}

/**
 * Options for `SkillRegistry.generatePrompt()`.
 */
export interface SkillPromptOptions {
  /**
   * Subset of skill names to include in the generated prompt.
   *
   * When provided, only skills matching these names appear in the
   * `<available_skills>` XML block. This enables creating focused
   * agents with different skill sets from the same registry.
   *
   * When omitted or empty, all discovered skills are included.
   *
   * @example ['code-review', 'testing-strategy']
   */
  skills?: string[];
}

/**
 * Events emitted by the SkillRegistry during discovery and usage.
 */
export enum SkillRegistryEvent {
  /** Emitted when a valid skill is discovered during scanning */
  SKILL_DISCOVERED = 'skill:discovered',
  /** Emitted when a skill parse or validation issue is encountered */
  SKILL_WARNING = 'skill:warning',
}

/**
 * Event handler type for skill registry events.
 */
export type SkillEventHandler = (data: unknown) => void;

/**
 * Result of parsing a single SKILL.md file.
 */
export interface SkillParseResult {
  /** Whether parsing and validation succeeded */
  success: boolean;
  /** Parsed metadata (present when success is true) */
  metadata?: SkillMetadata;
  /** The raw markdown body below the frontmatter (present when success is true) */
  body?: string;
  /** Error description (present when success is false) */
  error?: string;
}

/**
 * Validation error detail.
 */
export interface SkillValidationError {
  /** Which field failed validation */
  field: string;
  /** Human-readable error message */
  message: string;
}
