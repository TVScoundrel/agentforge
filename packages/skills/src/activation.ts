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

import type { Tool } from '@agentforge/core';
import type { z } from 'zod';
import type { SkillRegistry } from './registry.js';
import { createActivateSkillTool } from './activation-activate-tool.js';
import { createReadSkillResourceTool } from './activation-resource-tool.js';
import type { activateSkillSchema, readSkillResourceSchema } from './activation-schemas.js';

export { createActivateSkillTool } from './activation-activate-tool.js';
export { resolveResourcePath } from './activation-path.js';
export { createReadSkillResourceTool } from './activation-resource-tool.js';

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
