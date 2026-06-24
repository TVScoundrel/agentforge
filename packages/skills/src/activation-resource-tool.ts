import { readFileSync } from 'node:fs';
import { ToolBuilder, ToolCategory } from '@agentforge/core';
import type { Tool } from '@agentforge/core';
import type { z } from 'zod';
import type { SkillRegistry } from './registry.js';
import { evaluateTrustPolicy } from './trust.js';
import { SkillRegistryEvent, TrustPolicyReason } from './types.js';
import { resolveResourcePath } from './activation-path.js';
import { readSkillResourceSchema } from './activation-schemas.js';
import { activationLogger, buildMissingSkillMessage } from './activation-shared.js';

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
        const { errorMessage } = buildMissingSkillMessage(registry, name);
        activationLogger.warn('Skill resource load failed — skill not found', { name, resourcePath });
        return errorMessage;
      }

      const pathResult = resolveResourcePath(skill.skillPath, resourcePath);
      if (!pathResult.success) {
        activationLogger.warn('Skill resource load blocked — path traversal', {
          name,
          resourcePath,
          error: pathResult.error,
        });
        return pathResult.error;
      }

      const policyDecision = evaluateTrustPolicy(
        resourcePath,
        skill.trustLevel,
        registry.getAllowUntrustedScripts(),
      );

      if (!policyDecision.allowed) {
        activationLogger.warn('Skill resource load blocked — trust policy', {
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

      if (policyDecision.reason !== TrustPolicyReason.NOT_SCRIPT) {
        activationLogger.info('Skill resource trust policy — allowed', {
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

        activationLogger.info('Skill resource loaded', {
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
        const message = error instanceof Error ? error.message : String(error);
        activationLogger.warn('Skill resource load failed — file not found or unreadable', {
          name,
          resourcePath,
          error: message,
        });
        return `Failed to read resource "${resourcePath}" from skill "${name}": ${message}`;
      }
    })
    .build();
}
