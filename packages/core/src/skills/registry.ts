/**
 * Skill Registry
 *
 * Central registry for discovering, storing, and querying Agent Skills.
 * Mirrors ToolRegistry but uses folder-based auto-discovery instead
 * of programmatic registration.
 *
 * @see https://agentskills.io/specification
 *
 * @example
 * ```ts
 * const registry = new SkillRegistry({
 *   skillRoots: ['.agentskills', '~/.agentskills'],
 * });
 *
 * // Query discovered skills
 * const skill = registry.get('code-review');
 * const allSkills = registry.getAll();
 *
 * // Listen for events
 * registry.on(SkillRegistryEvent.SKILL_DISCOVERED, (skill) => {
 *   console.log('Found skill:', skill.metadata.name);
 * });
 * ```
 */

import type {
  Skill,
  SkillRegistryConfig,
  SkillPromptOptions,
  SkillEventHandler,
} from './types.js';
import { SkillRegistryEvent } from './types.js';
import { scanAllSkillRoots } from './scanner.js';
import { parseSkillContent } from './parser.js';
import { createSkillActivationTools } from './activation.js';
import { createLogger, LogLevel } from '../langgraph/observability/logger.js';

const logger = createLogger('agentforge:core:skills:registry', { level: LogLevel.INFO });

/**
 * Skill Registry — auto-discovers skills from configured folder paths.
 *
 * Parallel to ToolRegistry:
 * | ToolRegistry             | SkillRegistry                            |
 * |--------------------------|------------------------------------------|
 * | registry.register(tool)  | new SkillRegistry({ skillRoots })        |
 * | registry.get('name')     | skillRegistry.get('name')                |
 * | registry.getAll()        | skillRegistry.getAll()                   |
 * | registry.has('name')     | skillRegistry.has('name')                |
 * | registry.size()          | skillRegistry.size()                     |
 * | registry.generatePrompt()| skillRegistry.generatePrompt()           |
 * | registry.toLangChainTools()| skillRegistry.toActivationTools()       |
 */
export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private eventHandlers: Map<SkillRegistryEvent, Set<SkillEventHandler>> = new Map();
  private readonly config: SkillRegistryConfig;
  private scanErrors: Array<{ path: string; error: string }> = [];

  /**
   * Create a SkillRegistry and immediately scan configured roots for skills.
   *
   * @param config - Registry configuration with skill root paths
   *
   * @example
   * ```ts
   * const registry = new SkillRegistry({
   *   skillRoots: ['.agentskills', '~/.agentskills', './project-skills'],
   * });
   * console.log(`Discovered ${registry.size()} skills`);
   * ```
   */
  constructor(config: SkillRegistryConfig) {
    this.config = config;
    this.discover();
  }

  /**
   * Scan all configured roots and populate the registry.
   *
   * Called automatically during construction. Can be called again
   * to re-scan (clears existing skills first).
   */
  discover(): void {
    this.skills.clear();
    this.scanErrors = [];

    const candidates = scanAllSkillRoots(this.config.skillRoots);

    let successCount = 0;
    let warningCount = 0;

    for (const candidate of candidates) {
      const result = parseSkillContent(candidate.content, candidate.dirName);

      if (!result.success) {
        warningCount++;
        this.scanErrors.push({
          path: candidate.skillPath,
          error: result.error || 'Unknown parse error',
        });
        this.emit(SkillRegistryEvent.SKILL_WARNING, {
          skillPath: candidate.skillPath,
          rootPath: candidate.rootPath,
          error: result.error,
        });
        logger.warn('Skipping invalid skill', {
          skillPath: candidate.skillPath,
          error: result.error,
        });
        continue;
      }

      const skill: Skill = {
        metadata: result.metadata!,
        skillPath: candidate.skillPath,
        rootPath: candidate.rootPath,
      };

      // Handle duplicate skill names — first root wins (deterministic precedence)
      if (this.skills.has(skill.metadata.name)) {
        const existing = this.skills.get(skill.metadata.name)!;
        warningCount++;
        const warningMsg = `Duplicate skill name "${skill.metadata.name}" from "${candidate.rootPath}" — ` +
          `keeping version from "${existing.rootPath}" (first root takes precedence)`;
        this.scanErrors.push({
          path: candidate.skillPath,
          error: warningMsg,
        });
        this.emit(SkillRegistryEvent.SKILL_WARNING, {
          skillPath: candidate.skillPath,
          rootPath: candidate.rootPath,
          duplicateOf: existing.skillPath,
          error: warningMsg,
        });
        logger.warn('Duplicate skill name, keeping first', {
          name: skill.metadata.name,
          kept: existing.skillPath,
          skipped: candidate.skillPath,
        });
        continue;
      }

      this.skills.set(skill.metadata.name, skill);
      successCount++;

      this.emit(SkillRegistryEvent.SKILL_DISCOVERED, skill);
      logger.debug('Skill discovered', {
        name: skill.metadata.name,
        description: skill.metadata.description.slice(0, 80),
        skillPath: skill.skillPath,
      });
    }

    logger.info('Skill registry populated', {
      rootsScanned: this.config.skillRoots.length,
      skillsDiscovered: successCount,
      warnings: warningCount,
    });
  }

  // ─── Query API (parallel to ToolRegistry) ──────────────────────────────

  /**
   * Get a skill by name.
   *
   * @param name - The skill name
   * @returns The skill, or undefined if not found
   *
   * @example
   * ```ts
   * const skill = registry.get('code-review');
   * if (skill) {
   *   console.log(skill.metadata.description);
   * }
   * ```
   */
  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * Get all discovered skills.
   *
   * @returns Array of all skills
   *
   * @example
   * ```ts
   * const allSkills = registry.getAll();
   * console.log(`Total skills: ${allSkills.length}`);
   * ```
   */
  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Check if a skill exists in the registry.
   *
   * @param name - The skill name
   * @returns True if the skill exists
   *
   * @example
   * ```ts
   * if (registry.has('code-review')) {
   *   console.log('Skill available!');
   * }
   * ```
   */
  has(name: string): boolean {
    return this.skills.has(name);
  }

  /**
   * Get the number of discovered skills.
   *
   * @returns Number of skills in the registry
   *
   * @example
   * ```ts
   * console.log(`Registry has ${registry.size()} skills`);
   * ```
   */
  size(): number {
    return this.skills.size;
  }

  /**
   * Get all skill names.
   *
   * @returns Array of skill names
   */
  getNames(): string[] {
    return Array.from(this.skills.keys());
  }

  /**
   * Get errors/warnings from the last scan.
   *
   * Useful for diagnostics and observability.
   *
   * @returns Array of scan errors with paths
   */
  getScanErrors(): ReadonlyArray<{ path: string; error: string }> {
    return this.scanErrors;
  }

  // ─── Prompt Generation ─────────────────────────────────────────────────

  /**
   * Generate an `<available_skills>` XML block for system prompt injection.
   *
   * Returns an empty string when:
   * - `config.enabled` is `false` (default) — agents operate with unmodified prompts
   * - No skills match the filter criteria
   *
   * The output composes naturally with `toolRegistry.generatePrompt()` —
   * simply concatenate both into the system prompt.
   *
   * @param options - Optional filtering (subset of skill names)
   * @returns XML string or empty string
   *
   * @example
   * ```ts
   * // All skills
   * const xml = registry.generatePrompt();
   *
   * // Subset for a focused agent
   * const xml = registry.generatePrompt({ skills: ['code-review', 'testing'] });
   *
   * // Compose with tool prompt
   * const systemPrompt = [
   *   toolRegistry.generatePrompt(),
   *   skillRegistry.generatePrompt(),
   * ].filter(Boolean).join('\n\n');
   * ```
   */
  generatePrompt(options?: SkillPromptOptions): string {
    // Feature flag gate — disabled by default
    if (!this.config.enabled) {
      logger.debug('Skill prompt generation skipped (disabled)', {
        enabled: this.config.enabled ?? false,
      });
      return '';
    }

    // Resolve which skills to include
    let skills = this.getAll();

    // Apply subset filter if provided
    if (options?.skills && options.skills.length > 0) {
      const requested = new Set(options.skills);
      skills = skills.filter((s) => requested.has(s.metadata.name));
    }

    // Apply maxDiscoveredSkills cap
    if (this.config.maxDiscoveredSkills !== undefined && this.config.maxDiscoveredSkills >= 0) {
      skills = skills.slice(0, this.config.maxDiscoveredSkills);
    }

    // No skills — return empty string
    if (skills.length === 0) {
      logger.debug('Skill prompt generation produced empty result', {
        totalDiscovered: this.size(),
        filterApplied: !!(options?.skills && options.skills.length > 0),
        maxCap: this.config.maxDiscoveredSkills,
      });
      return '';
    }

    // Generate XML
    const skillEntries = skills.map((skill) => {
      const lines = [
        '  <skill>',
        `    <name>${escapeXml(skill.metadata.name)}</name>`,
        `    <description>${escapeXml(skill.metadata.description)}</description>`,
        `    <location>${escapeXml(skill.skillPath)}</location>`,
        '  </skill>',
      ];
      return lines.join('\n');
    });

    const xml = `<available_skills>\n${skillEntries.join('\n')}\n</available_skills>`;

    // Estimate token count (~4 chars per token, rough heuristic)
    const estimatedTokens = Math.ceil(xml.length / 4);

    logger.info('Skill prompt generated', {
      skillCount: skills.length,
      totalDiscovered: this.size(),
      filterApplied: !!(options?.skills && options.skills.length > 0),
      maxCap: this.config.maxDiscoveredSkills,
      estimatedTokens,
      xmlLength: xml.length,
    });

    return xml;
  }

  // ─── Event System ──────────────────────────────────────────────────────

  /**
   * Register an event handler.
   *
   * @param event - The event to listen for
   * @param handler - The handler function
   *
   * @example
   * ```ts
   * registry.on(SkillRegistryEvent.SKILL_DISCOVERED, (skill) => {
   *   console.log('Found skill:', skill.metadata.name);
   * });
   * ```
   */
  on(event: SkillRegistryEvent, handler: SkillEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unregister an event handler.
   *
   * @param event - The event to stop listening for
   * @param handler - The handler function to remove
   */
  off(event: SkillRegistryEvent, handler: SkillEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all registered handlers.
   *
   * @param event - The event to emit
   * @param data - The event data
   * @private
   */
  private emit(event: SkillRegistryEvent, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          logger.error('Skill event handler error', {
            event,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
      });
    }
  }

  /**
   * Emit an event (public API for activation tools).
   *
   * Used by skill activation tools to emit `skill:activated` and
   * `skill:resource-loaded` events through the registry's event system.
   *
   * @param event - The event to emit
   * @param data - The event data
   */
  emitEvent(event: SkillRegistryEvent, data: unknown): void {
    this.emit(event, data);
  }

  // ─── Tool Integration ────────────────────────────────────────────────

  /**
   * Create activation tools pre-wired to this registry instance.
   *
   * Returns `activate-skill` and `read-skill-resource` tools that
   * agents can use to load skill instructions and resources on demand.
   *
   * @returns Array of [activate-skill, read-skill-resource] tools
   *
   * @example
   * ```ts
   * const agent = createReActAgent({
   *   model: llm,
   *   tools: [
   *     ...toolRegistry.toLangChainTools(),
   *     ...skillRegistry.toActivationTools(),
   *   ],
   * });
   * ```
   */
  toActivationTools() {
    return createSkillActivationTools(this);
  }
}

/**
 * Escape special XML characters in a string.
 *
 * @param str - The string to escape
 * @returns Escaped string safe for XML content
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
