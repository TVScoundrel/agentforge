/**
 * Skill Trust Policy Engine
 *
 * Enforces trust-level-based access control for skill resources.
 * Scripts from untrusted roots are denied by default unless explicitly allowed.
 *
 * Trust levels:
 * - `workspace` — Project-local skills, highest trust. Scripts always allowed.
 * - `trusted`   — Explicitly trusted roots. Scripts allowed.
 * - `untrusted` — Community or third-party skills. Scripts denied by default.
 *
 * @see https://agentskills.io/specification
 */

import type { TrustLevel, TrustPolicyDecision, SkillRootConfig } from './types.js';
import { TrustPolicyReason } from './types.js';

// ─── Constants ───────────────────────────────────────────────────────────

/**
 * Resource path prefix that requires trust enforcement.
 *
 * Only resources under `scripts/` are subject to trust policy checks.
 * Other directories (references/, assets/, etc.) are always accessible.
 */
const SCRIPT_PATH_PREFIX = 'scripts/';
const SCRIPT_PATH_EXACT = 'scripts';

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Normalize a skill root config entry.
 *
 * String entries default to `'untrusted'` trust level for safe defaults.
 *
 * @param root - A string path or SkillRootConfig object
 * @returns Normalized SkillRootConfig with explicit trust level
 */
export function normalizeRootConfig(root: string | SkillRootConfig): SkillRootConfig {
  if (typeof root === 'string') {
    return { path: root, trust: 'untrusted' };
  }
  return root;
}

/**
 * Check whether a resource path refers to a script.
 *
 * A resource is considered a script if its relative path starts with
 * `scripts/` or is exactly `scripts`.
 *
 * @param resourcePath - Relative path within the skill directory
 * @returns True if the resource is in the scripts/ directory
 */
export function isScriptResource(resourcePath: string): boolean {
  // Normalize to forward slashes for consistent checking
  const normalized = resourcePath.replace(/\\/g, '/');
  return normalized === SCRIPT_PATH_EXACT
    || normalized.startsWith(SCRIPT_PATH_PREFIX);
}

// ─── Policy Engine ───────────────────────────────────────────────────────

/**
 * Evaluate the trust policy for a resource access request.
 *
 * Non-script resources are always allowed regardless of trust level.
 * Script resources require `workspace` or `trusted` trust, or the
 * `allowUntrustedScripts` override to be enabled.
 *
 * @param resourcePath - Relative path to the resource within the skill directory
 * @param trustLevel - Trust level of the skill's root directory
 * @param allowUntrustedScripts - Override flag to permit untrusted scripts
 * @returns Policy decision with allow/deny, reason code, and message
 */
export function evaluateTrustPolicy(
  resourcePath: string,
  trustLevel: TrustLevel,
  allowUntrustedScripts: boolean = false,
): TrustPolicyDecision {
  // Non-script resources — no policy enforcement needed
  if (!isScriptResource(resourcePath)) {
    return {
      allowed: true,
      reason: TrustPolicyReason.NOT_SCRIPT,
      message: 'Resource is not a script — no trust check required',
    };
  }

  // Script resources — check trust level
  switch (trustLevel) {
    case 'workspace':
      return {
        allowed: true,
        reason: TrustPolicyReason.WORKSPACE_TRUST,
        message: 'Script allowed — skill root has workspace trust',
      };

    case 'trusted':
      return {
        allowed: true,
        reason: TrustPolicyReason.TRUSTED_ROOT,
        message: 'Script allowed — skill root is explicitly trusted',
      };

    case 'untrusted':
      if (allowUntrustedScripts) {
        return {
          allowed: true,
          reason: TrustPolicyReason.UNTRUSTED_SCRIPT_ALLOWED,
          message: 'Script from untrusted root allowed via allowUntrustedScripts override',
        };
      }
      return {
        allowed: false,
        reason: TrustPolicyReason.UNTRUSTED_SCRIPT_DENIED,
        message: `Script access denied — skill root is untrusted. ` +
          `Scripts from untrusted roots are blocked by default for security. ` +
          `To allow, set 'allowUntrustedScripts: true' in SkillRegistryConfig or ` +
          `promote the skill root to 'trusted' or 'workspace' trust level.`,
      };

    default:
      return {
        allowed: false,
        reason: TrustPolicyReason.UNTRUSTED_SCRIPT_DENIED,
        message: `Script access denied — unknown trust level "${trustLevel}"`,
      };
  }
}
