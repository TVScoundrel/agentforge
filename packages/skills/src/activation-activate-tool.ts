import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ToolBuilder, ToolCategory } from '@agentforge/core';
import type { Tool } from '@agentforge/core';
import type { z } from 'zod';
import type { SkillRegistry } from './registry.js';
import { SkillRegistryEvent } from './types.js';
import { extractBody } from './activation-content.js';
import { activateSkillSchema } from './activation-schemas.js';
import { activationLogger, buildMissingSkillMessage } from './activation-shared.js';

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
        const { availableCount, errorMessage } = buildMissingSkillMessage(registry, name);
        activationLogger.warn('Skill activation failed — not found', { name, availableCount });
        return errorMessage;
      }

      const skillMdPath = resolve(skill.skillPath, 'SKILL.md');
      try {
        const content = readFileSync(skillMdPath, 'utf-8');
        const body = extractBody(content);

        activationLogger.info('Skill activated', {
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
        const message = error instanceof Error ? error.message : String(error);
        activationLogger.error('Skill activation failed — read error', {
          name,
          skillPath: skill.skillPath,
          error: message,
        });
        return `Failed to read skill "${name}" instructions: ${message}`;
      }
    })
    .build();
}
