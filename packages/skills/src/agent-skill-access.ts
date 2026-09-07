import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SkillRegistry } from './registry.js';
import { SkillRegistryEvent } from './types.js';
import type { TrustPolicyReason } from './types.js';
import { extractBody } from './activation-content.js';
import { activationLogger } from './activation-shared.js';
import { evaluateSkillActivationPolicy } from './trust.js';

export type SkillActivationResult =
  | { kind: 'success'; body: string }
  | { kind: 'skill-not-found'; name: string; availableNames: string[] }
  | { kind: 'access-denied'; reason: TrustPolicyReason; message: string }
  | { kind: 'read-failure'; name: string; error: string };

/** Package-internal owner of Agent Skill lookup, policy, reads, and audit signals. */
export class AgentSkillAccess {
  constructor(private readonly registry: SkillRegistry) {}

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
