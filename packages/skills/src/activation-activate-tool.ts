import { ToolBuilder, ToolCategory } from '@agentforge/core';
import type { Tool } from '@agentforge/core';
import type { z } from 'zod';
import type { SkillRegistry } from './registry.js';
import { AgentSkillAccess } from './agent-skill-access.js';
import { activateSkillSchema } from './activation-schemas.js';
import { formatMissingSkillMessage } from './activation-shared.js';

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
  const access = new AgentSkillAccess(registry);

  return new ToolBuilder<z.infer<typeof activateSkillSchema>, string>()
    .name('activate-skill')
    .description(
      'Activate an Agent Skill by name, loading its full instructions for trusted roots. ' +
      'Returns the complete SKILL.md body content for workspace or explicitly trusted skills. ' +
      'Use this when you see a relevant skill in <available_skills> or <untrusted_skills>; ' +
      'activation is blocked for untrusted roots until they are promoted.',
    )
    .category(ToolCategory.SKILLS)
    .tags(['skill', 'activation', 'agent-skills'])
    .schema(activateSkillSchema)
    .implement(async ({ name }) => {
      const result = await access.activate(name);

      switch (result.kind) {
        case 'success':
          return result.body;
        case 'skill-not-found':
          return formatMissingSkillMessage(result.name, result.availableNames);
        case 'access-denied':
          return result.message;
        case 'read-failure':
          return `Failed to read skill "${result.name}" instructions: ${result.error}`;
      }
    })
    .build();
}
