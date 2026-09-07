import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SkillRegistry } from './registry.js';
import { SkillRegistryEvent, TrustPolicyReason } from './types.js';
import { extractBody } from './activation-content.js';
import { resolveResourcePath } from './activation-path.js';
import { activationLogger } from './activation-shared.js';
import { evaluateSkillActivationPolicy, evaluateTrustPolicy } from './trust.js';

export type SkillActivationResult =
  | { kind: 'success'; body: string }
  | { kind: 'skill-not-found'; name: string; availableNames: string[] }
  | { kind: 'access-denied'; reason: TrustPolicyReason; message: string }
  | { kind: 'read-failure'; name: string; error: string };

export type SkillResourceResult =
  | { kind: 'success'; content: string }
  | { kind: 'skill-not-found'; name: string; availableNames: string[] }
  | { kind: 'access-denied'; message: string; reason?: TrustPolicyReason }
  | { kind: 'resource-not-found'; name: string; resourcePath: string; error: string }
  | { kind: 'read-failure'; name: string; resourcePath: string; error: string };

/** Package-internal owner of Agent Skill lookup, policy, reads, and audit signals. */
export class AgentSkillAccess {
  constructor(private readonly registry: SkillRegistry) {}

  async readResource(name: string, resourcePath: string): Promise<SkillResourceResult> {
    const skill = this.registry.get(name);
    if (!skill) {
      const availableNames = this.registry.getNames();
      activationLogger.warn('Skill resource load failed — skill not found', {
        name,
        resourcePath,
      });
      return { kind: 'skill-not-found', name, availableNames };
    }

    const pathResult = resolveResourcePath(skill.skillPath, resourcePath);
    if (!pathResult.success) {
      activationLogger.warn('Skill resource load blocked — path traversal', {
        name,
        resourcePath,
        error: pathResult.error,
      });
      return { kind: 'access-denied', message: pathResult.error };
    }

    const skillInstructionsPath = resolve(skill.skillPath, 'SKILL.md');
    let isSkillInstructions =
      pathResult.resolvedPath.toLowerCase() === skillInstructionsPath.toLowerCase();
    if (!isSkillInstructions) {
      try {
        isSkillInstructions =
          realpathSync(pathResult.resolvedPath).toLowerCase() ===
          realpathSync(skillInstructionsPath).toLowerCase();
      } catch {
        // The resource read below reports missing or unreadable paths.
      }
    }
    if (isSkillInstructions) {
      const activationDecision = evaluateSkillActivationPolicy(skill.trustLevel);
      if (!activationDecision.allowed) {
        activationLogger.warn('Skill resource load blocked — skill instructions trust policy', {
          name,
          resourcePath,
          trustLevel: skill.trustLevel,
          reason: activationDecision.reason,
          message: activationDecision.message,
        });

        this.registry.emitEvent(SkillRegistryEvent.TRUST_POLICY_DENIED, {
          name: skill.metadata.name,
          resourcePath: 'SKILL.md',
          trustLevel: skill.trustLevel,
          reason: activationDecision.reason,
          message: activationDecision.message,
        });

        return {
          kind: 'access-denied',
          reason: activationDecision.reason,
          message: activationDecision.message,
        };
      }
    }

    const policyDecision = evaluateTrustPolicy(
      resourcePath,
      skill.trustLevel,
      this.registry.getAllowUntrustedScripts()
    );
    if (!policyDecision.allowed) {
      activationLogger.warn('Skill resource load blocked — trust policy', {
        name,
        resourcePath,
        trustLevel: skill.trustLevel,
        reason: policyDecision.reason,
        message: policyDecision.message,
      });

      this.registry.emitEvent(SkillRegistryEvent.TRUST_POLICY_DENIED, {
        name: skill.metadata.name,
        resourcePath,
        trustLevel: skill.trustLevel,
        reason: policyDecision.reason,
        message: policyDecision.message,
      });

      return {
        kind: 'access-denied',
        reason: policyDecision.reason,
        message: policyDecision.message,
      };
    }

    if (policyDecision.reason !== TrustPolicyReason.NOT_SCRIPT) {
      activationLogger.info('Skill resource trust policy — allowed', {
        name,
        resourcePath,
        trustLevel: skill.trustLevel,
        reason: policyDecision.reason,
      });

      this.registry.emitEvent(SkillRegistryEvent.TRUST_POLICY_ALLOWED, {
        name: skill.metadata.name,
        resourcePath,
        trustLevel: skill.trustLevel,
        reason: policyDecision.reason,
      });
    }

    let content: string;
    try {
      content = readFileSync(pathResult.resolvedPath, 'utf-8');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      activationLogger.warn('Skill resource load failed — file not found or unreadable', {
        name,
        resourcePath,
        error: message,
      });
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { kind: 'resource-not-found', name, resourcePath, error: message };
      }
      return { kind: 'read-failure', name, resourcePath, error: message };
    }

    activationLogger.info('Skill resource loaded', {
      name: skill.metadata.name,
      resourcePath,
      resolvedPath: pathResult.resolvedPath,
      contentLength: content.length,
    });

    this.registry.emitEvent(SkillRegistryEvent.SKILL_RESOURCE_LOADED, {
      name: skill.metadata.name,
      resourcePath,
      resolvedPath: pathResult.resolvedPath,
      contentLength: content.length,
    });

    return { kind: 'success', content };
  }

  async activate(name: string): Promise<SkillActivationResult> {
    const skill = this.registry.get(name);
    if (!skill) {
      const availableNames = this.registry.getNames();
      activationLogger.warn('Skill activation failed — not found', {
        name,
        availableCount: availableNames.length,
      });
      return { kind: 'skill-not-found', name, availableNames };
    }

    const policyDecision = evaluateSkillActivationPolicy(skill.trustLevel);
    if (!policyDecision.allowed) {
      activationLogger.warn('Skill activation blocked — trust policy', {
        name,
        trustLevel: skill.trustLevel,
        reason: policyDecision.reason,
        message: policyDecision.message,
      });

      this.registry.emitEvent(SkillRegistryEvent.TRUST_POLICY_DENIED, {
        name: skill.metadata.name,
        resourcePath: 'SKILL.md',
        trustLevel: skill.trustLevel,
        reason: policyDecision.reason,
        message: policyDecision.message,
      });

      return {
        kind: 'access-denied',
        reason: policyDecision.reason,
        message: policyDecision.message,
      };
    }

    let body: string;
    try {
      const content = readFileSync(resolve(skill.skillPath, 'SKILL.md'), 'utf-8');
      body = extractBody(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      activationLogger.error('Skill activation failed — read error', {
        name,
        skillPath: skill.skillPath,
        error: message,
      });
      return { kind: 'read-failure', name, error: message };
    }

    activationLogger.info('Skill activated', {
      name: skill.metadata.name,
      skillPath: skill.skillPath,
      bodyLength: body.length,
      trustLevel: skill.trustLevel,
      activationReason: policyDecision.reason,
    });

    this.registry.emitEvent(SkillRegistryEvent.SKILL_ACTIVATED, {
      name: skill.metadata.name,
      skillPath: skill.skillPath,
      bodyLength: body.length,
      trustLevel: skill.trustLevel,
    });

    return { kind: 'success', body };
  }
}
