import { ToolBuilder, ToolCategory } from '@agentforge/core';
import type { Tool } from '@agentforge/core';
import type { z } from 'zod';
import type { SkillRegistry } from './registry.js';
import { AgentSkillAccess } from './agent-skill-access.js';
import { readSkillResourceSchema } from './activation-schemas.js';
import { formatMissingSkillMessage } from './activation-shared.js';

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
  registry: SkillRegistry
): Tool<z.infer<typeof readSkillResourceSchema>, string> {
  const access = new AgentSkillAccess(registry);

  return new ToolBuilder<z.infer<typeof readSkillResourceSchema>, string>()
    .name('read-skill-resource')
    .description(
      'Read a resource file from an activated Agent Skill. ' +
        'Returns the content of a file within the skill directory (e.g., references/, scripts/, assets/). ' +
        'The path must be relative to the skill root and cannot traverse outside it. ' +
        'SKILL.md is only readable from workspace or trusted roots.'
    )
    .category(ToolCategory.SKILLS)
    .tags(['skill', 'resource', 'agent-skills'])
    .schema(readSkillResourceSchema)
    .implement(async ({ name, path: resourcePath }) => {
      const result = await access.readResource(name, resourcePath);

      switch (result.kind) {
        case 'success':
          return result.content;
        case 'skill-not-found':
          return formatMissingSkillMessage(result.name, result.availableNames);
        case 'access-denied':
          return result.message;
        case 'resource-not-found':
        case 'read-failure':
          return `Failed to read resource "${result.resourcePath}" from skill "${result.name}": ${result.error}`;
      }
    })
    .build();
}
