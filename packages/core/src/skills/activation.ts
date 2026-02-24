/**
 * Skill Activation Tools
 *
 * Provides `activate-skill` and `read-skill-resource` tools built with
 * the AgentForge tool builder API. These tools enable agents to load
 * skill instructions on demand and access skill resources at runtime.
 *
 * @see https://agentskills.io/specification
 *
 * @example
 * ```ts
 * const [activateSkill, readSkillResource] = createSkillActivationTools(registry);
 * // activateSkill       — load full SKILL.md body
 * // readSkillResource   — load a resource file from a skill
 *
 * // Or use the convenience method:
 * const [activateSkill, readSkillResource] = registry.toActivationTools();
 * ```
 */

import { readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';
import { ToolBuilder } from '../tools/builder.js';
import { ToolCategory } from '../tools/types.js';
import type { Tool } from '../tools/types.js';
import type { SkillRegistry } from './registry.js';
import { SkillRegistryEvent } from './types.js';
import { evaluateTrustPolicy } from './trust.js';
import { createLogger, LogLevel } from '../langgraph/observability/logger.js';

const logger = createLogger('agentforge:core:skills:activation', { level: LogLevel.INFO });

// ─── Schemas ─────────────────────────────────────────────────────────────

const activateSkillSchema = z.object({
  name: z.string().describe('The name of the skill to activate (e.g., "code-review")'),
});

const readSkillResourceSchema = z.object({
  name: z.string().describe('The name of the skill that owns the resource'),
  path: z.string().describe('Relative path to the resource file within the skill directory (e.g., "references/GUIDE.md", "scripts/setup.sh")'),
});

// ─── Path Security ───────────────────────────────────────────────────────

/**
 * Resolve a resource path within a skill root, blocking path traversal.
 *
 * @param skillPath - Absolute path to the skill directory
 * @param resourcePath - Relative path to the resource file
 * @returns Absolute path to the resource, or an error string
 */
export function resolveResourcePath(
  skillPath: string,
  resourcePath: string,
): { success: true; resolvedPath: string } | { success: false; error: string } {
  // Reject absolute paths using platform-aware check
  if (isAbsolute(resourcePath)) {
    return { success: false, error: 'Absolute resource paths are not allowed' };
  }

  // Reject traversal via segment-based '..' detection
  // Split on both '/' and '\' to handle cross-platform separators
  const segments = resourcePath.split(/[/\\]/);
  if (segments.some((seg) => seg === '..')) {
    return { success: false, error: 'Path traversal is not allowed — resource paths must stay within the skill directory' };
  }

  // Resolve and verify containment (final guard)
  const resolvedPath = resolve(skillPath, resourcePath);
  const resolvedSkillPath = resolve(skillPath);

  // Ensure the resolved path is within the skill directory
  const rel = relative(resolvedSkillPath, resolvedPath);
  if (rel.startsWith('..') || resolve(resolvedSkillPath, rel) !== resolvedPath) {
    return { success: false, error: 'Path traversal is not allowed — resource paths must stay within the skill directory' };
  }

  // Guard against symlink escapes: resolve real filesystem paths and
  // verify that the real target still sits under the real skill root.
  // This prevents a symlink inside the skill dir from pointing outside.
  try {
    const realSkillRoot = realpathSync(resolvedSkillPath);
    const realTarget = realpathSync(resolvedPath);
    const realRel = relative(realSkillRoot, realTarget);
    if (realRel.startsWith('..') || isAbsolute(realRel)) {
      return { success: false, error: 'Symlink target escapes the skill directory — access denied' };
    }
  } catch {
    // File doesn't exist yet (or can't be stat'd) — skip symlink check.
    // The caller (readFileSync) will produce a clear error if missing.
  }

  return { success: true, resolvedPath };
}

// ─── Tool Factories ──────────────────────────────────────────────────────

/**
 * Create the `activate-skill` tool bound to a registry instance.
 *
 * Resolves the skill by name, reads the full SKILL.md file, and returns
 * the body content (below frontmatter).
 *
 * @param registry - The SkillRegistry to resolve skills from
 * @returns An AgentForge Tool
 */
export function createActivateSkillTool(
  registry: SkillRegistry,
): Tool<z.infer<typeof activateSkillSchema>, string> {
  return new ToolBuilder<z.infer<typeof activateSkillSchema>, string>()
    .name('activate-skill')
    .description(
      'Activate an Agent Skill by name, loading its full instructions. ' +
      'Returns the complete SKILL.md body content for the named skill. ' +
      'Use this when you see a relevant skill in <available_skills> and want to follow its instructions.',
    )
    .category(ToolCategory.SKILLS)
    .tags(['skill', 'activation', 'agent-skills'])
    .schema(activateSkillSchema)
    .implement(async ({ name }) => {
      const skill = registry.get(name);

      if (!skill) {
        const availableNames = registry.getNames();
        const suggestion = availableNames.length > 0
          ? ` Available skills: ${availableNames.join(', ')}`
          : ' No skills are currently registered.';
        const errorMsg = `Skill "${name}" not found.${suggestion}`;

        logger.warn('Skill activation failed — not found', { name, availableCount: availableNames.length });
        return errorMsg;
      }

      // Read the full SKILL.md body from disk (progressive disclosure)
      const skillMdPath = resolve(skill.skillPath, 'SKILL.md');
      try {
        const content = readFileSync(skillMdPath, 'utf-8');

        // Extract body below frontmatter
        const body = extractBody(content);

        logger.info('Skill activated', {
          name: skill.metadata.name,
          skillPath: skill.skillPath,
          bodyLength: body.length,
        });

        registry.emitEvent(SkillRegistryEvent.SKILL_ACTIVATED, {
          name: skill.metadata.name,
          skillPath: skill.skillPath,
          bodyLength: body.length,
        });

        return body;
      } catch (error) {
        const errorMsg = `Failed to read skill "${name}" instructions: ${error instanceof Error ? error.message : String(error)}`;
        logger.error('Skill activation failed — read error', {
          name,
          skillPath: skill.skillPath,
          error: error instanceof Error ? error.message : String(error),
        });
        return errorMsg;
      }
    })
    .build();
}

/**
 * Create the `read-skill-resource` tool bound to a registry instance.
 *
 * Resolves the skill by name, validates the resource path (blocking
 * traversal), and returns the file content.
 *
 * @param registry - The SkillRegistry to resolve skills from
 * @returns An AgentForge Tool
 */
export function createReadSkillResourceTool(
  registry: SkillRegistry,
): Tool<z.infer<typeof readSkillResourceSchema>, string> {
  return new ToolBuilder<z.infer<typeof readSkillResourceSchema>, string>()
    .name('read-skill-resource')
    .description(
      'Read a resource file from an activated Agent Skill. ' +
      'Returns the content of a file within the skill directory (e.g., references/, scripts/, assets/). ' +
      'The path must be relative to the skill root and cannot traverse outside it.',
    )
    .category(ToolCategory.SKILLS)
    .tags(['skill', 'resource', 'agent-skills'])
    .schema(readSkillResourceSchema)
    .implement(async ({ name, path: resourcePath }) => {
      const skill = registry.get(name);

      if (!skill) {
        const availableNames = registry.getNames();
        const suggestion = availableNames.length > 0
          ? ` Available skills: ${availableNames.join(', ')}`
          : ' No skills are currently registered.';
        const errorMsg = `Skill "${name}" not found.${suggestion}`;

        logger.warn('Skill resource load failed — skill not found', { name, resourcePath });
        return errorMsg;
      }

      // Resolve and validate the resource path
      const pathResult = resolveResourcePath(skill.skillPath, resourcePath);
      if (!pathResult.success) {
        logger.warn('Skill resource load blocked — path traversal', {
          name,
          resourcePath,
          error: pathResult.error,
        });
        return pathResult.error;
      }

      // Enforce trust policy for script resources
      const policyDecision = evaluateTrustPolicy(
        resourcePath,
        skill.trustLevel,
        registry.getAllowUntrustedScripts(),
      );

      if (!policyDecision.allowed) {
        logger.warn('Skill resource load blocked — trust policy', {
          name,
          resourcePath,
          trustLevel: skill.trustLevel,
          reason: policyDecision.reason,
          message: policyDecision.message,
        });

        registry.emitEvent(SkillRegistryEvent.TRUST_POLICY_DENIED, {
          name: skill.metadata.name,
          resourcePath,
          trustLevel: skill.trustLevel,
          reason: policyDecision.reason,
          message: policyDecision.message,
        });

        return policyDecision.message;
      }

      // Log allowed policy decisions for auditing (scripts only)
      if (policyDecision.reason !== 'not-script') {
        logger.info('Skill resource trust policy — allowed', {
          name,
          resourcePath,
          trustLevel: skill.trustLevel,
          reason: policyDecision.reason,
        });

        registry.emitEvent(SkillRegistryEvent.TRUST_POLICY_ALLOWED, {
          name: skill.metadata.name,
          resourcePath,
          trustLevel: skill.trustLevel,
          reason: policyDecision.reason,
        });
      }

      try {
        const content = readFileSync(pathResult.resolvedPath, 'utf-8');

        logger.info('Skill resource loaded', {
          name: skill.metadata.name,
          resourcePath,
          resolvedPath: pathResult.resolvedPath,
          contentLength: content.length,
        });

        registry.emitEvent(SkillRegistryEvent.SKILL_RESOURCE_LOADED, {
          name: skill.metadata.name,
          resourcePath,
          resolvedPath: pathResult.resolvedPath,
          contentLength: content.length,
        });

        return content;
      } catch (error) {
        const errorMsg = `Failed to read resource "${resourcePath}" from skill "${name}": ${error instanceof Error ? error.message : String(error)}`;
        logger.warn('Skill resource load failed — file not found or unreadable', {
          name,
          resourcePath,
          error: error instanceof Error ? error.message : String(error),
        });
        return errorMsg;
      }
    })
    .build();
}

/**
 * Create both skill activation tools bound to a registry instance.
 *
 * @param registry - The SkillRegistry to bind tools to
 * @returns Array of both tools [activate-skill, read-skill-resource]
 */
export function createSkillActivationTools(
  registry: SkillRegistry,
): [Tool<z.infer<typeof activateSkillSchema>, string>, Tool<z.infer<typeof readSkillResourceSchema>, string>] {
  return [
    createActivateSkillTool(registry),
    createReadSkillResourceTool(registry),
  ];
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Extract the body content below YAML frontmatter from a SKILL.md file.
 *
 * Delegates to `gray-matter` for consistent frontmatter handling across
 * the codebase (matches `parseSkillContent()` in parser.ts).
 *
 * @param content - The full SKILL.md file content
 * @returns The body content below the frontmatter
 */
function extractBody(content: string): string {
  return matter(content).content.trim();
}
