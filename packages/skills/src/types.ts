/**
 * Skill System Types
 *
 * Core type definitions for the AgentForge Agent Skills system.
 * These types align with the Agent Skills specification (https://agentskills.io/specification).
 */

// ─── Trust Policy Types ──────────────────────────────────────────────────

/**
 * Trust level for a skill root directory.
 *
 * - `workspace` — Skills from the project workspace (highest trust, scripts allowed)
 * - `trusted`   — Explicitly trusted skill roots (scripts allowed)
 * - `untrusted` — Untrusted roots like community packs (scripts blocked by default)
 */
export type TrustLevel = 'workspace' | 'trusted' | 'untrusted';

/**
 * Configuration for a skill root with an explicit trust level.
 *
 * @example
 * ```ts
 * const roots: SkillRootConfig[] = [
 *   { path: '.agentskills', trust: 'workspace' },
 *   { path: '~/.agentskills', trust: 'trusted' },
 *   { path: '/shared/community-skills', trust: 'untrusted' },
 * ];
 * ```
 */
export interface SkillRootConfig {
  /** Directory path to scan for skills */
  path: string;
  /** Trust level assigned to all skills discovered from this root */
  trust: TrustLevel;
}

/**
 * Policy decision returned by trust enforcement checks.
 */
export interface TrustPolicyDecision {
  /** Whether the action is allowed */
  allowed: boolean;
  /** Machine-readable reason code for auditing */
  reason: TrustPolicyReason;
  /** Human-readable explanation */
  message: string;
}

/**
 * Reason codes for trust policy decisions.
 *
 * Used for structured logging and auditing of guardrail behavior.
 */
export enum TrustPolicyReason {
  /** Resource is not a script — no trust check needed */
  NOT_SCRIPT = 'not-script',
  /** Skill root has workspace trust — scripts allowed */
  WORKSPACE_TRUST = 'workspace-trust',
  /** Skill root has explicit trusted status — scripts allowed */
  TRUSTED_ROOT = 'trusted-root',
  /** Skill root is untrusted — scripts denied by default */
  UNTRUSTED_SCRIPT_DENIED = 'untrusted-script-denied',
  /** Untrusted script access was explicitly allowed via config override */
  UNTRUSTED_SCRIPT_ALLOWED = 'untrusted-script-allowed-override',
  /** Trust level is unknown — treated as untrusted for security */
  UNKNOWN_TRUST_LEVEL = 'unknown-trust-level',
}

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
  /** Trust level assigned to this skill (inherited from root config) */
  trustLevel: TrustLevel;
}

/**
 * Configuration for the SkillRegistry.
 */
export interface SkillRegistryConfig {
  /**
   * Array of directory paths to scan for skills.
   *
   * Each entry can be a plain string (defaults to `'untrusted'` trust level)
   * or a `SkillRootConfig` object with an explicit trust level.
   *
   * Paths may be absolute or relative (resolved against `cwd`).
   * The `~` prefix is expanded to `$HOME`.
   *
   * @example
   * ```ts
   * // Simple string roots (default to 'untrusted')
   * skillRoots: ['.agentskills', '~/.agentskills']
   *
   * // Trust-aware roots
   * skillRoots: [
   *   { path: '.agentskills', trust: 'workspace' },
   *   { path: '~/.agentskills', trust: 'trusted' },
   *   { path: '/shared/community', trust: 'untrusted' },
   * ]
   * ```
   */
  skillRoots: Array<string | SkillRootConfig>;

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

  /**
   * Allow script resources from untrusted roots.
   *
   * When `true`, scripts from `scripts/` directories in untrusted
   * skill roots are returned instead of being denied. This disables
   * the default-deny policy for untrusted scripts.
   *
   * **Security warning:** Only enable when you have reviewed all
   * skill packs from untrusted roots.
   *
   * @default false
   */
  allowUntrustedScripts?: boolean;
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
  /** Emitted when a skill is activated (full body loaded) */
  SKILL_ACTIVATED = 'skill:activated',
  /** Emitted when a skill resource file is loaded */
  SKILL_RESOURCE_LOADED = 'skill:resource-loaded',
  /** Emitted when a trust policy denies access to a resource */
  TRUST_POLICY_DENIED = 'trust:policy-denied',
  /** Emitted when a trust policy allows access (for auditing) */
  TRUST_POLICY_ALLOWED = 'trust:policy-allowed',
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
